import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { Cargando } from '../../components/loading/cargando';
import { Contador } from '../../components/stepper/contador';
import { CierreDia, PRECIO_LICOR, VasosDelDia } from '../../models/modelos';
import { MonedaPipe } from '../../pipes/moneda';
import { CierresService } from '../../services/cierres';
import { PedidosService } from '../../services/pedidos';
import { mensajeDeError } from '../../services/supabase';
import { VasosService } from '../../services/vasos';
import { fechaIso } from '../../utils/fechas';

@Component({
  selector: 'app-cerrar-dia',
  imports: [Cargando, CampoMoneda, Contador, MonedaPipe],
  templateUrl: './cerrar-dia.html',
})
export class CerrarDia implements OnInit {
  private readonly cierres = inject(CierresService);
  private readonly vasosServicio = inject(VasosService);
  private readonly pedidosServicio = inject(PedidosService);

  readonly fechaInicial = input(fechaIso());
  readonly sueldoPorDefecto = input(0);
  readonly guardado = output<void>();
  readonly cancelar = output<void>();

  protected readonly hoy = fechaIso();
  protected readonly fecha = signal(this.hoy);
  protected readonly vasos = signal<VasosDelDia[]>([]);
  protected readonly cierre = signal<CierreDia | null>(null);
  protected readonly registrados = signal(new Map<string, number>());
  protected readonly sobrantes = signal<Record<string, number>>({});
  protected readonly conLicor = signal(0);
  protected readonly precioLicor = signal(PRECIO_LICOR);
  protected readonly sueldo = signal<number | null>(null);
  protected readonly nota = signal('');
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly filas = computed(() =>
    this.vasos()
      .map((v) => {
        const tenia = v.arrastre + v.cantidad;
        const sobran = this.sobrantes()[v.productoId] ?? 0;
        const registrados = this.registrados().get(v.nombre) ?? 0;
        const vendidos = Math.max(tenia - sobran, registrados, 0);
        return { ...v, tenia, sobran, vendidos, total: vendidos * v.precioVenta };
      })
      .filter((f) => f.tenia > 0 || f.vendidos > 0),
  );

  protected readonly vasosVendidos = computed(() => this.filas().reduce((t, f) => t + f.vendidos, 0));
  protected readonly totalLicor = computed(() => this.conLicor() * this.precioLicor());
  protected readonly totalVentas = computed(
    () => this.filas().reduce((t, f) => t + f.total, 0) + this.totalLicor(),
  );
  protected readonly debeHaber = computed(() => this.totalVentas() - (this.sueldo() ?? 0));
  protected readonly hayErrores = computed(() => this.filas().some((f) => f.sobran > f.tenia));

  ngOnInit(): void {
    this.fecha.set(this.fechaInicial());
    this.cargar();
  }

  protected cambiarFecha(fecha: string): void {
    if (!fecha || fecha > this.hoy || fecha === this.fecha()) return;
    this.fecha.set(fecha);
    this.cargar();
  }

  private async cargar(): Promise<void> {
    const fecha = this.fecha();
    this.cargando.set(true);
    this.error.set(null);
    try {
      const [vasos, pedidos, cierre, precioLicor] = await Promise.all([
        this.vasosServicio.delDia(fecha),
        this.pedidosServicio.deFecha(fecha),
        this.cierres.cierreDeFecha(fecha),
        this.cierres.precioLicor(),
      ]);
      if (fecha !== this.fecha()) return;

      const registrados = new Map<string, number>();
      for (const pedido of pedidos) {
        for (const item of pedido.items) {
          registrados.set(item.nombre, (registrados.get(item.nombre) ?? 0) + item.cantidad);
        }
      }

      this.vasos.set(vasos);
      this.cierre.set(cierre);
      this.registrados.set(registrados);
      this.sobrantes.set(Object.fromEntries(vasos.map((v) => [v.productoId, v.sobrantes ?? 0])));
      this.sueldo.set(cierre?.estado === 'verificado' ? cierre.sueldoEmpleada : this.sueldoPorDefecto());
      this.nota.set(cierre?.nota ?? '');
      this.conLicor.set(cierre?.conLicor ?? 0);
      this.precioLicor.set(precioLicor);
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      if (fecha === this.fecha()) this.cargando.set(false);
    }
  }

  protected fijarSobrantes(productoId: string, cantidad: number): void {
    this.sobrantes.update((actual) => ({ ...actual, [productoId]: Math.round(cantidad) }));
  }

  protected redondear(cantidad: number): number {
    return Math.max(0, Math.round(cantidad));
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.hayErrores() || this.guardando() || this.cargando()) return;

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.cierres.cerrarDiaAdmin(
        this.fecha(),
        this.sobrantes(),
        this.sueldo() ?? 0,
        this.nota(),
        this.conLicor(),
      );
      this.guardado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }
}
