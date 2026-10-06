import { Injectable, inject } from '@angular/core';
import { MovimientoCaja } from '../models/modelos';
import { fechaIso } from '../utils/fechas';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly db = inject(SupabaseService).cliente;

  /** Plata disponible: suma de todos los movimientos de caja. */
  async saldo(): Promise<number> {
    const { data, error } = await this.db.from('caja_saldo').select('saldo').single();
    if (error) throw error;
    return Number(data.saldo);
  }

  /** Plata que prestaste y aún no te han devuelto. */
  async prestadoPorCobrar(): Promise<number> {
    const { data, error } = await this.db
      .from('prestamos_resumen')
      .select('saldo')
      .eq('estado', 'pendiente');
    if (error) throw error;
    return data.reduce((total, fila) => total + Number(fila.saldo), 0);
  }

  async movimientos(limite = 30): Promise<MovimientoCaja[]> {
    const { data, error } = await this.db
      .from('movimientos_caja')
      .select('id, fecha, tipo, descripcion, monto')
      .order('fecha', { ascending: false })
      .order('creado_en', { ascending: false })
      .limit(limite);
    if (error) throw error;
    return data.map((fila) => ({ ...fila, monto: Number(fila.monto) }) as MovimientoCaja);
  }

  /** Mete (monto positivo) o saca (negativo) plata de la caja a mano. */
  async ajustar(monto: number, descripcion: string): Promise<void> {
    const { error } = await this.db
      .from('movimientos_caja')
      .insert({ tipo: 'ajuste', monto, descripcion, fecha: fechaIso() });
    if (error) throw error;
  }
}
