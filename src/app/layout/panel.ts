import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BarraNavegacion } from '../components/tab-bar/barra-navegacion';

/** Contenedor del panel: página actual + barra de navegación inferior. */
@Component({
  selector: 'app-panel',
  imports: [RouterOutlet, BarraNavegacion],
  template: `
    <main>
      <router-outlet />
    </main>
    <app-barra-navegacion />
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
    }
  `,
})
export class Panel {}
