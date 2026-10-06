import { Injectable, computed, inject, signal } from '@angular/core';
import type { AuthError, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';

export type Rol = 'admin' | 'empleada';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly db = inject(SupabaseService).cliente;

  readonly sesion = signal<Session | null>(null);
  readonly rol = signal<Rol | null>(null);
  readonly correo = computed(() => this.sesion()?.user.email ?? null);

  private readonly lista: Promise<void>;

  constructor() {
    this.lista = this.cargar();
    this.db.auth.onAuthStateChange((_evento, sesion) => {
      this.sesion.set(sesion);
      if (!sesion) this.rol.set(null);
    });
  }

  async esAdmin(): Promise<boolean> {
    await this.lista;
    return this.sesion() !== null && this.rol() === 'admin';
  }

  async iniciarSesion(correo: string, clave: string): Promise<void> {
    const { data, error } = await this.db.auth.signInWithPassword({
      email: correo,
      password: clave,
    });
    if (error) throw new Error(traducirError(error));

    this.sesion.set(data.session);
    const rol = await this.leerRol(data.user.id);
    if (rol !== 'admin') {
      await this.cerrarSesion();
      throw new Error('Esta cuenta no tiene acceso al panel.');
    }
    this.rol.set(rol);
  }

  async cerrarSesion(): Promise<void> {
    await this.db.auth.signOut();
    this.sesion.set(null);
    this.rol.set(null);
  }

  private async cargar(): Promise<void> {
    const { data } = await this.db.auth.getSession();
    this.sesion.set(data.session);
    if (data.session) this.rol.set(await this.leerRol(data.session.user.id));
  }

  private async leerRol(idUsuario: string): Promise<Rol | null> {
    const { data, error } = await this.db
      .from('perfiles')
      .select('rol')
      .eq('user_id', idUsuario)
      .maybeSingle();
    if (error) return null;
    return (data?.rol as Rol | undefined) ?? null;
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
