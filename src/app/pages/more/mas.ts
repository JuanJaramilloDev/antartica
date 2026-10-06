import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Encabezado } from '../../components/page-header/encabezado';

interface Opcion {
  ruta: string;
  titulo: string;
  descripcion: string;
  icono: 'prestamos' | 'cierres' | 'ingresos';
}

/** Pestaña "Más": lista de secciones extra. Para agregar una, súmala a `opciones`. */
@Component({
  selector: 'app-mas',
  imports: [RouterLink, Encabezado],
  template: `
    <div class="pagina">
      <app-encabezado titulo="Más" />

      <div class="lista">
        @for (opcion of opciones; track opcion.ruta) {
          <a class="fila opcion" [routerLink]="opcion.ruta">
            <span class="fila-icono icono" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                @switch (opcion.icono) {
                  @case ('prestamos') {
                    <path d="M7 4L3 8l4 4" />
                    <path d="M3 8h14" />
                    <path d="M17 20l4-4-4-4" />
                    <path d="M21 16H7" />
                  }
                  @case ('cierres') {
                    <rect x="4" y="3" width="16" height="18" rx="2.5" />
                    <path d="M8 8h8M8 12h8M8 16h5" />
                  }
                  @case ('ingresos') {
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="M12 8v8M8 12h8" />
                  }
                }
              </svg>
            </span>
            <span class="fila-cuerpo">
              <span class="fila-titulo" style="display: block">{{ opcion.titulo }}</span>
              <span class="fila-subtitulo" style="display: block">{{ opcion.descripcion }}</span>
            </span>
            <svg class="chevron" viewBox="0 0 8 14" aria-hidden="true"><path d="M1 1l6 6-6 6" /></svg>
          </a>
        }
      </div>
    </div>
  `,
  styles: `
    .opcion {
      transition: background 0.15s;
    }
    .opcion:active {
      background: rgba(118, 118, 128, 0.12);
    }
    .icono {
      background: var(--azul);
      color: var(--blanco);
    }
    .icono svg {
      width: 20px;
      height: 20px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class Mas {
  protected readonly opciones: Opcion[] = [
    {
      ruta: '/panel/mas/prestamos',
      titulo: 'Préstamos',
      descripcion: 'Plata que prestas y sus abonos',
      icono: 'prestamos',
    },
    {
      ruta: '/panel/mas/cierres',
      titulo: 'Cierres',
      descripcion: 'Cierre del día, meses y sueldos',
      icono: 'cierres',
    },
    {
      ruta: '/panel/mas/ingresos',
      titulo: 'Otros ingresos',
      descripcion: 'Plata que ganas por fuera del negocio',
      icono: 'ingresos',
    },
  ];
}
