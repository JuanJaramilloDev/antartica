// Modelos de la app. Reflejan las tablas/vistas de supabase/01_esquema.sql (en camelCase).

/** Lo que se vende: Vaso 9 oz, Vaso 12 oz... */
export interface Producto {
  id: string;
  nombre: string;
  precioVenta: number;
  /** Costo de fabricación por unidad. */
  costo: number;
  activo: boolean;
  /** Unidades que trae un paquete (9 oz = 25, 12 oz = 50). null si no aplica. */
  unidadesPaquete: number | null;
  /** Insumo del inventario del que se descuentan los paquetes al bajar vasos. */
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

/** Préstamo de dinero (vista prestamos_resumen). */
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

/** Entrada (+) o salida (−) de plata de la caja. */
export interface MovimientoCaja {
  id: string;
  fecha: string;
  tipo: TipoMovimiento;
  descripcion: string | null;
  monto: number;
}

/** Vasos de un tamaño que se bajaron para vender en el día. */
export interface VasosDelDia {
  productoId: string;
  nombre: string;
  precioVenta: number;
  unidadesPaquete: number | null;
  /** Vasos bajados. */
  cantidad: number;
  /** Vasos que sobraron al cerrar (null si aún no se cierra). */
  sobrantes: number | null;
  /** Paquetes que quedan en inventario (null si no está unido a un insumo). */
  paquetesEnInventario: number | null;
}

export type CategoriaGasto = 'Sueldo' | 'Sueldo empleada' | 'Mi sueldo' | 'Reinversión' | 'Otro';

export interface Gasto {
  id: string;
  fecha: string;
  categoria: CategoriaGasto;
  descripcion: string | null;
  monto: number;
  /** Si lo creó un cierre del día (pago de la empleada). */
  cierreId: string | null;
}

/** Sueldos editables. */
export interface Ajustes {
  sueldoEmpleadaDia: number;
  sueldoMioMes: number;
}

/** Cierre de un día (vista cierres_resumen). */
export interface CierreDia {
  id: string;
  fecha: string;
  sueldoEmpleada: number;
  vasosVendidos: number;
  totalVentas: number;
  costo: number;
  /** Lo que debes tener: ventas − sueldo empleada. */
  totalFinal: number;
  /** Ventas − costo de fabricación − sueldo empleada. */
  ganancia: number;
}

/** Un mes, como la tabla MENSUAL del Excel (vista resumen_mensual). */
export interface ResumenMes {
  /** Primer día del mes, ej: "2026-10-01". */
  mes: string;
  diasCerrados: number;
  vasos: number;
  ventas: number;
  costo: number;
  sueldoEmpleada: number;
  miSueldo: number;
  reinversion: number;
  otros: number;
  /** Ventas − sueldo empleada. */
  cierre: number;
  /** Cierre − reinversión − otros gastos. */
  total: number;
  /** Total − mi sueldo. */
  queda: number;
  /** Plata que entró por fuera del negocio (no se mezcla con lo de arriba). */
  otrosIngresos: number;
}

/** Ingreso por fuera del negocio: suma a la caja. */
export interface Ingreso {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
}

/** Insumo del inventario: gomitas, salsas, vasos, jugos... */
export interface Insumo {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  /** Avisa "por reponer" cuando la cantidad llega a este número o menos. */
  minimo: number;
}

export type DatosInsumo = Omit<Insumo, 'id'>;

/** Los jugos (bolsas por color) van en el inventario pero se muestran aparte. */
export const CATEGORIA_JUGOS = 'Jugos';
