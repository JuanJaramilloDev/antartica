import { Component, computed, inject, signal } from '@angular/core';
import { Hoja } from '../../components/bottom-sheet/hoja';
import { Encabezado } from '../../components/page-header/encabezado';
import { Ajustes, CierreDia, ResumenMes } from '../../models/modelos';
import { FechaCortaPipe } from '../../pipes/fecha-corta';
import { MonedaPipe } from '../../pipes/moneda';
import { CierresService } from '../../services/cierres';
import { mensajeDeError } from '../../services/supabase';
import { fechaIso, nombreMes } from '../../utils/fechas';
import { AjustesSueldos } from './ajustes-sueldos';
import { DetalleMes } from './detalle-mes';
import { DetalleSemestre, Semestre, mesVacio } from './detalle-semestre';
import { VerificarCierre } from './verificar-cierre';

interface FilaSemestre extends Semestre {
  ventas: number;
  total: number;
  salarios: number;
  otrosIngresos: number;
}

@Component({
  selector: 'app-cierres',
  imports: [
    Encabezado,
    Hoja,
    VerificarCierre,
    DetalleMes,
    DetalleSemestre,
    AjustesSueldos,
    MonedaPipe,
    FechaCortaPipe,
  ],
  templateUrl: './cierres.html',
})
export class Cierres {
  private readonly servicio = inject(CierresService);

  protected readonly nombreMes = nombreMes;
  private readonly hoy = fechaIso();

  protected readonly ajustes = signal<Ajustes>({ sueldoEmpleadaDia: 0, sueldoMioMes: 0 });
  protected readonly cierres = signal<CierreDia[]>([]);
  protected readonly meses = signal<ResumenMes[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly hoja = signal<'cierre' | 'mes' | 'semestre' | 'sueldos' | null>(null);
  protected readonly cierreEnEdicion = signal<CierreDia | null>(null);
  protected readonly mesSeleccionado = signal<ResumenMes | null>(null);
  protected readonly semestreSeleccionado = signal<Semestre | null>(null);

  protected readonly cierreHoy = computed(() => this.cierres().find((c) => c.fecha === this.hoy));
  protected readonly porVerificar = computed(() =>
    this.cierres().filter((c) => c.estado === 'pendiente'),
  );

  protected readonly semestres = computed<FilaSemestre[]>(() => {
    const grupos = new Map<string, FilaSemestre>();
    const filaDe = (mes: string): FilaSemestre => {
      const [anio, numeroMes] = mes.split('-').map(Number);
      const parte: 1 | 2 = numeroMes <= 6 ? 1 : 2;
      const clave = `${anio}-${parte}`;
      if (!grupos.has(clave)) {
        grupos.set(clave, {
          clave,
          anio,
          parte,
          nombre: `${parte === 1 ? '1.er' : '2.º'} semestre ${anio}`,
          ventas: 0,
          total: 0,
          salarios: 0,
          otrosIngresos: 0,
        });
      }
      return grupos.get(clave)!;
    };

    filaDe(this.hoy);
    for (const mes of this.meses()) {
      const fila = filaDe(mes.mes);
      fila.ventas += mes.ventas;
      fila.total += mes.total;
      fila.salarios += mes.sueldoEmpleada + mes.miSueldo;
      fila.otrosIngresos += mes.otrosIngresos;
    }
    return [...grupos.values()].sort((a, b) => b.clave.localeCompare(a.clave));
  });

  constructor() {
    this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.error.set(null);
    try {
      const [ajustes, cierres, meses] = await Promise.all([
        this.servicio.ajustes(),
        this.servicio.cierres(),
        this.servicio.resumenMensual(),
      ]);
      this.ajustes.set(ajustes);
      this.cierres.set(cierres);
      this.meses.set(meses);
      const abierto = this.mesSeleccionado();
      if (abierto) {
        this.mesSeleccionado.set(meses.find((m) => m.mes === abierto.mes) ?? mesVacio(abierto.mes));
      }
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected abrirCierre(cierre: CierreDia): void {
    this.cierreEnEdicion.set(cierre);
    this.hoja.set('cierre');
  }

  protected abrirMes(mes: ResumenMes): void {
    this.mesSeleccionado.set(mes);
    this.hoja.set('mes');
  }

  protected abrirSemestre(semestre: Semestre): void {
    this.semestreSeleccionado.set(semestre);
    this.hoja.set('semestre');
  }

  protected cerrarMes(): void {
    this.mesSeleccionado.set(null);
    if (this.semestreSeleccionado()) {
      this.hoja.set('semestre');
    } else {
      this.hoja.set(null);
    }
  }

  protected cerrarHoja(): void {
    this.hoja.set(null);
    this.mesSeleccionado.set(null);
    this.semestreSeleccionado.set(null);
  }

  protected alGuardarCierre(): void {
    this.hoja.set(null);
    this.cargar();
  }

  protected alGuardarSueldos(ajustes: Ajustes): void {
    this.ajustes.set(ajustes);
    this.hoja.set(null);
  }
}
