import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { CierreDia, JugoDelDia, Pedido, VasosDelDia } from '../../models/modelos';
import { FechaCortaPipe } from '../../pipes/fecha-corta';
import { MonedaPipe } from '../../pipes/moneda';
import { CierresService } from '../../services/cierres';
import { JugosService } from '../../services/jugos';
import { PedidosService } from '../../services/pedidos';
import { mensajeDeError } from '../../services/supabase';
import { VasosService } from '../../services/vasos';

@Component({
  selector: 'app-verificar-cierre',
  imports: [CampoMoneda, MonedaPipe, FechaCortaPipe],
  templateUrl: './verificar-cierre.html',
  styles: `
    .aviso-cuadre {
      margin-top: 12px;
      padding: 12px 16px;
      border-radius: var(--radio-sm);
      font-weight: 600;
      text-align: center;
      background: rgba(239, 75, 75, 0.1);
      color: var(--rojo);
    }
    .aviso-cuadre.bien {
      background: rgba(47, 178, 106, 0.12);
      color: var(--verde);
    }
  `,
})
export class VerificarCierre implements OnInit {
  private readonly cierres = inject(CierresService);
  private readonly vasosServicio = inject(VasosService);
  private readonly pedidosServicio = inject(PedidosService);
  private readonly jugosServicio = inject(JugosService);

  readonly cierre = input.required<CierreDia>();
  readonly sueldoPorDefecto = input(0);
  readonly cambiado = output<void>();
  readonly cerrar = output<void>();

  protected readonly vasos = signal<VasosDelDia[]>([]);
  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly jugos = signal<JugoDelDia[]>([]);
  protected readonly sueldo = signal<number | null>(null);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly confirmandoReabrir = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly verificado = computed(() => this.cierre().estado === 'verificado');

  protected readonly filas = computed(() => {
    const registrados = new Map<string, number>();
    for (const pedido of this.pedidos()) {
      for (const item of pedido.items) {
        registrados.set(item.nombre, (registrados.get(item.nombre) ?? 0) + item.cantidad);
      }
    }
    return this.vasos()
      .map((v) => {
        const tenia = v.arrastre + v.cantidad;
        const sobran = v.sobrantes ?? 0;
        const porConteo = tenia - sobran;
        const vendidos = registrados.get(v.nombre) ?? 0;
        return { ...v, tenia, sobran, porConteo, vendidos, diferencia: porConteo - vendidos };
      })
      .filter((f) => f.tenia > 0 || f.vendidos > 0);
  });

  protected readonly jugosUsados = computed(() => this.jugos().filter((j) => j.usadosHoy > 0));
  protected readonly diferenciaEfectivo = computed(() => {
    const contado = this.cierre().efectivoContado;
    return contado === null ? null : contado - this.cierre().efectivo;
  });
  protected readonly debesTener = computed(
    () => this.cierre().totalVentas - (this.sueldo() ?? 0),
  );
  protected readonly cuadra = computed(
    () => this.filas().every((f) => f.diferencia === 0) && (this.diferenciaEfectivo() ?? 0) === 0,
  );

  ngOnInit(): void {
    const cierre = this.cierre();
    this.sueldo.set(cierre.estado === 'verificado' ? cierre.sueldoEmpleada : this.sueldoPorDefecto());
    this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const fecha = this.cierre().fecha;
      const [vasos, pedidos, jugos] = await Promise.all([
        this.vasosServicio.delDia(fecha),
        this.pedidosServicio.deFecha(fecha),
        this.jugosServicio.delDia(fecha),
      ]);
      this.vasos.set(vasos);
      this.pedidos.set(pedidos);
      this.jugos.set(jugos);
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected async verificar(): Promise<void> {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.cierres.verificar(this.cierre().fecha, this.sueldo() ?? 0);
      this.cambiado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async reabrir(): Promise<void> {
    if (this.guardando()) return;
    if (!this.confirmandoReabrir()) {
      this.confirmandoReabrir.set(true);
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.cierres.reabrir(this.cierre().fecha);
      this.cambiado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
      this.confirmandoReabrir.set(false);
    } finally {
      this.guardando.set(false);
    }
  }
}
