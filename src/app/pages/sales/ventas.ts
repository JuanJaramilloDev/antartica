import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Encabezado } from '../../components/page-header/encabezado';
import { Venta } from '../../models/modelos';
import { FechaCortaPipe } from '../../pipes/fecha-corta';
import { MonedaPipe } from '../../pipes/moneda';
import { SupabaseService, mensajeDeError } from '../../services/supabase';
import { VentasService } from '../../services/ventas';
import { diasDesde, fechaIso } from '../../utils/fechas';

type Periodo = 'hoy' | 'semana' | 'mes';

@Component({
  selector: 'app-ventas',
  imports: [RouterLink, Encabezado, MonedaPipe, FechaCortaPipe],
  templateUrl: './ventas.html',
})
export class Ventas {
  private readonly servicio = inject(VentasService);
  protected readonly configurado = inject(SupabaseService).configurado;

  protected readonly periodos: { valor: Periodo; etiqueta: string; dias: number }[] = [
    { valor: 'hoy', etiqueta: 'Hoy', dias: 1 },
    { valor: 'semana', etiqueta: '7 días', dias: 7 },
    { valor: 'mes', etiqueta: '30 días', dias: 30 },
  ];
  protected readonly periodo = signal<Periodo>('semana');

  private readonly todas = signal<Venta[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly ventas = computed(() => {
    const dias = this.periodos.find((p) => p.valor === this.periodo())!.dias;
    return this.todas().filter((v) => diasDesde(v.fecha) < dias);
  });

  protected readonly total = computed(() => this.ventas().reduce((t, v) => t + v.total, 0));
  protected readonly ganancia = computed(() => this.ventas().reduce((t, v) => t + v.ganancia, 0));
  protected readonly unidades = computed(() => this.ventas().reduce((t, v) => t + v.cantidad, 0));

  constructor() {
    if (this.configurado) {
      this.cargar();
    } else {
      this.cargando.set(false);
    }
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const desde = new Date();
      desde.setDate(desde.getDate() - 29);
      this.todas.set(await this.servicio.desde(fechaIso(desde)));
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }
}
