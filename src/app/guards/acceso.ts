import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol, SesionService } from '../services/sesion';

function soloRol(permitido: Rol): CanActivateFn {
  return async () => {
    const sesion = inject(SesionService);
    const router = inject(Router);
    const rol = await sesion.rolActual();
    if (rol === permitido) return true;
    return router.createUrlTree([rol ? sesion.rutaInicio(rol) : '/login']);
  };
}

export const soloAdmin = soloRol('admin');
export const soloEmpleada = soloRol('empleada');

export const soloSinSesion: CanActivateFn = async () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  const rol = await sesion.rolActual();
  return rol ? router.createUrlTree([sesion.rutaInicio(rol)]) : true;
};
