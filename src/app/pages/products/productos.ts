import { Component, computed, inject, signal } from '@angular/core';
import { Hoja } from '../../components/bottom-sheet/hoja';
import { Encabezado } from '../../components/page-header/encabezado';
import { Producto } from '../../models/modelos';
import { MonedaPipe } from '../../pipes/moneda';
import { ProductosService } from '../../services/productos';
import { SupabaseService, mensajeDeError } from '../../services/supabase';
import { FormularioProducto } from './formulario-producto';

@Component({
  selector: 'app-productos',
  imports: [Encabezado, Hoja, FormularioProducto, MonedaPipe],
  templateUrl: './productos.html',
})
export class Productos {
  private readonly servicio = inject(ProductosService);
  protected readonly configurado = inject(SupabaseService).configurado;

  protected readonly productos = signal<Producto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');

  protected readonly formularioAbierto = signal(false);
  protected readonly enEdicion = signal<Producto | null>(null);

  protected readonly visibles = computed(() => {
    const texto = normalizar(this.busqueda());
    return this.productos()
      .filter((p) => normalizar(p.nombre).includes(texto))
      .sort((a, b) => Number(b.activo) - Number(a.activo));
  });

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
      this.productos.set(await this.servicio.listar());
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected ganancia(producto: Producto): number {
    return producto.precioVenta - producto.costo;
  }

  protected margen(producto: Producto): number {
    if (!producto.precioVenta) return 0;
    return Math.round((this.ganancia(producto) / producto.precioVenta) * 100);
  }

  protected abrir(producto: Producto | null): void {
    this.enEdicion.set(producto);
    this.formularioAbierto.set(true);
  }

  protected cerrar(): void {
    this.formularioAbierto.set(false);
  }

  protected alGuardar(guardado: Producto): void {
    this.productos.update((lista) =>
      lista.some((p) => p.id === guardado.id)
        ? lista.map((p) => (p.id === guardado.id ? guardado : p))
        : [...lista, guardado],
    );
    this.cerrar();
  }

  protected alEliminar(id: string): void {
    this.productos.update((lista) => lista.filter((p) => p.id !== id));
    this.cerrar();
  }
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
