import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { Contador } from '../../components/stepper/contador';
import { Insumo, Producto } from '../../models/modelos';
import { InsumosService } from '../../services/insumos';
import { MonedaPipe } from '../../pipes/moneda';
import { ProductosService } from '../../services/productos';
import { mensajeDeError } from '../../services/supabase';

/** Crear o editar un producto. Se muestra dentro de <app-hoja>. */
@Component({
  selector: 'app-formulario-producto',
  imports: [CampoMoneda, Contador, MonedaPipe],
  templateUrl: './formulario-producto.html',
})
export class FormularioProducto implements OnInit {
  private readonly servicio = inject(ProductosService);
  private readonly insumosServicio = inject(InsumosService);

  /** null = producto nuevo. */
  readonly producto = input<Producto | null>(null);
  readonly guardado = output<Producto>();
  readonly eliminado = output<string>();
  readonly cancelar = output<void>();

  protected readonly nombre = signal('');
  protected readonly precioVenta = signal<number | null>(null);
  protected readonly costo = signal<number | null>(null);
  protected readonly activo = signal(true);
  /** 0 = no se maneja por paquetes. */
  protected readonly unidadesPaquete = signal(0);
  /** Insumo del que se descuentan los paquetes ('' = ninguno). */
  protected readonly insumoId = signal('');
  protected readonly insumos = signal<Insumo[]>([]);

  protected readonly guardando = signal(false);
  protected readonly confirmandoEliminar = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly esEdicion = computed(() => this.producto() !== null);
  protected readonly ganancia = computed(() => (this.precioVenta() ?? 0) - (this.costo() ?? 0));
  protected readonly margen = computed(() => {
    const precio = this.precioVenta() ?? 0;
    return precio ? Math.round((this.ganancia() / precio) * 100) : 0;
  });
  protected readonly valido = computed(
    () => this.nombre().trim().length > 0 && this.precioVenta() !== null,
  );

  ngOnInit(): void {
    const producto = this.producto();
    if (producto) {
      this.nombre.set(producto.nombre);
      this.precioVenta.set(producto.precioVenta);
      this.costo.set(producto.costo);
      this.activo.set(producto.activo);
      this.unidadesPaquete.set(producto.unidadesPaquete ?? 0);
      this.insumoId.set(producto.insumoId ?? '');
    }
    this.cargarInsumos();
  }

  private async cargarInsumos(): Promise<void> {
    try {
      this.insumos.set(await this.insumosServicio.listar());
    } catch {
      // Si falla, simplemente no se muestra la lista; el resto del formulario sirve.
    }
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
          precioVenta: this.precioVenta()!,
          costo: this.costo() ?? 0,
          activo: this.activo(),
          unidadesPaquete: this.unidadesPaquete() || null,
          insumoId: (this.unidadesPaquete() && this.insumoId()) || null,
        },
        this.producto()?.id,
      );
      this.guardado.emit(guardado);
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  /** Primer toque pide confirmación; el segundo elimina. */
  protected async eliminar(): Promise<void> {
    const producto = this.producto();
    if (!producto || this.guardando()) return;
    if (!this.confirmandoEliminar()) {
      this.confirmandoEliminar.set(true);
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.servicio.eliminar(producto.id);
      this.eliminado.emit(producto.id);
    } catch (error) {
      this.error.set(mensajeDeError(error));
      this.confirmandoEliminar.set(false);
    } finally {
      this.guardando.set(false);
    }
  }
}
