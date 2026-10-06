import { Injectable, inject } from '@angular/core';
import { DatosInsumo, Insumo } from '../models/modelos';
import { SupabaseService } from './supabase';

interface FilaInsumo {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  minimo: number;
}

const COLUMNAS = 'id, nombre, categoria, cantidad, unidad, minimo';

function aInsumo(fila: FilaInsumo): Insumo {
  return {
    ...fila,
    cantidad: Number(fila.cantidad),
    minimo: Number(fila.minimo),
  };
}

@Injectable({ providedIn: 'root' })
export class InsumosService {
  private readonly db = inject(SupabaseService).cliente;

  async listar(): Promise<Insumo[]> {
    const { data, error } = await this.db
      .from('insumos')
      .select(COLUMNAS)
      .order('categoria')
      .order('nombre');
    if (error) throw error;
    return (data as FilaInsumo[]).map(aInsumo);
  }

  async guardar(datos: DatosInsumo, id?: string): Promise<Insumo> {
    const consulta = id
      ? this.db.from('insumos').update(datos).eq('id', id)
      : this.db.from('insumos').insert(datos);
    const { data, error } = await consulta.select(COLUMNAS).single();
    if (error) throw error;
    return aInsumo(data as FilaInsumo);
  }

  async eliminar(id: string): Promise<void> {
    const { error } = await this.db.from('insumos').delete().eq('id', id);
    if (error) throw error;
  }
}
