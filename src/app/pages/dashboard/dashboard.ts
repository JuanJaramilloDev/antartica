import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hoja } from '../../components/bottom-sheet/hoja';
import { Encabezado } from '../../components/page-header/encabezado';
import { Insumo, VasosDelDia, Venta } from '../../models/modelos';
import { MonedaPipe } from '../../pipes/moneda';
import { CajaService } from '../../services/caja';
import { CierresService } from '../../services/cierres';
import { InsumosService } from '../../services/insumos';
import { SupabaseService, mensajeDeError } from '../../services/supabase';
import { VasosService } from '../../services/vasos';
import { VentasService } from '../../services/ventas';
import { diasDesde, fechaDeHoy, fechaIso } from '../../utils/fechas';
import { AjusteBase } from './ajuste-base';
import { AjusteCaja } from './ajuste-caja';
import { AjusteVasos } from './ajuste-vasos';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Encabezado, Hoja, AjusteCaja, AjusteBase, AjusteVasos, MonedaPipe],
  templateUrl: './dashboard.html',
  styles: `
    .tarjeta-caja {
      display: block;
      width: 100%;
      text-align: left;
      transition: transform 0.15s;
    }
    .tarjeta-caja:active:not(:disabled) {
      transform: scale(0.99);
    }
    .vasos-toque {
      text-align: left;
    }
  `,
})
export class Dashboard {
  private readonly caja = inject(CajaService);
  private readonly insumos = inject(InsumosService);
  private readonly vasosServicio = inject(VasosService);
  private readonly cierres = inject(CierresService);
  private readonly ventasServicio = inject(VentasService);
  protected readonly configurado = inject(SupabaseService).configurado;

  protected readonly hoy = fechaDeHoy();

  protected readonly saldoCaja = signal<number | null>(null);
  protected readonly prestado = signal<number | null>(null);
  protected readonly porReponer = signal<Insumo[]>([]);
  protected readonly vasos = signal<VasosDelDia[]>([]);
  protected readonly base = signal(0);
  protected readonly error = signal<string | null>(null);

  protected readonly hoja = signal<'caja' | 'base' | 'vasos' | null>(null);
  protected readonly vasosEnEdicion = signal<VasosDelDia | null>(null);
  protected readonly sumandoId = signal<string | null>(null);

  private readonly ventas = signal<Venta[]>([]);

  protected readonly ventasHoy = computed(() => {
    const porProducto = new Map<string, { nombre: string; cantidad: number; total: number }>();
    for (const venta of this.ventas().filter((v) => diasDesde(v.fecha) === 0)) {
      const actual = porProducto.get(venta.productoId) ?? {
        nombre: venta.nombreProducto,
        cantidad: 0,
        total: 0,
      };
      actual.cantidad += venta.cantidad;
      actual.total += venta.total;
      porProducto.set(venta.productoId, actual);
    }
    return [...porProducto.values()];
  });

  protected readonly totalHoy = computed(() => sumar(this.ventasHoy().map((v) => v.total)));
  protected readonly unidadesHoy = computed(() => sumar(this.ventasHoy().map((v) => v.cantidad)));
  protected readonly gananciaHoy = computed(() =>
    sumar(this.ventas().filter((v) => diasDesde(v.fecha) === 0).map((v) => v.ganancia)),
  );
  protected readonly totalSemana = computed(() =>
    sumar(this.ventas().map((v) => v.total)),
  );

  constructor() {
    if (this.configurado) {
      this.cargar();
      this.cargarVasos();
    }
  }

  private async cargar(): Promise<void> {
    try {
      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 6);
      const [saldo, prestado, insumos, ventas] = await Promise.all([
        this.caja.saldo(),
        this.caja.prestadoPorCobrar(),
        this.insumos.listar(),
        this.ventasServicio.desde(fechaIso(hace7Dias)),
      ]);
      this.saldoCaja.set(saldo);
      this.prestado.set(prestado);
      this.ventas.set(ventas);
      this.porReponer.set(this.filtrarPorReponer(insumos));
    } catch (error) {
      this.error.set(mensajeDeError(error));
    }
  }

  private async cargarVasos(): Promise<void> {
    try {
      const [vasos, base] = await Promise.all([
        this.vasosServicio.delDia(fechaIso()),
        this.cierres.base(),
      ]);
      this.vasos.set(vasos);
      this.base.set(base);
    } catch (error) {
      this.error.set(mensajeDeError(error));
    }
  }

  protected async recargarCaja(): Promise<void> {
    try {
      this.saldoCaja.set(await this.caja.saldo());
    } catch (error) {
      this.error.set(mensajeDeError(error));
    }
  }

  protected paquetes(item: VasosDelDia): string {
    const porPaquete = item.unidadesPaquete ?? 0;
    if (!porPaquete) return '';
    const completos = Math.floor(item.cantidad / porPaquete);
    const sueltos = item.cantidad % porPaquete;
    const texto = `${completos} ${completos === 1 ? 'paquete' : 'paquetes'}`;
    return sueltos ? `${texto} + ${sueltos}` : texto;
  }

  protected async sumarPaquete(item: VasosDelDia): Promise<void> {
    if (!item.unidadesPaquete || this.sumandoId()) return;
    this.sumandoId.set(item.productoId);
    this.error.set(null);
    try {
      await this.vasosServicio.sumar(item.productoId, item.unidadesPaquete, fechaIso());
      await this.recargarVasosEInventario();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.sumandoId.set(null);
    }
  }

  protected alGuardarBase(valor: number): void {
    this.base.set(valor);
    this.hoja.set(null);
  }

  protected editarVasos(item: VasosDelDia): void {
    this.vasosEnEdicion.set(item);
    this.hoja.set('vasos');
  }

  protected alGuardarVasos(): void {
    this.hoja.set(null);
    this.recargarVasosEInventario();
  }

  private async recargarVasosEInventario(): Promise<void> {
    try {
      const [vasos, insumos] = await Promise.all([
        this.vasosServicio.delDia(fechaIso()),
        this.insumos.listar(),
      ]);
      this.vasos.set(vasos);
      this.porReponer.set(this.filtrarPorReponer(insumos));
    } catch (error) {
      this.error.set(mensajeDeError(error));
    }
  }

  private filtrarPorReponer(insumos: Insumo[]): Insumo[] {
    return insumos
      .filter((i) => i.cantidad <= i.minimo)
      .sort((a, b) => a.cantidad - b.cantidad || a.nombre.localeCompare(b.nombre));
  }
}

function sumar(valores: number[]): number {
  return valores.reduce((total, valor) => total + valor, 0);
}
