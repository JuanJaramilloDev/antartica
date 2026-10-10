import { Injectable, inject } from '@angular/core';
import { Venta } from '../models/modelos';
import { SupabaseService } from './supabase';

interface FilaVenta {
  id: string;
  fecha: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
  total: number;
  ganancia: number;
  productos: { nombre: string; es_adicional: boolean } | null;
}

@Injectable({ providedIn: 'root' })
export class VentasService {
  private readonly db = inject(SupabaseService).cliente;

  async desde(fecha: string): Promise<Venta[]> {
    const { data, error } = await this.db
      .from('ventas')
      .select(
        'id, fecha, producto_id, cantidad, precio_unitario, costo_unitario, total, ganancia, productos(nombre, es_adicional)',
      )
      .gte('fecha', fecha)
      .order('fecha', { ascending: false })
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data as unknown as FilaVenta[]).map((f) => ({
      id: f.id,
      fecha: f.fecha,
      productoId: f.producto_id,
      nombreProducto: f.productos?.nombre ?? 'Producto',
      cantidad: Number(f.cantidad),
      precioUnitario: Number(f.precio_unitario),
      costoUnitario: Number(f.costo_unitario),
      total: Number(f.total),
      ganancia: Number(f.ganancia),
      esAdicional: f.productos?.es_adicional ?? false,
    }));
  }
}
