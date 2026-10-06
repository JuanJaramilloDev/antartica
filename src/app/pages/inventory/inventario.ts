import { Component, computed, inject, signal } from '@angular/core';
import { Hoja } from '../../components/bottom-sheet/hoja';
import { Encabezado } from '../../components/page-header/encabezado';
import { CATEGORIA_JUGOS, DatosInsumo, Insumo } from '../../models/modelos';
import { InsumosService } from '../../services/insumos';
import { SupabaseService, mensajeDeError } from '../../services/supabase';
import { FormularioInsumo } from './formulario-insumo';

type Filtro = 'insumos' | 'jugos' | 'reponer';

@Component({
  selector: 'app-inventario',
  imports: [Encabezado, Hoja, FormularioInsumo],
  templateUrl: './inventario.html',
})
export class Inventario {
  private readonly servicio = inject(InsumosService);
  protected readonly configurado = inject(SupabaseService).configurado;

  protected readonly insumos = signal<Insumo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal<Filtro>('insumos');

  protected readonly formularioAbierto = signal(false);
  protected readonly enEdicion = signal<Insumo | null>(null);

  protected readonly cantidadReponer = computed(
    () => this.insumos().filter((i) => this.porReponer(i)).length,
  );
  protected readonly totalJugos = computed(() =>
    this.insumos()
      .filter((i) => i.categoria === CATEGORIA_JUGOS)
      .reduce((total, jugo) => total + jugo.cantidad, 0),
  );
  protected readonly categorias = computed(() =>
    [...new Set(this.insumos().map((i) => i.categoria))].sort(),
  );

  protected readonly grupos = computed(() => {
    const filtro = this.filtro();
    const visibles = this.insumos().filter((i) =>
      filtro === 'jugos'
        ? i.categoria === CATEGORIA_JUGOS
        : filtro === 'reponer'
          ? this.porReponer(i)
          : i.categoria !== CATEGORIA_JUGOS,
    );

    const grupos = new Map<string, Insumo[]>();
    for (const insumo of visibles) {
      grupos.set(insumo.categoria, [...(grupos.get(insumo.categoria) ?? []), insumo]);
    }
    return [...grupos.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([categoria, lista]) => ({
        categoria,
        insumos: lista.sort((a, b) => a.nombre.localeCompare(b.nombre)),
      }));
  });

  protected readonly valoresNuevo = computed<Partial<DatosInsumo>>(() =>
    this.filtro() === 'jugos' ? { categoria: CATEGORIA_JUGOS, unidad: 'bolsas' } : {},
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
      this.insumos.set(await this.servicio.listar());
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected porReponer(insumo: Insumo): boolean {
    return insumo.cantidad <= insumo.minimo;
  }

  protected abrir(insumo: Insumo | null): void {
    this.enEdicion.set(insumo);
    this.formularioAbierto.set(true);
  }

  protected cerrar(): void {
    this.formularioAbierto.set(false);
  }

  protected alGuardar(guardado: Insumo): void {
    this.insumos.update((lista) =>
      lista.some((i) => i.id === guardado.id)
        ? lista.map((i) => (i.id === guardado.id ? guardado : i))
        : [...lista, guardado],
    );
    this.cerrar();
  }

  protected alEliminar(id: string): void {
    this.insumos.update((lista) => lista.filter((i) => i.id !== id));
    this.cerrar();
  }
}
