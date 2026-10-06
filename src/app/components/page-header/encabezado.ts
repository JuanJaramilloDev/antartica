import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-encabezado',
  imports: [RouterLink],
  template: `
    @if (volver()) {
      <a class="volver" [routerLink]="volver()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        {{ textoVolver() }}
      </a>
    }
    <header class="encabezado">
      <div>
        @if (subtitulo()) {
          <p class="subtitulo">{{ subtitulo() }}</p>
        }
        <h1>{{ titulo() }}</h1>
      </div>
      <div class="acciones"><ng-content /></div>
    </header>
  `,
  styles: `
    .volver {
      display: inline-flex;
      align-items: center;
      margin: 0 0 -4px -6px;
      padding: 4px 0;
      font-size: 17px;
      color: var(--azul-fuerte);
    }
    .volver svg {
      width: 24px;
      height: 24px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .encabezado {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 4px 16px;
    }
    .subtitulo {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--texto-secundario);
    }
    h1 {
      margin: 2px 0 0;
      font-size: 34px;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.1;
    }
    .acciones {
      display: flex;
      gap: 8px;
      padding-bottom: 4px;
    }
  `,
})
export class Encabezado {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
  readonly volver = input<string>();
  readonly textoVolver = input('Más');
}
