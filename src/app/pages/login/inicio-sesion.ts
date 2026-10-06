import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

/** Login solo visual. Más adelante se conectará con Supabase Auth. */
@Component({
  selector: 'app-inicio-sesion',
  imports: [RouterLink],
  templateUrl: './inicio-sesion.html',
  styleUrl: './inicio-sesion.css',
})
export class InicioSesion {
  private readonly router = inject(Router);

  protected readonly correo = signal('');
  protected readonly clave = signal('');

  protected ingresar(evento: Event): void {
    evento.preventDefault();
    // TODO: autenticar con Supabase. Por ahora entra directo al panel.
    this.router.navigateByUrl('/panel');
  }
}
