import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { Ajustes } from '../../models/modelos';
import { CierresService } from '../../services/cierres';
import { mensajeDeError } from '../../services/supabase';

/** Editar el sueldo diario de la empleada y mi sueldo mensual. Va dentro de <app-hoja>. */
@Component({
  selector: 'app-ajustes-sueldos',
  imports: [CampoMoneda],
  template: `
    <form (submit)="guardar($event)" novalidate>
      <header class="hoja-barra">
        <button type="button" class="boton-texto" (click)="cancelar.emit()">Cancelar</button>
        <h2>Sueldos</h2>
        <button type="submit" class="boton-texto" [disabled]="!valido() || guardando()">
          {{ guardando() ? 'Guardando…' : 'Guardar' }}
        </button>
      </header>

      <div class="lista">
        <label class="fila campo" for="sueldo-empleada">
          <span class="campo-etiqueta">Empleada (por día)</span>
          <app-campo-moneda idCampo="sueldo-empleada" [(valor)]="empleada" />
        </label>
        <label class="fila campo" for="sueldo-mio">
          <span class="campo-etiqueta">Mi sueldo (por mes)</span>
          <app-campo-moneda idCampo="sueldo-mio" [(valor)]="mio" />
        </label>
      </div>
      <p class="nota-formulario">
        El de la empleada se descuenta al cerrar cada día (lo puedes cambiar en cada cierre).
        El tuyo lo registras en el resumen de cada mes.
      </p>

      @if (error()) {
        <div class="aviso-error" role="alert">{{ error() }}</div>
      }
    </form>
  `,
})
export class AjustesSueldos implements OnInit {
  private readonly servicio = inject(CierresService);

  readonly ajustes = input.required<Ajustes>();
  readonly guardado = output<Ajustes>();
  readonly cancelar = output<void>();

  protected readonly empleada = signal<number | null>(null);
  protected readonly mio = signal<number | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly valido = computed(() => this.empleada() !== null && this.mio() !== null);

  ngOnInit(): void {
    this.empleada.set(this.ajustes().sueldoEmpleadaDia);
    this.mio.set(this.ajustes().sueldoMioMes);
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.valido() || this.guardando()) return;

    const ajustes: Ajustes = { sueldoEmpleadaDia: this.empleada()!, sueldoMioMes: this.mio()! };
    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.servicio.guardarAjustes(ajustes);
      this.guardado.emit(ajustes);
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }
}
