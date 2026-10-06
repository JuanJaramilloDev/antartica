import { Injectable, inject } from '@angular/core';
import { VasosDelDia } from '../models/modelos';
import { SupabaseService } from './supabase';

interface FilaVasos {
  producto_id: string;
  nombre: string;
  precio_venta: number;
  unidades_paquete: number | null;
  arrastre: number;
  bajados: number;
  sobrantes: number | null;
  paquetes_inventario: number | null;
}

@Injectable({ providedIn: 'root' })
export class VasosService {
  private readonly db = inject(SupabaseService).cliente;

  async delDia(fecha: string): Promise<VasosDelDia[]> {
    const { data, error } = await this.db.rpc('vasos_del_dia', { p_fecha: fecha });
    if (error) throw error;
    return (data as FilaVasos[]).map((f) => ({
      productoId: f.producto_id,
      nombre: f.nombre,
      precioVenta: Number(f.precio_venta),
      unidadesPaquete: f.unidades_paquete,
      arrastre: Number(f.arrastre),
      cantidad: Number(f.bajados),
      sobrantes: f.sobrantes === null ? null : Number(f.sobrantes),
      paquetesEnInventario: f.paquetes_inventario === null ? null : Number(f.paquetes_inventario),
    }));
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
