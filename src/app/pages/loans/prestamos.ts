import { Component, computed, inject, signal } from '@angular/core';
import { Hoja } from '../../components/bottom-sheet/hoja';
import { Encabezado } from '../../components/page-header/encabezado';
import { EstadoPrestamo, Prestamo } from '../../models/modelos';
import { FechaCortaPipe } from '../../pipes/fecha-corta';
import { MonedaPipe } from '../../pipes/moneda';
import { PrestamosService } from '../../services/prestamos';
import { SupabaseService, mensajeDeError } from '../../services/supabase';
import { diasDesde, iniciales } from '../../utils/fechas';
import { DetallePrestamo } from './detalle-prestamo';
import { FormularioPrestamo } from './formulario-prestamo';

/** Qué muestra la hoja: crear, ver detalle (abonos) o editar. */
type Vista = 'nuevo' | 'detalle' | 'editar';

@Component({
  selector: 'app-prestamos',
  imports: [Encabezado, Hoja, FormularioPrestamo, DetallePrestamo, MonedaPipe, FechaCortaPipe],
  templateUrl: './prestamos.html',
})
export class Prestamos {
  private readonly servicio = inject(PrestamosService);
  protected readonly configurado = inject(SupabaseService).configurado;
  protected readonly iniciales = iniciales;

  protected readonly prestamos = signal<Prestamo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly estado = signal<EstadoPrestamo>('pendiente');

  protected readonly vista = signal<Vista | null>(null);
  protected readonly seleccionado = signal<Prestamo | null>(null);

  protected readonly visibles = computed(() =>
    this.prestamos().filter((p) => p.estado === this.estado()),
  );
  private readonly pendientes = computed(() =>
    this.prestamos().filter((p) => p.estado === 'pendiente'),
  );
  protected readonly porCobrar = computed(() =>
    this.pendientes().reduce((total, p) => total + p.saldo, 0),
  );
  protected readonly cantidadPendientes = computed(() => this.pendientes().length);
  protected readonly cantidadVencidos = computed(
    () => this.pendientes().filter((p) => this.vencido(p)).length,
  );

  constructor() {
    if (this.configurado) {
      this.cargar();
    } else {
      this.cargando.set(false);
    }
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.prestamos.set(await this.servicio.listar());
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected progreso(prestamo: Prestamo): number {
    return prestamo.monto ? Math.min(100, Math.round((prestamo.abonado / prestamo.monto) * 100)) : 0;
  }

  protected vencido(prestamo: Prestamo): boolean {
    return (
      prestamo.estado === 'pendiente' &&
      prestamo.fechaLimite !== null &&
      diasDesde(prestamo.fechaLimite) > 0
    );
  }

  protected nuevo(): void {
    this.seleccionado.set(null);
    this.vista.set('nuevo');
  }

  protected verDetalle(prestamo: Prestamo): void {
    this.seleccionado.set(prestamo);
    this.vista.set('detalle');
  }

  protected cerrar(): void {
    this.vista.set(null);
  }

  /** Reemplaza (o agrega) el préstamo en la lista con los datos nuevos. */
  protected alActualizar(prestamo: Prestamo): void {
    this.prestamos.update((lista) =>
      lista.some((p) => p.id === prestamo.id)
        ? lista.map((p) => (p.id === prestamo.id ? prestamo : p))
        : [prestamo, ...lista],
    );
    this.seleccionado.set(prestamo);
  }

  protected alGuardar(prestamo: Prestamo): void {
    this.alActualizar(prestamo);
    // Al crear o editar, queda abierto el detalle para poder registrar abonos.
    this.vista.set('detalle');
  }

  protected alEliminar(id: string): void {
    this.prestamos.update((lista) => lista.filter((p) => p.id !== id));
    this.cerrar();
  }

  /** Cancelar en "editar" vuelve al detalle; en "nuevo" cierra. */
  protected cancelarFormulario(): void {
    this.vista.set(this.vista() === 'editar' ? 'detalle' : null);
  }
}
