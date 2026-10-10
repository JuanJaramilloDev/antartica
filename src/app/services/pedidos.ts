import { Injectable, inject } from '@angular/core';
import { MetodoPago, Pedido } from '../models/modelos';
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
}
