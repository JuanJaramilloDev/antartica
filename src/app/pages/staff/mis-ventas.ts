import { Component, computed, inject, signal } from '@angular/core';
import { Hoja } from '../../components/bottom-sheet/hoja';
import { Encabezado } from '../../components/page-header/encabezado';
import { CierreDia, Pedido } from '../../models/modelos';
import { MonedaPipe } from '../../pipes/moneda';
import { CierresService } from '../../services/cierres';
import { PedidosService } from '../../services/pedidos';
import { mensajeDeError } from '../../services/supabase';
import { fechaDeHoy } from '../../utils/fechas';
import { CierreEmpleada } from './cierre-empleada';

const formatoHora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' });

@Component({
  selector: 'app-mis-ventas',
  imports: [Encabezado, Hoja, CierreEmpleada, MonedaPipe],
  templateUrl: './mis-ventas.html',
  styles: `
    .estado-cierre {
      margin-top: 12px;
      border-left: 4px solid var(--naranja);
    }
    .estado-cierre.verificado {
      border-left-color: var(--verde);
    }
  `,
})
export class MisVentas {
  private readonly servicio = inject(PedidosService);
  private readonly cierres = inject(CierresService);

  protected readonly hoy = fechaDeHoy();
  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly cargando = signal(true);
  protected readonly borrandoId = signal<string | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly cierre = signal<CierreDia | null>(null);
  protected readonly cerrando = signal(false);
  protected readonly verificado = computed(() => this.cierre()?.estado === 'verificado');

  protected readonly total = computed(() => this.pedidos().reduce((t, p) => t + p.total, 0));
  protected readonly vasos = computed(() =>
    this.pedidos().reduce((t, p) => t + p.items.reduce((s, i) => s + i.cantidad, 0), 0),
  );
  protected readonly efectivo = computed(() => this.sumaPor('Efectivo'));
  protected readonly nequi = computed(() => this.sumaPor('Nequi'));

  constructor() {
    this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const [pedidos, cierre] = await Promise.all([
        this.servicio.deHoy(),
        this.cierres.cierreDeHoy(),
      ]);
      this.pedidos.set(pedidos);
      this.cierre.set(cierre);
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected async alEnviarCierre(): Promise<void> {
    this.cerrando.set(false);
    await this.cargar();
  }

  protected hora(pedido: Pedido): string {
    return formatoHora.format(new Date(pedido.creadoEn));
  }

  protected detalle(pedido: Pedido): string {
    return pedido.items.map((i) => `${i.cantidad} × ${i.nombre}`).join(', ');
  }

  protected async deshacer(pedido: Pedido): Promise<void> {
    if (this.ocupado()) return;
    if (this.borrandoId() !== pedido.id) {
      this.borrandoId.set(pedido.id);
      return;
    }

    this.ocupado.set(true);
    this.error.set(null);
    try {
      await this.servicio.deshacer(pedido.id);
      this.pedidos.update((lista) => lista.filter((p) => p.id !== pedido.id));
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.borrandoId.set(null);
      this.ocupado.set(false);
    }
  }

  private sumaPor(metodo: Pedido['metodoPago']): number {
    return this.pedidos()
      .filter((p) => p.metodoPago === metodo)
      .reduce((t, p) => t + p.total, 0);
  }
}
