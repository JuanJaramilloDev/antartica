import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { Prestamo } from '../../models/modelos';
import { MonedaPipe } from '../../pipes/moneda';
import { PrestamosService } from '../../services/prestamos';
import { mensajeDeError } from '../../services/supabase';
import { fechaIso } from '../../utils/fechas';

@Component({
  selector: 'app-formulario-prestamo',
  imports: [CampoMoneda, MonedaPipe],
  templateUrl: './formulario-prestamo.html',
})
export class FormularioPrestamo implements OnInit {
  private readonly servicio = inject(PrestamosService);

  readonly prestamo = input<Prestamo | null>(null);
  readonly guardado = output<Prestamo>();
  readonly eliminado = output<string>();
  readonly cancelar = output<void>();

  protected readonly persona = signal('');
  protected readonly monto = signal<number | null>(null);
  protected readonly fecha = signal(fechaIso());
  protected readonly fechaLimite = signal('');
  protected readonly notas = signal('');

  protected readonly guardando = signal(false);
  protected readonly confirmandoEliminar = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly esEdicion = computed(() => this.prestamo() !== null);
  protected readonly abonado = computed(() => this.prestamo()?.abonado ?? 0);
  protected readonly valido = computed(
    () =>
      this.persona().trim().length > 0 &&
      (this.monto() ?? 0) > 0 &&
      (this.monto() ?? 0) >= this.abonado() &&
      this.fecha() !== '',
  );

  ngOnInit(): void {
    const prestamo = this.prestamo();
    if (prestamo) {
      this.persona.set(prestamo.persona);
      this.monto.set(prestamo.monto);
      this.fecha.set(prestamo.fecha);
      this.fechaLimite.set(prestamo.fechaLimite ?? '');
      this.notas.set(prestamo.notas ?? '');
    }
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.valido() || this.guardando()) return;

    this.guardando.set(true);
    this.error.set(null);
    try {
      const guardado = await this.servicio.guardar(
        {
          persona: this.persona().trim(),
          monto: this.monto()!,
          fecha: this.fecha(),
          fechaLimite: this.fechaLimite() || null,
          notas: this.notas().trim() || null,
        },
        this.prestamo()?.id,
      );
      this.guardado.emit(guardado);
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async eliminar(): Promise<void> {
    const prestamo = this.prestamo();
    if (!prestamo || this.guardando()) return;
    if (!this.confirmandoEliminar()) {
      this.confirmandoEliminar.set(true);
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.servicio.eliminar(prestamo.id);
      this.eliminado.emit(prestamo.id);
    } catch (error) {
      this.error.set(mensajeDeError(error));
      this.confirmandoEliminar.set(false);
    } finally {
      this.guardando.set(false);
    }
  }
}
