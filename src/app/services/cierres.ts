import { Injectable, inject } from '@angular/core';
import { Ajustes, CategoriaGasto, CierreDia, EstadoCierre, Gasto, ResumenMes } from '../models/modelos';
import { fechaIso } from '../utils/fechas';
import { SupabaseService } from './supabase';

interface FilaCierre {
  id: string;
  fecha: string;
  sueldo_empleada: number;
  vasos_vendidos: number;
  total_ventas: number;
  costo: number;
  total_final: number;
  ganancia: number;
  estado: EstadoCierre;
  efectivo: number;
  nequi: number;
  efectivo_contado: number | null;
  nota: string | null;
  cerrado_por_nombre: string | null;
  verificado_en: string | null;
}

interface FilaMes {
  mes: string;
  dias_cerrados: number;
  vasos: number;
  ventas: number;
  costo: number;
  sueldo_empleada: number;
  mi_sueldo: number;
  reinversion: number;
  otros: number;
  cierre: number;
  total: number;
  queda: number;
  otros_ingresos: number;
}

interface FilaGasto {
  id: string;
  fecha: string;
  categoria: CategoriaGasto;
  descripcion: string | null;
  monto: number;
  cierre_id: string | null;
}

function aCierre(f: FilaCierre): CierreDia {
  return {
    id: f.id,
    fecha: f.fecha,
    sueldoEmpleada: Number(f.sueldo_empleada),
    vasosVendidos: Number(f.vasos_vendidos),
    totalVentas: Number(f.total_ventas),
    costo: Number(f.costo),
    totalFinal: Number(f.total_final),
    ganancia: Number(f.ganancia),
    estado: f.estado,
    efectivo: Number(f.efectivo),
    nequi: Number(f.nequi),
    efectivoContado: f.efectivo_contado === null ? null : Number(f.efectivo_contado),
    nota: f.nota,
    cerradoPorNombre: f.cerrado_por_nombre,
    verificadoEn: f.verificado_en,
  };
}

function aMes(f: FilaMes): ResumenMes {
  return {
    mes: f.mes,
    diasCerrados: Number(f.dias_cerrados),
    vasos: Number(f.vasos),
    ventas: Number(f.ventas),
    costo: Number(f.costo),
    sueldoEmpleada: Number(f.sueldo_empleada),
    miSueldo: Number(f.mi_sueldo),
    reinversion: Number(f.reinversion),
    otros: Number(f.otros),
    cierre: Number(f.cierre),
    total: Number(f.total),
    queda: Number(f.queda),
    otrosIngresos: Number(f.otros_ingresos ?? 0),
  };
}

function aGasto(f: FilaGasto): Gasto {
  return {
    id: f.id,
    fecha: f.fecha,
    categoria: f.categoria,
    descripcion: f.descripcion,
    monto: Number(f.monto),
    cierreId: f.cierre_id,
  };
}

const COLUMNAS_CIERRE =
  'id, fecha, sueldo_empleada, vasos_vendidos, total_ventas, costo, total_final, ganancia, estado, efectivo, nequi, efectivo_contado, nota, cerrado_por_nombre, verificado_en';

@Injectable({ providedIn: 'root' })
export class CierresService {
  private readonly db = inject(SupabaseService).cliente;

  async ajustes(): Promise<Ajustes> {
    const { data, error } = await this.db.from('ajustes').select('clave, valor');
    if (error) throw error;
    const valor = (clave: string) => Number(data.find((a) => a.clave === clave)?.valor ?? 0);
    return {
      sueldoEmpleadaDia: valor('sueldo_empleada_dia'),
      sueldoMioMes: valor('sueldo_mio_mes'),
    };
  }

  async guardarAjustes(ajustes: Ajustes): Promise<void> {
    const ahora = new Date().toISOString();
    const { error } = await this.db.from('ajustes').upsert([
      { clave: 'sueldo_empleada_dia', valor: ajustes.sueldoEmpleadaDia, actualizado_en: ahora },
      { clave: 'sueldo_mio_mes', valor: ajustes.sueldoMioMes, actualizado_en: ahora },
    ]);
    if (error) throw error;
  }

