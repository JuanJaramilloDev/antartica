import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { entorno } from '../../environments/entorno';

/** Cliente único de Supabase para toda la app. */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  /** false mientras entorno.ts tenga los valores de ejemplo. */
  readonly configurado =
    !entorno.supabaseUrl.includes('TU-PROYECTO') && !entorno.supabaseAnonKey.startsWith('TU-');

  readonly cliente: SupabaseClient = createClient(entorno.supabaseUrl, entorno.supabaseAnonKey);
}

/** Convierte errores de Supabase/red en mensajes claros en español. */
export function mensajeDeError(error: unknown): string {
  const e = error as { code?: string; message?: string };
  const mensaje = e?.message ?? '';
  if (mensaje.includes('Failed to fetch') || mensaje.includes('NetworkError')) {
    return 'No se pudo conectar con Supabase. Revisa tu internet y la URL en entorno.ts.';
  }
  switch (e?.code) {
    case '42501':
      return 'Sin permiso. Ejecuta supabase/02_acceso_temporal.sql en Supabase.';
    case '42P01':
    case '42703':
    case '42883':
    case 'PGRST202':
    case 'PGRST204':
    case 'PGRST205':
      return 'Falta actualizar la base de datos. Ejecuta los SQL pendientes de la carpeta supabase/.';
    case '23001':
    case '23503':
      return 'Este registro está siendo usado en otra parte y no se puede borrar.';
  }
  return mensaje || 'Ocurrió un error inesperado.';
}
