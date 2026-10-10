import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { Cargando } from '../../components/loading/cargando';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { Abono, Prestamo } from '../../models/modelos';
import { FechaCortaPipe } from '../../pipes/fecha-corta';
import { MonedaPipe } from '../../pipes/moneda';
import { PrestamosService } from '../../services/prestamos';
import { mensajeDeError } from '../../services/supabase';
import { diasDesde, fechaIso } from '../../utils/fechas';

@Component({
  selector: 'app-detalle-prestamo',
  imports: [Cargando, CampoMoneda, MonedaPipe, FechaCortaPipe],
  templateUrl: './detalle-prestamo.html',
})
export class DetallePrestamo implements OnInit {
  private readonly servicio = inject(PrestamosService);

  readonly prestamo = input.required<Prestamo>();
  readonly actualizado = output<Prestamo>();
  readonly editar = output<void>();
  readonly cerrar = output<void>();

  protected readonly abonos = signal<Abono[]>([]);
  protected readonly cargandoAbonos = signal(true);

  protected readonly montoAbono = signal<number | null>(null);
  protected readonly fechaAbono = signal(fechaIso());
  protected readonly guardando = signal(false);
  protected readonly borrandoId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly progreso = computed(() => {
    const p = this.prestamo();
    return p.monto ? Math.min(100, Math.round((p.abonado / p.monto) * 100)) : 0;
  });
  protected readonly vencido = computed(() => {
    const p = this.prestamo();
    return p.estado === 'pendiente' && p.fechaLimite !== null && diasDesde(p.fechaLimite) > 0;
  });
  protected readonly abonoValido = computed(() => {
    const monto = this.montoAbono() ?? 0;
    return monto > 0 && monto <= this.prestamo().saldo && this.fechaAbono() !== '';
  });

  ngOnInit(): void {
    this.cargarAbonos();
  }

  private async cargarAbonos(): Promise<void> {
    this.cargandoAbonos.set(true);
    try {
      this.abonos.set(await this.servicio.abonos(this.prestamo().id));
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargandoAbonos.set(false);
    }
  }

  protected pagoCompleto(): void {
    this.montoAbono.set(this.prestamo().saldo);
  }

  protected async registrarAbono(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.abonoValido() || this.guardando()) return;

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.servicio.registrarAbono(this.prestamo().id, this.montoAbono()!, this.fechaAbono());
      this.montoAbono.set(null);
      await this.refrescar();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async eliminarAbono(abono: Abono): Promise<void> {
    if (this.guardando()) return;
    if (this.borrandoId() !== abono.id) {
      this.borrandoId.set(abono.id);
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.servicio.eliminarAbono(abono.id);
      await this.refrescar();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.borrandoId.set(null);
      this.guardando.set(false);
    }
  }

  private async refrescar(): Promise<void> {
    const [prestamo, abonos] = await Promise.all([
      this.servicio.obtener(this.prestamo().id),
      this.servicio.abonos(this.prestamo().id),
    ]);
    this.abonos.set(abonos);
    this.actualizado.emit(prestamo);
  }
}
