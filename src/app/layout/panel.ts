import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { BarraNavegacion } from '../components/tab-bar/barra-navegacion';
import { SesionService } from '../services/sesion';

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
export class Panel {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (!this.sesion.sesion()) this.router.navigateByUrl('/login');
    });
  }
}
