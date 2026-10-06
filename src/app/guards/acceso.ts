import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion';

export const soloAdmin: CanActivateFn = async () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  return (await sesion.esAdmin()) ? true : router.createUrlTree(['/login']);
};

export const soloSinSesion: CanActivateFn = async () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  return (await sesion.esAdmin()) ? router.createUrlTree(['/panel']) : true;
};
