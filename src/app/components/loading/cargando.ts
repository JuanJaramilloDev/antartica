import { Component } from '@angular/core';

@Component({
  selector: 'app-cargando',
  template: `<div class="vaso-carga" role="status" aria-label="Cargando"></div>`,
  styles: `
    :host {
      display: flex;
      justify-content: center;
      padding: 32px 0;
    }
  `,
})
export class Cargando {}
