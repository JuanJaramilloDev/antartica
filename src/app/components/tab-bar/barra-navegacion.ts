import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface ItemNavegacion {
  ruta: string;
  etiqueta: string;
  icono: 'dashboard' | 'ventas' | 'productos' | 'inventario' | 'mas';
}

@Component({
  selector: 'app-barra-navegacion',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './barra-navegacion.html',
  styleUrl: './barra-navegacion.css',
})
export class BarraNavegacion {
  protected readonly items: ItemNavegacion[] = [
    { ruta: '/panel/dashboard', etiqueta: 'Inicio', icono: 'dashboard' },
    { ruta: '/panel/ventas', etiqueta: 'Ventas', icono: 'ventas' },
    { ruta: '/panel/productos', etiqueta: 'Productos', icono: 'productos' },
    { ruta: '/panel/inventario', etiqueta: 'Inventario', icono: 'inventario' },
    { ruta: '/panel/mas', etiqueta: 'Más', icono: 'mas' },
  ];
}
