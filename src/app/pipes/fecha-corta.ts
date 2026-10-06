import { Pipe, PipeTransform } from '@angular/core';
import { aFecha, diasDesde } from '../utils/fechas';

const formatoDia = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

@Pipe({ name: 'fechaCorta' })
export class FechaCortaPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (!valor) return '';
    const dias = diasDesde(valor);
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias === -1) return 'Mañana';
    return formatoDia.format(aFecha(valor)).replace('.', '');
  }
}
