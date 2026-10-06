import { Injectable, inject } from '@angular/core';
import { CATEGORIA_JUGOS, JugoDelDia } from '../models/modelos';
import { fechaIso } from '../utils/fechas';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class JugosService {
  private readonly db = inject(SupabaseService).cliente;

  async delDia(fecha = fechaIso()): Promise<JugoDelDia[]> {
    const [jugos, usados] = await Promise.all([
      this.db
        .from('insumos')
        .select('id, nombre, cantidad')
        .eq('categoria', CATEGORIA_JUGOS)
        .order('nombre'),
      this.db.from('jugos_dia').select('insumo_id, cantidad').eq('fecha', fecha),
    ]);
    if (jugos.error) throw jugos.error;
    if (usados.error) throw usados.error;

    const porJugo = new Map(usados.data.map((u) => [u.insumo_id, Number(u.cantidad)]));
    return jugos.data.map((j) => ({
      insumoId: j.id,
      nombre: j.nombre,
      enInventario: Number(j.cantidad),
      usadosHoy: porJugo.get(j.id) ?? 0,
    }));
  }

  async sumar(insumoId: string, cantidad: number): Promise<void> {
    const { error } = await this.db.rpc('sumar_jugos', {
      p_insumo: insumoId,
      p_cantidad: cantidad,
    });
    if (error) throw error;
  }
}