  async base(): Promise<number> {
    const { data, error } = await this.db
      .from('ajustes')
      .select('valor')
      .eq('clave', 'base')
      .maybeSingle();
    if (error) throw error;
    return Number(data?.valor ?? 0);
  }

  async guardarBase(valor: number): Promise<void> {
    const { error } = await this.db
      .from('ajustes')
      .upsert({ clave: 'base', valor, actualizado_en: new Date().toISOString() });
    if (error) throw error;
  }

  async cierres(limite = 60): Promise<CierreDia[]> {
    const { data, error } = await this.db
      .from('cierres_resumen')
      .select(COLUMNAS_CIERRE)
      .order('fecha', { ascending: false })
      .limit(limite);
    if (error) throw error;
    return (data as FilaCierre[]).map(aCierre);
  }

  async cierreDeHoy(): Promise<CierreDia | null> {
    return this.cierreDeFecha(fechaIso());
  }

  async cierreDeFecha(fecha: string): Promise<CierreDia | null> {
    const { data, error } = await this.db
      .from('cierres_resumen')
      .select(COLUMNAS_CIERRE)
      .eq('fecha', fecha)
      .maybeSingle();
    if (error) throw error;
    return data ? aCierre(data as FilaCierre) : null;
  }

  async cerrarDiaAdmin(
    fecha: string,
    sobrantes: Record<string, number>,
    sueldoEmpleada: number,
    nota: string,
  ): Promise<void> {
    const { error } = await this.db.rpc('cerrar_dia_admin', {
      p_fecha: fecha,
      p_bajados: {},
      p_sobrantes: sobrantes,
      p_sueldo_empleada: sueldoEmpleada,
      p_nota: nota,
    });
    if (error) throw error;
  }

  async cerrarDiaEmpleada(
    sobrantes: Record<string, number>,
    efectivoContado: number | null,
    nota: string,
  ): Promise<void> {
    const { error } = await this.db.rpc('cerrar_dia_empleada', {
      p_sobrantes: sobrantes,
      p_efectivo_contado: efectivoContado,
      p_nota: nota,
    });
    if (error) throw error;
  }

  async verificar(fecha: string, sueldoEmpleada: number): Promise<void> {
    const { error } = await this.db.rpc('verificar_cierre', {
      p_fecha: fecha,
      p_sueldo_empleada: sueldoEmpleada,
    });
    if (error) throw error;
  }

  async reabrir(fecha: string): Promise<void> {
    const { error } = await this.db.rpc('reabrir_cierre', { p_fecha: fecha });
    if (error) throw error;
  }

  async resumenMensual(): Promise<ResumenMes[]> {
    const { data, error } = await this.db
      .from('resumen_mensual')
      .select('*')
      .order('mes', { ascending: false });
    if (error) throw error;
    return (data as FilaMes[]).map(aMes);
  }

  async gastosDelMes(mes: string): Promise<Gasto[]> {
    const { data, error } = await this.db
      .from('gastos')
      .select('id, fecha, categoria, descripcion, monto, cierre_id')
      .gte('fecha', mes)
      .lt('fecha', mesSiguiente(mes))
      .order('fecha', { ascending: false })
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return (data as FilaGasto[]).map(aGasto);
  }

  async registrarGasto(gasto: Omit<Gasto, 'id' | 'cierreId'>): Promise<void> {
    const { error } = await this.db.from('gastos').insert(gasto);
    if (error) throw error;
  }

  async eliminarGasto(id: string): Promise<void> {
    const { error } = await this.db.from('gastos').delete().eq('id', id);
    if (error) throw error;
  }
}

export function mesSiguiente(mes: string): string {
  const [anio, numeroMes] = mes.split('-').map(Number);
  return numeroMes === 12
    ? `${anio + 1}-01-01`
    : `${anio}-${String(numeroMes + 1).padStart(2, '0')}-01`;
}
