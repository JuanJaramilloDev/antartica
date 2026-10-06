import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { CierresService } from '../../services/cierres';
import { mensajeDeError } from '../../services/supabase';

@Component({
  selector: 'app-ajuste-base',
  imports: [CampoMoneda],
  template: `
    <form (submit)="guardar($event)" novalidate>
      <header class="hoja-barra">
        <button type="button" class="boton-texto" (click)="cerrar.emit()">Cancelar</button>
        <h2>Base</h2>
        <button type="submit" class="boton-texto" [disabled]="!cambio() || guardando()">
          {{ guardando() ? 'Guardando…' : 'Guardar' }}
        </button>
      </header>

      <div class="lista">
        <label class="fila campo" for="base-valor">
          <span class="campo-etiqueta">Dejé de base</span>
          <app-campo-moneda idCampo="base-valor" [(valor)]="valor" />
        </label>
      </div>
      <p class="nota-formulario">Va aparte: no suma a la caja ni a los cierres.</p>

      @if (error()) {
        <div class="aviso-error" role="alert">{{ error() }}</div>
      }
    </form>
  `,
})
export class AjusteBase implements OnInit {
  private readonly servicio = inject(CierresService);

  readonly base = input.required<number>();
  readonly guardado = output<number>();
  readonly cerrar = output<void>();

  protected readonly valor = signal<number | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly cambio = computed(() => (this.valor() ?? 0) !== this.base());

  ngOnInit(): void {
    this.valor.set(this.base());
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.cambio() || this.guardando()) return;

    const valor = this.valor() ?? 0;
    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.servicio.guardarBase(valor);
      this.guardado.emit(valor);
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }
}
