import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { Contador } from '../../components/stepper/contador';
import { CierreDia, VasosDelDia } from '../../models/modelos';
import { FechaCortaPipe } from '../../pipes/fecha-corta';
import { MonedaPipe } from '../../pipes/moneda';
import { CierresService } from '../../services/cierres';
import { mensajeDeError } from '../../services/supabase';
import { VasosService } from '../../services/vasos';
import { fechaIso } from '../../utils/fechas';

@Component({
  selector: 'app-formulario-cierre',
  imports: [CampoMoneda, Contador, MonedaPipe, FechaCortaPipe],
  templateUrl: './formulario-cierre.html',
})
export class FormularioCierre implements OnInit {
  private readonly cierres = inject(CierresService);
  private readonly vasosServicio = inject(VasosService);

  readonly cierre = input<CierreDia | null>(null);
  readonly sueldoPorDefecto = input(0);
  readonly guardado = output<void>();
  readonly cancelar = output<void>();

  protected readonly hoy = fechaIso();
  protected readonly fecha = signal(this.hoy);
  protected readonly vasos = signal<VasosDelDia[]>([]);
  protected readonly sobrantes = signal<Record<string, number>>({});
  protected readonly sueldo = signal<number | null>(null);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly confirmandoReabrir = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly esEdicion = computed(() => this.cierre() !== null);

  protected readonly filas = computed(() =>
    this.vasos()
      .filter((v) => v.cantidad > 0)
      .map((v) => {
        const sobran = this.sobrantes()[v.productoId] ?? 0;
        const vendidos = v.cantidad - sobran;
        return { ...v, sobran, vendidos, subtotal: Math.max(vendidos, 0) * v.precioVenta };
      }),
  );
  protected readonly vasosVendidos = computed(() =>
    this.filas().reduce((t, f) => t + Math.max(f.vendidos, 0), 0),
  );
  protected readonly totalVentas = computed(() => this.filas().reduce((t, f) => t + f.subtotal, 0));
  protected readonly debesTener = computed(() => this.totalVentas() - (this.sueldo() ?? 0));
  protected readonly hayErrores = computed(() => this.filas().some((f) => f.vendidos < 0));

  ngOnInit(): void {
    const cierre = this.cierre();
    if (cierre) this.fecha.set(cierre.fecha);
    this.sueldo.set(cierre ? cierre.sueldoEmpleada : this.sueldoPorDefecto());
    this.cargarVasos();
  }

  protected cambiarFecha(fecha: string): void {
    if (!fecha) return;
    this.fecha.set(fecha);
    this.cargarVasos();
  }

  private async cargarVasos(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const vasos = await this.vasosServicio.delDia(this.fecha());
      this.vasos.set(vasos);
      this.sobrantes.set(Object.fromEntries(vasos.map((v) => [v.productoId, v.sobrantes ?? 0])));
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected fijarSobrantes(productoId: string, cantidad: number): void {
    this.sobrantes.update((actual) => ({ ...actual, [productoId]: cantidad }));
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.hayErrores() || this.guardando()) return;

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.cierres.cerrarDia(this.fecha(), this.sobrantes(), this.sueldo() ?? 0);
      this.guardado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async reabrir(): Promise<void> {
    if (!this.esEdicion() || this.guardando()) return;
    if (!this.confirmandoReabrir()) {
      this.confirmandoReabrir.set(true);
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.cierres.reabrir(this.fecha());
      this.guardado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
      this.confirmandoReabrir.set(false);
    } finally {
      this.guardando.set(false);
    }
  }
}
