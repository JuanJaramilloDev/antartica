import { Injectable, inject } from '@angular/core';
import { DatosProducto, Producto } from '../models/modelos';
import { SupabaseService } from './supabase';

interface FilaProducto {
  id: string;
  nombre: string;
  precio_venta: number;
  costo: number;
  activo: boolean;
  unidades_paquete: number | null;
  insumo_id: string | null;
}

const COLUMNAS = 'id, nombre, precio_venta, costo, activo, unidades_paquete, insumo_id';

function aProducto(fila: FilaProducto): Producto {
  return {
    id: fila.id,
    nombre: fila.nombre,
    precioVenta: Number(fila.precio_venta),
    costo: Number(fila.costo),
    activo: fila.activo,
    unidadesPaquete: fila.unidades_paquete,
    insumoId: fila.insumo_id,
  };
}

function aFila(datos: DatosProducto): Omit<FilaProducto, 'id'> {
  return {
    nombre: datos.nombre,
    precio_venta: datos.precioVenta,
    costo: datos.costo,
    activo: datos.activo,
    unidades_paquete: datos.unidadesPaquete,
    insumo_id: datos.insumoId,
  };
}

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly db = inject(SupabaseService).cliente;

  async listar(): Promise<Producto[]> {
    const { data, error } = await this.db
      .from('productos')
      .select(COLUMNAS)
      .order('orden')
      .order('nombre');
    if (error) throw error;
    return (data as FilaProducto[]).map(aProducto);
  }

  async guardar(datos: DatosProducto, id?: string): Promise<Producto> {
    const consulta = id
      ? this.db.from('productos').update(aFila(datos)).eq('id', id)
      : this.db.from('productos').insert(aFila(datos));
    const { data, error } = await consulta.select(COLUMNAS).single();
    if (error) throw error;
    return aProducto(data as FilaProducto);
  }

  async eliminar(id: string): Promise<void> {
    const { error } = await this.db.from('productos').delete().eq('id', id);
    if (error?.code === '23001' || error?.code === '23503') {
      throw new Error('Este producto ya tiene ventas. Desactívalo en lugar de eliminarlo.');
    }
    if (error) throw error;
  }
}
