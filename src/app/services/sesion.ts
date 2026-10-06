import { Injectable, computed, inject, signal } from '@angular/core';
import type { AuthError, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';

export type Rol = 'admin' | 'empleada';

const INICIO_POR_ROL: Record<Rol, string> = {
  admin: '/panel',
  empleada: '/empleada',
};

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly db = inject(SupabaseService).cliente;

  readonly sesion = signal<Session | null>(null);
  readonly rol = signal<Rol | null>(null);
  readonly nombre = signal<string | null>(null);
  readonly correo = computed(() => this.sesion()?.user.email ?? null);

  private readonly lista: Promise<void>;

  constructor() {
    this.lista = this.cargar();
    this.db.auth.onAuthStateChange((_evento, sesion) => {
      this.sesion.set(sesion);
      if (!sesion) {
        this.rol.set(null);
        this.nombre.set(null);
      }
    });
  }

  async rolActual(): Promise<Rol | null> {
    await this.lista;
    return this.sesion() ? this.rol() : null;
  }

  rutaInicio(rol: Rol): string {
    return INICIO_POR_ROL[rol];
  }

  async iniciarSesion(correo: string, clave: string): Promise<Rol> {
    const { data, error } = await this.db.auth.signInWithPassword({
      email: correo,
      password: clave,
    });
    if (error) throw new Error(traducirError(error));

    this.sesion.set(data.session);
    const perfil = await this.leerPerfil(data.user.id);
    if (!perfil) {
      await this.cerrarSesion();
      throw new Error('Esta cuenta no tiene acceso. Pídele al administrador que la active.');
    }
    this.rol.set(perfil.rol);
    this.nombre.set(perfil.nombre);
    return perfil.rol;
  }

  async cerrarSesion(): Promise<void> {
    await this.db.auth.signOut();
    this.sesion.set(null);
    this.rol.set(null);
    this.nombre.set(null);
  }

  private async cargar(): Promise<void> {
    const { data } = await this.db.auth.getSession();
    this.sesion.set(data.session);
    if (data.session) {
      const perfil = await this.leerPerfil(data.session.user.id);
      this.rol.set(perfil?.rol ?? null);
      this.nombre.set(perfil?.nombre ?? null);
    }
  }

  private async leerPerfil(idUsuario: string): Promise<{ rol: Rol; nombre: string | null } | null> {
    const { data, error } = await this.db
      .from('perfiles')
      .select('rol, nombre')
      .eq('user_id', idUsuario)
      .maybeSingle();
    if (error || !data) return null;
    return { rol: data.rol as Rol, nombre: data.nombre };
  }
}

function traducirError(error: AuthError): string {
  const mensaje = error.message.toLowerCase();
  if (mensaje.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (mensaje.includes('email not confirmed')) {
    return 'Falta confirmar el correo. Confírmalo en Supabase → Authentication → Users.';
  }
  if (error.status === 429 || mensaje.includes('rate limit')) {
    return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
  }
  if (mensaje.includes('fetch') || mensaje.includes('network')) {
    return 'No se pudo conectar. Revisa tu internet.';
  }
  return 'No se pudo iniciar sesión. Intenta de nuevo.';
}
