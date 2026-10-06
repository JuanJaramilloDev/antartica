import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { Contador } from '../../components/stepper/contador';
import { DatosInsumo, Insumo } from '../../models/modelos';
import { InsumosService } from '../../services/insumos';
import { mensajeDeError } from '../../services/supabase';

const UNIDADES = ['und', 'bolsas', 'paquetes', 'kg', 'litros'];

@Component({
  selector: 'app-formulario-insumo',
  imports: [Contador],
  templateUrl: './formulario-insumo.html',
  styleUrl: './formulario-insumo.css',
})
export class FormularioInsumo implements OnInit {
  private readonly servicio = inject(InsumosService);

  readonly insumo = input<Insumo | null>(null);
  readonly valoresIniciales = input<Partial<DatosInsumo>>({});
  readonly categorias = input<string[]>([]);

  readonly guardado = output<Insumo>();
  readonly eliminado = output<string>();
  readonly cancelar = output<void>();

  protected readonly unidades = UNIDADES;

  protected readonly nombre = signal('');
  protected readonly categoria = signal('');
  protected readonly cantidad = signal(0);
  protected readonly unidad = signal('und');
  protected readonly minimo = signal(0);

  protected readonly guardando = signal(false);
  protected readonly confirmandoEliminar = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly esEdicion = computed(() => this.insumo() !== null);
  protected readonly valido = computed(
    () => this.nombre().trim().length > 0 && this.categoria().trim().length > 0,
  );

  ngOnInit(): void {
    const datos = this.insumo() ?? this.valoresIniciales();
    this.nombre.set(datos.nombre ?? '');
    this.categoria.set(datos.categoria ?? '');
    this.cantidad.set(datos.cantidad ?? 0);
    this.unidad.set(datos.unidad ?? 'und');
    this.minimo.set(datos.minimo ?? 0);
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.valido() || this.guardando()) return;

    this.guardando.set(true);
    this.error.set(null);
    try {
      const guardado = await this.servicio.guardar(
        {
          nombre: this.nombre().trim(),
          categoria: this.categoria().trim(),
          cantidad: this.cantidad(),
          unidad: this.unidad().trim() || 'und',
          minimo: this.minimo(),
        },
        this.insumo()?.id,
      );
      this.guardado.emit(guardado);
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async eliminar(): Promise<void> {
    const insumo = this.insumo();
    if (!insumo || this.guardando()) return;
    if (!this.confirmandoEliminar()) {
      this.confirmandoEliminar.set(true);
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.servicio.eliminar(insumo.id);
      this.eliminado.emit(insumo.id);
    } catch (error) {
      this.error.set(mensajeDeError(error));
      this.confirmandoEliminar.set(false);
    } finally {
      this.guardando.set(false);
    }
  }
}
