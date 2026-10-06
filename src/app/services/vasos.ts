import { Injectable, inject } from '@angular/core';
import { VasosDelDia } from '../models/modelos';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class VasosService {
  private readonly db = inject(SupabaseService).cliente;

  async delDia(fecha: string): Promise<VasosDelDia[]> {
    const [productos, registros] = await Promise.all([
      this.db
        .from('productos')
        .select('id, nombre, precio_venta, unidades_paquete, insumos(cantidad)')
        .eq('activo', true)
        .order('orden')
        .order('nombre'),
      this.db.from('vasos_dia').select('producto_id, cantidad, sobrantes').eq('fecha', fecha),
    ]);
    if (productos.error) throw productos.error;
    if (registros.error) throw registros.error;

    const porProducto = new Map(registros.data.map((r) => [r.producto_id, r]));
    return productos.data.map((p) => {
      const insumo = p.insumos as unknown as { cantidad: number } | null;
      return {
        productoId: p.id,
        nombre: p.nombre,
        precioVenta: Number(p.precio_venta),
        unidadesPaquete: p.unidades_paquete,
        cantidad: porProducto.get(p.id)?.cantidad ?? 0,
        sobrantes: porProducto.get(p.id)?.sobrantes ?? null,
        paquetesEnInventario: insumo ? Number(insumo.cantidad) : null,
      };
    });
  }

  async sumar(productoId: string, cantidad: number, fecha: string): Promise<number> {
    const { data, error } = await this.db.rpc('sumar_vasos', {
      p_producto: productoId,
      p_cantidad: cantidad,
      p_fecha: fecha,
    });
    if (error) throw error;
    return data as number;
  }

  async fijar(productoId: string, cantidad: number, fecha: string): Promise<void> {
    const { error } = await this.db
      .from('vasos_dia')
      .upsert(
        { producto_id: productoId, fecha, cantidad, actualizado_en: new Date().toISOString() },
        { onConflict: 'fecha,producto_id' },
      );
    if (error) throw error;
  }
}
