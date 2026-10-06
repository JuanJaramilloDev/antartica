import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Encabezado } from '../../components/page-header/encabezado';
import { SesionService } from '../../services/sesion';

@Component({
  selector: 'app-cuenta',
  imports: [Encabezado],
  template: `
    <div class="pagina">
      <app-encabezado titulo="Cuenta" />

      <div class="lista">
        <div class="fila">
          <span class="fila-icono">{{ inicial() }}</span>
          <span class="fila-cuerpo">
            <span class="fila-titulo" style="display: block">{{ nombre() || 'Empleada' }}</span>
            <span class="fila-subtitulo" style="display: block">{{ correo() }}</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        class="boton-peligro"
        style="margin-top: 16px"
        [class.confirmar]="confirmando()"
        [disabled]="saliendo()"
        (click)="cerrarSesion()"
      >
        {{ saliendo() ? 'Cerrando…' : confirmando() ? 'Toca de nuevo para salir' : 'Cerrar sesión' }}
      </button>
    </div>
  `,
})
export class Cuenta {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  protected readonly nombre = this.sesion.nombre;
  protected readonly correo = this.sesion.correo;
  protected readonly confirmando = signal(false);
  protected readonly saliendo = signal(false);

  protected inicial(): string {
    return (this.nombre() || this.correo() || 'E').charAt(0).toUpperCase();
  }

  protected async cerrarSesion(): Promise<void> {
    if (!this.confirmando()) {
      this.confirmando.set(true);
      return;
    }
    this.saliendo.set(true);
    try {
      await this.sesion.cerrarSesion();
    } finally {
      this.saliendo.set(false);
      await this.router.navigateByUrl('/login');
    }
  }
}
