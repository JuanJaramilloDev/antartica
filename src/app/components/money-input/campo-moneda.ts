import { Component, computed, input, model } from '@angular/core';

const formato = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

/** Campo de dinero en pesos: muestra "$ 7.000" mientras se escribe y guarda el número 7000. */
@Component({
  selector: 'app-campo-moneda',
  template: `
    <input
      type="text"
      inputmode="numeric"
      autocomplete="off"
      [id]="idCampo()"
      [placeholder]="placeholder()"
      [value]="texto()"
      (input)="alEscribir($event)"
    />
  `,
  styles: `
    :host {
      flex: 1;
      display: flex;
      min-width: 0;
      font-variant-numeric: tabular-nums;
    }
    input {
      width: 100%;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      text-align: right;
      font-size: 16px;
    }
  `,
})
export class CampoMoneda {
  readonly valor = model<number | null>(null);
  readonly idCampo = input<string>();
  readonly placeholder = input('$ 0');

  protected readonly texto = computed(() => {
    const valor = this.valor();
    return valor === null ? '' : `$ ${formato.format(valor)}`;
  });

  protected alEscribir(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const digitos = campo.value.replace(/\D/g, '').slice(0, 12);
    const numero = digitos ? Number(digitos) : null;
    this.valor.set(numero);
    // Reescribe el texto aunque el número no cambie (ej: si escribieron una letra).
    campo.value = numero === null ? '' : `$ ${formato.format(numero)}`;
  }
}
