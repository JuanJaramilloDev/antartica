import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { CategoriaGasto, ResumenMes } from '../../models/modelos';
import { MonedaPipe } from '../../pipes/moneda';
import { CierresService } from '../../services/cierres';
import { mensajeDeError } from '../../services/supabase';
import { fechaIso, finDeMes, nombreMes } from '../../utils/fechas';

export interface Semestre {
  /** Ej: "2026-2" (año y 1 = ene–jun, 2 = jul–dic). */
  clave: string;
  nombre: string;
  anio: number;
  parte: 1 | 2;
}

/** Un mes sin movimientos (para meses del semestre que aún no tienen datos). */
export function mesVacio(mes: string): ResumenMes {
  return {
    mes,
    diasCerrados: 0,
    vasos: 0,
    ventas: 0,
    costo: 0,
    sueldoEmpleada: 0,
    miSueldo: 0,
    reinversion: 0,
    otros: 0,
    cierre: 0,
    total: 0,
    queda: 0,
    otrosIngresos: 0,
  };
}

type CategoriaManual = Extract<CategoriaGasto, 'Reinversión' | 'Otro'>;

/**
 * Detalle de un semestre: lo vendido y los otros ingresos de cada mes, y agregar
 * un gasto a cualquier mes ya pasado o al actual. Va dentro de <app-hoja>.
 */
@Component({
  selector: 'app-detalle-semestre',
  imports: [CampoMoneda, MonedaPipe],
  templateUrl: './detalle-semestre.html',
})
export class DetalleSemestre {
  private readonly servicio = inject(CierresService);

  readonly semestre = input.required<Semestre>();
  /** Todos los meses con datos (el componente toma los de este semestre). */
  readonly meses = input.required<ResumenMes[]>();
  readonly abrirMes = output<ResumenMes>();
  /** Se agregó un gasto: el padre recarga los meses. */
  readonly cambiado = output<void>();
  readonly cerrar = output<void>();

  protected readonly nombreMes = nombreMes;
  private readonly mesActual = fechaIso().slice(0, 7) + '-01';

  /** Los meses del semestre hasta el mes actual, con sus números (o en cero). */
  protected readonly mesesDelSemestre = computed(() => {
    const { anio, parte } = this.semestre();
    const porMes = new Map(this.meses().map((m) => [m.mes, m]));
    const resultado: ResumenMes[] = [];
    for (let i = 0; i < 6; i++) {
      const numero = (parte === 1 ? 1 : 7) + i;
      const mes = `${anio}-${String(numero).padStart(2, '0')}-01`;
      if (mes > this.mesActual) break;
      resultado.push(porMes.get(mes) ?? mesVacio(mes));
    }
    return resultado;
  });

  protected readonly totales = computed(() =>
    this.mesesDelSemestre().reduce(
      (t, m) => ({
        ventas: t.ventas + m.ventas,
        total: t.total + m.total,
        otrosIngresos: t.otrosIngresos + m.otrosIngresos,
        salarios: t.salarios + m.sueldoEmpleada + m.miSueldo,
      }),
      { ventas: 0, total: 0, otrosIngresos: 0, salarios: 0 },
    ),
  );

  // Agregar gasto a un mes
  protected readonly mesGasto = signal('');
  protected readonly categoria = signal<CategoriaManual>('Reinversión');
  protected readonly monto = signal<number | null>(null);
  protected readonly descripcion = signal('');
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  /** Mes elegido; por defecto el más reciente del semestre. */
  protected readonly mesElegido = computed(() => {
    const meses = this.mesesDelSemestre();
    return this.mesGasto() || meses[meses.length - 1]?.mes || '';
  });
  protected readonly gastoValido = computed(
    () => (this.monto() ?? 0) > 0 && this.mesElegido() !== '',
  );

  protected async agregarGasto(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.gastoValido() || this.guardando()) return;

    const mes = this.mesElegido();
    // Mes actual → hoy; mes pasado → último día de ese mes.
    const fecha = mes === this.mesActual ? fechaIso() : finDeMes(mes);

    this.guardando.set(true);
    this.error.set(null);
    this.aviso.set(null);
    try {
      await this.servicio.registrarGasto({
        categoria: this.categoria(),
        monto: this.monto()!,
        descripcion: this.descripcion().trim() || null,
        fecha,
      });
      this.aviso.set(`Gasto agregado a ${nombreMes(mes)}. Se descontó de la caja.`);
      this.monto.set(null);
      this.descripcion.set('');
      this.cambiado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }
}
