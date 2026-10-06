const UN_DIA = 86_400_000;

export function aFecha(valor: string): Date {
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (soloFecha) {
    const [, anio, mes, dia] = soloFecha.map(Number);
    return new Date(anio, mes - 1, dia);
  }
  return new Date(valor);
}

export function fechaIso(fecha = new Date()): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function diasDesde(valor: string): number {
  const inicioHoy = new Date(new Date().toDateString()).getTime();
  const inicioFecha = new Date(aFecha(valor).toDateString()).getTime();
  return Math.round((inicioHoy - inicioFecha) / UN_DIA);
}

export function fechaDeHoy(): string {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}

const formatoMes = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });

export function nombreMes(mes: string): string {
  const texto = formatoMes.format(aFecha(mes));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function finDeMes(mes: string): string {
  const fecha = aFecha(mes);
  return fechaIso(new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0));
}

export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}
