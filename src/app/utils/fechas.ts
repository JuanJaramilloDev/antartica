const UN_DIA = 86_400_000;

/**
 * Convierte "2026-10-05" (fecha sin hora, como llega de Supabase) a fecha LOCAL.
 * `new Date('2026-10-05')` la tomaría como UTC y en Colombia quedaría en el día anterior.
 */
export function aFecha(valor: string): Date {
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (soloFecha) {
    const [, anio, mes, dia] = soloFecha.map(Number);
    return new Date(anio, mes - 1, dia);
  }
  return new Date(valor);
}

/** Fecha local en formato "2026-10-05" (lo que espera Supabase en columnas date). */
export function fechaIso(fecha = new Date()): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Días completos transcurridos desde la fecha hasta hoy (0 = hoy). Negativo si es futura. */
export function diasDesde(valor: string): number {
  const inicioHoy = new Date(new Date().toDateString()).getTime();
  const inicioFecha = new Date(aFecha(valor).toDateString()).getTime();
  return Math.round((inicioHoy - inicioFecha) / UN_DIA);
}

/** Fecha larga de hoy, ej: "lunes, 5 de octubre". */
export function fechaDeHoy(): string {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}

const formatoMes = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });

/** "2026-10-01" → "Octubre de 2026". */
export function nombreMes(mes: string): string {
  const texto = formatoMes.format(aFecha(mes));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Último día del mes de la fecha dada, en formato "2026-10-31". */
export function finDeMes(mes: string): string {
  const fecha = aFecha(mes);
  return fechaIso(new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0));
}

/** Iniciales para avatares, ej: "Laura Gómez" → "LG". */
export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}
