import { Injectable, inject } from '@angular/core';
import { MetodoPago, Pedido, ProductoVenta } from '../models/modelos';
import { fechaIso } from '../utils/fechas';
import { SupabaseService } from './supabase';

interface FilaPedido {
  id: string;
  fecha: string;
  metodo_pago: MetodoPago;
  creado_en: string;
  ventas: { cantidad: number; total: number; productos: { nombre: string } | null }[];
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly db = inject(SupabaseService).cliente;

  async productos(): Promise<ProductoVenta[]> {
    const { data, error } = await this.db
      .from('productos')
      .select('id, nombre, precio_venta')
      .eq('activo', true)
      .order('orden')
      .order('nombre');
    if (error) throw error;
    return data.map((p) => ({ id: p.id, nombre: p.nombre, precioVenta: Number(p.precio_venta) }));
  }

  async registrar(metodo: MetodoPago, cantidades: Record<string, number>): Promise<void> {
    const { error } = await this.db.rpc('registrar_venta', {
      p_metodo: metodo,
      p_items: cantidades,
    });
    if (error) throw error;
  }

  async deHoy(): Promise<Pedido[]> {
    return this.deFecha(fechaIso());
  }

  async deFecha(fecha: string): Promise<Pedido[]> {
    const { data, error } = await this.db
      .from('pedidos')
      .select('id, fecha, metodo_pago, creado_en, ventas(cantidad, total, productos(nombre))')
      .eq('fecha', fecha)
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data as unknown as FilaPedido[]).map((f) => {
      const items = f.ventas.map((v) => ({
        nombre: v.productos?.nombre ?? 'Producto',
        cantidad: Number(v.cantidad),
        total: Number(v.total),
      }));
      return {
        id: f.id,
        fecha: f.fecha,
        metodoPago: f.metodo_pago,
        creadoEn: f.creado_en,
        items,
        total: items.reduce((t, i) => t + i.total, 0),
      };
    });
  }

  async deshacer(id: string): Promise<void> {
    const { error } = await this.db.from('pedidos').delete().eq('id', id);
    if (error) throw error;
  }
}
