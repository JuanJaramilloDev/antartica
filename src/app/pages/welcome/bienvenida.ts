import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Pantalla de entrada. Por ahora solo tiene el acceso al panel; se diseñará más adelante. */
@Component({
  selector: 'app-bienvenida',
  imports: [RouterLink],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.css',
})
export class Bienvenida {}
