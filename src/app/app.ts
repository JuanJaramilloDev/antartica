import { Component, inject } from '@angular/core';
import { NavigationEnd, NavigationError, Router, RouterOutlet } from '@angular/router';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd || e instanceof NavigationError),
        take(1),
      )
      .subscribe(() => {
        const inicio = document.getElementById('inicio');
        inicio?.classList.add('oculto');
        setTimeout(() => inicio?.remove(), 400);
      });
  }
}
