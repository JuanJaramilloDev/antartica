import { Routes } from '@angular/router';
import { soloAdmin, soloEmpleada, soloSinSesion } from './guards/acceso';

export const routes: Routes = [
  {
    path: '',
    title: 'Antártica',
    canActivate: [soloSinSesion],
    loadComponent: () => import('./pages/welcome/bienvenida').then((m) => m.Bienvenida),
  },
  {
    path: 'login',
    title: 'Iniciar sesión · Antártica',
    canActivate: [soloSinSesion],
    loadComponent: () => import('./pages/login/inicio-sesion').then((m) => m.InicioSesion),
  },
  {
    path: 'empleada',
    canActivate: [soloEmpleada],
    loadComponent: () => import('./layout/empleada').then((m) => m.Empleada),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'vender' },
      {
        path: 'vender',
        title: 'Vender · Antártica',
        loadComponent: () => import('./pages/staff/vender').then((m) => m.Vender),
      },
      {
        path: 'ventas',
        title: 'Mis ventas · Antártica',
        loadComponent: () => import('./pages/staff/mis-ventas').then((m) => m.MisVentas),
      },
      {
        path: 'diario',
        title: 'Diario · Antártica',
        loadComponent: () => import('./pages/staff/diario').then((m) => m.Diario),
      },
      {
        path: 'cuenta',
        title: 'Cuenta · Antártica',
        loadComponent: () => import('./pages/staff/cuenta').then((m) => m.Cuenta),
      },
    ],
  },
  {
    path: 'panel',
    canActivate: [soloAdmin],
    loadComponent: () => import('./layout/panel').then((m) => m.Panel),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · Antártica',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'ventas',
        title: 'Ventas · Antártica',
        loadComponent: () => import('./pages/sales/ventas').then((m) => m.Ventas),
      },
      {
        path: 'productos',
        title: 'Productos · Antártica',
        loadComponent: () => import('./pages/products/productos').then((m) => m.Productos),
      },
      {
        path: 'inventario',
        title: 'Inventario · Antártica',
        loadComponent: () => import('./pages/inventory/inventario').then((m) => m.Inventario),
      },
      {
        path: 'mas',
        title: 'Más · Antártica',
        loadComponent: () => import('./pages/more/mas').then((m) => m.Mas),
      },
      {
        path: 'mas/prestamos',
        title: 'Préstamos · Antártica',
        loadComponent: () => import('./pages/loans/prestamos').then((m) => m.Prestamos),
      },
      {
        path: 'mas/cierres',
        title: 'Cierres · Antártica',
        loadComponent: () => import('./pages/closings/cierres').then((m) => m.Cierres),
      },
      {
        path: 'mas/ingresos',
        title: 'Otros ingresos · Antártica',
        loadComponent: () =>
          import('./pages/income/otros-ingresos').then((m) => m.OtrosIngresos),
      },
      { path: 'prestamos', redirectTo: 'mas/prestamos' },
    ],
  },
  { path: '**', redirectTo: '' },
];
