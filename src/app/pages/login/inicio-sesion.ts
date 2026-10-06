import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SesionService } from '../../services/sesion';

@Component({
  selector: 'app-inicio-sesion',
  imports: [RouterLink],
  templateUrl: './inicio-sesion.html',
  styleUrl: './inicio-sesion.css',
})
export class InicioSesion {
  private readonly router = inject(Router);
  private readonly sesion = inject(SesionService);

  protected readonly correo = signal('');
  protected readonly clave = signal('');
  protected readonly verClave = signal(false);
  protected readonly entrando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly valido = computed(
    () => this.correo().trim().length > 0 && this.clave().length > 0,
  );

  protected async ingresar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.valido() || this.entrando()) return;

    this.entrando.set(true);
    this.error.set(null);
    try {
      const rol = await this.sesion.iniciarSesion(this.correo().trim(), this.clave());
      await this.router.navigateByUrl(this.sesion.rutaInicio(rol));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      this.entrando.set(false);
    }
  }
}
