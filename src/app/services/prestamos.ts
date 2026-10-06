import { Injectable, inject } from '@angular/core';
import { Abono, DatosPrestamo, EstadoPrestamo, Prestamo } from '../models/modelos';
import { SupabaseService } from './supabase';

interface FilaPrestamo {
  id: string;
  persona: string;
  monto: number;
  fecha: string;
  fecha_limite: string | null;
  notas: string | null;
  abonado: number;
  saldo: number;
  estado: EstadoPrestamo;
}

interface FilaAbono {
  id: string;
  prestamo_id: string;
  monto: number;
  fecha: string;
}

const COLUMNAS = 'id, persona, monto, fecha, fecha_limite, notas, abonado, saldo, estado';

function aPrestamo(fila: FilaPrestamo): Prestamo {
  return {
    id: fila.id,
    persona: fila.persona,
    monto: Number(fila.monto),
    fecha: fila.fecha,
    fechaLimite: fila.fecha_limite,
    notas: fila.notas,
    abonado: Number(fila.abonado),
    saldo: Number(fila.saldo),
    estado: fila.estado,
  };
}

function aAbono(fila: FilaAbono): Abono {
  return {
    id: fila.id,
    prestamoId: fila.prestamo_id,
    monto: Number(fila.monto),
    fecha: fila.fecha,
  };
}

/**
 * Préstamos de dinero que haces. La caja se ajusta sola en Supabase:
 * prestar resta, cada abono suma.
 */
@Injectable({ providedIn: 'root' })
export class PrestamosService {
  private readonly db = inject(SupabaseService).cliente;

  async listar(): Promise<Prestamo[]> {
    const { data, error } = await this.db
      .from('prestamos_resumen')
      .select(COLUMNAS)
      .order('fecha', { ascending: false })
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data as FilaPrestamo[]).map(aPrestamo);
  }

  /** Vuelve a leer un préstamo (para tener abonado/saldo/estado al día). */
  async obtener(id: string): Promise<Prestamo> {
    const { data, error } = await this.db
      .from('prestamos_resumen')
      .select(COLUMNAS)
      .eq('id', id)
      .single();
    if (error) throw error;
    return aPrestamo(data as FilaPrestamo);
  }

  /** Crea el préstamo, o lo actualiza si se pasa el id. */
  async guardar(datos: DatosPrestamo, id?: string): Promise<Prestamo> {
    const fila = {
      persona: datos.persona,
      monto: datos.monto,
      fecha: datos.fecha,
      fecha_limite: datos.fechaLimite,
      notas: datos.notas,
    };
    const consulta = id
      ? this.db.from('prestamos').update(fila).eq('id', id)
      : this.db.from('prestamos').insert(fila);
    const { data, error } = await consulta.select('id').single();
    if (error) throw error;
    return this.obtener(data.id);
  }

  /** Borra el préstamo y sus abonos; la caja se corrige sola. */
  async eliminar(id: string): Promise<void> {
    const { error } = await this.db.from('prestamos').delete().eq('id', id);
    if (error) throw error;
  }

  async abonos(prestamoId: string): Promise<Abono[]> {
    const { data, error } = await this.db
      .from('abonos')
      .select('id, prestamo_id, monto, fecha')
      .eq('prestamo_id', prestamoId)
      .order('fecha', { ascending: false })
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data as FilaAbono[]).map(aAbono);
  }

  async registrarAbono(prestamoId: string, monto: number, fecha: string): Promise<void> {
    const { error } = await this.db
      .from('abonos')
      .insert({ prestamo_id: prestamoId, monto, fecha });
    if (error) throw error;
  }

  async eliminarAbono(id: string): Promise<void> {
    const { error } = await this.db.from('abonos').delete().eq('id', id);
    if (error) throw error;
  }
}
