import { Injectable, inject } from '@angular/core';
import { Ingreso } from '../models/modelos';
import { SupabaseService } from './supabase';

/** Ingresos por fuera del negocio. La caja se ajusta sola en Supabase. */
@Injectable({ providedIn: 'root' })
export class IngresosService {
  private readonly db = inject(SupabaseService).cliente;

  async listar(limite = 100): Promise<Ingreso[]> {
    const { data, error } = await this.db
      .from('ingresos')
      .select('id, fecha, descripcion, monto')
      .order('fecha', { ascending: false })
      .order('creado_en', { ascending: false })
      .limit(limite);
    if (error) throw error;
    return data.map((f) => ({ ...f, monto: Number(f.monto) }) as Ingreso);
  }

  async registrar(ingreso: Omit<Ingreso, 'id'>): Promise<void> {
    const { error } = await this.db.from('ingresos').insert(ingreso);
    if (error) throw error;
  }

  async eliminar(id: string): Promise<void> {
    const { error } = await this.db.from('ingresos').delete().eq('id', id);
    if (error) throw error;
  }
}
