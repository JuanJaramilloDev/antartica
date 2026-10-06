import { Component, computed, inject, signal } from '@angular/core';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { Encabezado } from '../../components/page-header/encabezado';
import { Ingreso } from '../../models/modelos';
import { FechaCortaPipe } from '../../pipes/fecha-corta';
import { MonedaPipe } from '../../pipes/moneda';
import { IngresosService } from '../../services/ingresos';
import { SupabaseService, mensajeDeError } from '../../services/supabase';
import { fechaIso } from '../../utils/fechas';

@Component({
  selector: 'app-otros-ingresos',
  imports: [Encabezado, CampoMoneda, MonedaPipe, FechaCortaPipe],
  templateUrl: './otros-ingresos.html',
})
export class OtrosIngresos {
  private readonly servicio = inject(IngresosService);
  protected readonly configurado = inject(SupabaseService).configurado;
  protected readonly hoy = fechaIso();

  protected readonly ingresos = signal<Ingreso[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly borrandoId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly monto = signal<number | null>(null);
  protected readonly descripcion = signal('');
  protected readonly fecha = signal(this.hoy);

  protected readonly valido = computed(
    () => (this.monto() ?? 0) > 0 && this.descripcion().trim().length > 0 && this.fecha() !== '',
  );

  protected readonly totalMes = computed(() => {
    const mes = this.hoy.slice(0, 7);
    return this.ingresos()
      .filter((i) => i.fecha.startsWith(mes))
      .reduce((total, i) => total + i.monto, 0);
  });

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
      this.ingresos.set(await this.servicio.listar());
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected async registrar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.valido() || this.guardando()) return;

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.servicio.registrar({
        monto: this.monto()!,
        descripcion: this.descripcion().trim(),
        fecha: this.fecha(),
      });
      this.monto.set(null);
      this.descripcion.set('');
      this.fecha.set(this.hoy);
      this.ingresos.set(await this.servicio.listar());
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async eliminar(ingreso: Ingreso): Promise<void> {
    if (this.guardando()) return;
    if (this.borrandoId() !== ingreso.id) {
      this.borrandoId.set(ingreso.id);
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.servicio.eliminar(ingreso.id);
      this.ingresos.update((lista) => lista.filter((i) => i.id !== ingreso.id));
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.borrandoId.set(null);
      this.guardando.set(false);
    }
  }
}
