import { Component, computed, inject, signal } from '@angular/core';
import { Cargando } from '../../components/loading/cargando';
import { Hoja } from '../../components/bottom-sheet/hoja';
import { Encabezado } from '../../components/page-header/encabezado';
import { CierreDia, JugoDelDia, VasosDelDia } from '../../models/modelos';
import { CierresService } from '../../services/cierres';
import { JugosService } from '../../services/jugos';
import { mensajeDeError } from '../../services/supabase';
import { VasosService } from '../../services/vasos';
import { fechaDeHoy, fechaIso } from '../../utils/fechas';
import { CierreEmpleada } from './cierre-empleada';

const COLORES: [string, string][] = [
  ['roj', '#ef4444'],
  ['amar', '#facc15'],
  ['azul', '#3b82f6'],
  ['mora', '#a855f7'],
  ['verd', '#22c55e'],
  ['naranj', '#f97316'],
  ['ros', '#ec4899'],
  ['blanc', '#e5e7eb'],
  ['negr', '#111827'],
];

const COMBINADO = 'conic-gradient(#ef4444, #facc15, #22c55e, #3b82f6, #a855f7, #ef4444)';

@Component({
  selector: 'app-diario',
  imports: [Cargando, Encabezado, Hoja, CierreEmpleada],
  templateUrl: './diario.html',
  styleUrl: './diario.css',
})
export class Diario {
  private readonly vasosServicio = inject(VasosService);
  private readonly jugosServicio = inject(JugosService);
  private readonly cierres = inject(CierresService);

  protected readonly hoy = fechaDeHoy();
  protected readonly vasos = signal<VasosDelDia[]>([]);
  protected readonly jugos = signal<JugoDelDia[]>([]);
  protected readonly cierre = signal<CierreDia | null>(null);
  protected readonly cerrando = signal(false);
  protected readonly verificado = computed(() => this.cierre()?.estado === 'verificado');
  protected readonly cargando = signal(true);
  protected readonly ocupado = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly vasosConPaquete = computed(() =>
    this.vasos().filter((v) => v.unidadesPaquete),
  );
  protected readonly bolsasHoy = computed(() =>
    this.jugos().reduce((t, j) => t + j.usadosHoy, 0),
  );

  constructor() {
    this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.error.set(null);
    try {
      const [vasos, jugos, cierre] = await Promise.all([
        this.vasosServicio.delDia(fechaIso()),
        this.jugosServicio.delDia(),
        this.cierres.cierreDeHoy(),
      ]);
      this.vasos.set(vasos);
      this.jugos.set(jugos);
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

  protected paquetes(item: VasosDelDia): string {
    const porPaquete = item.unidadesPaquete ?? 0;
    const completos = Math.floor(item.cantidad / porPaquete);
    const sueltos = item.cantidad % porPaquete;
    const texto = `${completos} ${completos === 1 ? 'paquete' : 'paquetes'}`;
    return sueltos ? `${texto} + ${sueltos}` : texto;
  }

  protected async cambiarVasos(item: VasosDelDia, paquetes: number): Promise<void> {
    if (this.ocupado() || this.verificado() || !item.unidadesPaquete) return;
    await this.ejecutar(item.productoId, () =>
      this.vasosServicio.sumar(item.productoId, paquetes * item.unidadesPaquete!, fechaIso()),
    );
  }

  protected async cambiarJugo(jugo: JugoDelDia, bolsas: number): Promise<void> {
    if (this.ocupado() || this.verificado()) return;
    await this.ejecutar(jugo.insumoId, () => this.jugosServicio.sumar(jugo.insumoId, bolsas));
  }

  protected color(nombre: string): string {
    const texto = nombre.toLowerCase();
    if (texto.startsWith('comb')) return COMBINADO;
    return COLORES.find(([clave]) => texto.startsWith(clave))?.[1] ?? 'var(--azul)';
  }

  private async ejecutar(id: string, accion: () => Promise<unknown>): Promise<void> {
    this.ocupado.set(id);
    this.error.set(null);
    try {
      await accion();
      await this.cargar();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.ocupado.set(null);
    }
  }
}
