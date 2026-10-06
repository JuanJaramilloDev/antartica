import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { BarraNavegacion, ItemNavegacion } from '../components/tab-bar/barra-navegacion';
import { SesionService } from '../services/sesion';

const NAVEGACION_EMPLEADA: ItemNavegacion[] = [
  { ruta: '/empleada/vender', etiqueta: 'Vender', icono: 'vender' },
  { ruta: '/empleada/ventas', etiqueta: 'Mis ventas', icono: 'historial' },
  { ruta: '/empleada/diario', etiqueta: 'Diario', icono: 'diario' },
  { ruta: '/empleada/cuenta', etiqueta: 'Cuenta', icono: 'cuenta' },
];

@Component({
  selector: 'app-empleada',
  imports: [RouterOutlet, BarraNavegacion],
  template: `
    <main>
      <router-outlet />
    </main>
    <app-barra-navegacion [items]="navegacion" />
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
    }
  `,
})
export class Empleada {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  protected readonly navegacion = NAVEGACION_EMPLEADA;

  constructor() {
    effect(() => {
      if (!this.sesion.sesion()) this.router.navigateByUrl('/login');
    });
  }
}
