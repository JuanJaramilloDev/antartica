import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { Cargando } from '../../components/loading/cargando';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { CategoriaGasto, Gasto, ResumenMes } from '../../models/modelos';
import { FechaCortaPipe } from '../../pipes/fecha-corta';
import { MonedaPipe } from '../../pipes/moneda';
import { CierresService, mesSiguiente } from '../../services/cierres';
import { mensajeDeError } from '../../services/supabase';
import { fechaIso, finDeMes, nombreMes } from '../../utils/fechas';

type CategoriaManual = Extract<CategoriaGasto, 'Reinversión' | 'Otro'>;

@Component({
  selector: 'app-detalle-mes',
  imports: [Cargando, CampoMoneda, MonedaPipe, FechaCortaPipe],
  templateUrl: './detalle-mes.html',
})
export class DetalleMes implements OnInit {
  private readonly servicio = inject(CierresService);

  readonly mes = input.required<ResumenMes>();
  readonly sueldoMioMes = input(0);
  readonly cambiado = output<void>();
  readonly cerrar = output<void>();

  protected readonly nombreMes = nombreMes;
  protected readonly gastos = signal<Gasto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly borrandoId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly categoria = signal<CategoriaManual>('Reinversión');
  protected readonly monto = signal<number | null>(null);
  protected readonly descripcion = signal('');
  protected readonly fecha = signal('');

  protected readonly gastosManuales = computed(() => this.gastos().filter((g) => !g.cierreId));
  protected readonly gastoValido = computed(() => (this.monto() ?? 0) > 0 && this.fecha() !== '');

  private readonly fechaPorDefecto = computed(() => {
    const hoy = fechaIso();
    const mes = this.mes().mes;
    return hoy >= mes && hoy < mesSiguiente(mes) ? hoy : finDeMes(mes);
  });

  ngOnInit(): void {
    this.fecha.set(this.fechaPorDefecto());
    this.cargarGastos();
  }

  private async cargarGastos(): Promise<void> {
    this.cargando.set(true);
    try {
      this.gastos.set(await this.servicio.gastosDelMes(this.mes().mes));
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected async registrarGasto(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.gastoValido() || this.guardando()) return;
    await this.guardarGasto({
      categoria: this.categoria(),
      monto: this.monto()!,
      descripcion: this.descripcion().trim() || null,
      fecha: this.fecha(),
    });
    this.monto.set(null);
    this.descripcion.set('');
  }

  protected async pagarMiSueldo(): Promise<void> {
    if (!this.sueldoMioMes() || this.guardando()) return;
    await this.guardarGasto({
      categoria: 'Mi sueldo',
      monto: this.sueldoMioMes(),
      descripcion: nombreMes(this.mes().mes),
      fecha: this.fechaPorDefecto(),
    });
  }

  private async guardarGasto(gasto: Omit<Gasto, 'id' | 'cierreId'>): Promise<void> {
    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.servicio.registrarGasto(gasto);
      await this.cargarGastos();
      this.cambiado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async eliminarGasto(gasto: Gasto): Promise<void> {
    if (this.guardando()) return;
    if (this.borrandoId() !== gasto.id) {
      this.borrandoId.set(gasto.id);
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.servicio.eliminarGasto(gasto.id);
      await this.cargarGastos();
      this.cambiado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.borrandoId.set(null);
      this.guardando.set(false);
    }
  }
}
