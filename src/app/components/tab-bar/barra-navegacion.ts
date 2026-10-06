import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export type IconoNavegacion =
  | 'dashboard'
  | 'ventas'
  | 'productos'
  | 'inventario'
  | 'mas'
  | 'vender'
  | 'historial'
  | 'diario'
  | 'cuenta';

export interface ItemNavegacion {
  ruta: string;
  etiqueta: string;
  icono: IconoNavegacion;
}

export const NAVEGACION_ADMIN: ItemNavegacion[] = [
  { ruta: '/panel/dashboard', etiqueta: 'Inicio', icono: 'dashboard' },
  { ruta: '/panel/ventas', etiqueta: 'Ventas', icono: 'ventas' },
  { ruta: '/panel/productos', etiqueta: 'Productos', icono: 'productos' },
  { ruta: '/panel/inventario', etiqueta: 'Inventario', icono: 'inventario' },
  { ruta: '/panel/mas', etiqueta: 'Más', icono: 'mas' },
];

@Component({
  selector: 'app-barra-navegacion',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './barra-navegacion.html',
  styleUrl: './barra-navegacion.css',
})
export class BarraNavegacion {
  readonly items = input<ItemNavegacion[]>(NAVEGACION_ADMIN);
}
