export interface Producto {
  id: string;
  nombre: string;
  precioVenta: number;
  costo: number;
  activo: boolean;
  unidadesPaquete: number | null;
  insumoId: string | null;
}

export type DatosProducto = Omit<Producto, 'id'>;

export interface Venta {
  id: string;
  fecha: string;
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
  total: number;
  ganancia: number;
}

export type EstadoPrestamo = 'pendiente' | 'pagado';

export interface Prestamo {
  id: string;
  persona: string;
  monto: number;
  fecha: string;
  fechaLimite: string | null;
  notas: string | null;
  abonado: number;
  saldo: number;
  estado: EstadoPrestamo;
}

export type DatosPrestamo = Pick<Prestamo, 'persona' | 'monto' | 'fecha' | 'fechaLimite' | 'notas'>;

export interface Abono {
  id: string;
  prestamoId: string;
  monto: number;
  fecha: string;
}

export type TipoMovimiento =
  | 'saldo_inicial'
  | 'venta'
  | 'gasto'
  | 'prestamo'
  | 'abono'
  | 'ajuste'
  | 'ingreso';

export interface MovimientoCaja {
  id: string;
  fecha: string;
  tipo: TipoMovimiento;
  descripcion: string | null;
  monto: number;
}

export interface VasosDelDia {
  productoId: string;
  nombre: string;
  precioVenta: number;
  unidadesPaquete: number | null;
  cantidad: number;
  sobrantes: number | null;
  paquetesEnInventario: number | null;
}

export type CategoriaGasto = 'Sueldo' | 'Sueldo empleada' | 'Mi sueldo' | 'Reinversión' | 'Otro';

export interface Gasto {
  id: string;
  fecha: string;
  categoria: CategoriaGasto;
  descripcion: string | null;
  monto: number;
  cierreId: string | null;
}

export interface Ajustes {
  sueldoEmpleadaDia: number;
  sueldoMioMes: number;
}

export interface CierreDia {
  id: string;
  fecha: string;
  sueldoEmpleada: number;
  vasosVendidos: number;
  totalVentas: number;
  costo: number;
  totalFinal: number;
  ganancia: number;
}

export interface ResumenMes {
  mes: string;
  diasCerrados: number;
  vasos: number;
  ventas: number;
  costo: number;
  sueldoEmpleada: number;
  miSueldo: number;
  reinversion: number;
  otros: number;
  cierre: number;
  total: number;
  queda: number;
  otrosIngresos: number;
}

export interface Ingreso {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
}

export interface Insumo {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  minimo: number;
}

export type DatosInsumo = Omit<Insumo, 'id'>;

export const CATEGORIA_JUGOS = 'Jugos';
