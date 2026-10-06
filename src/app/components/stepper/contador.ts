import { Component, input, model } from '@angular/core';

/** Contador estilo iOS: [ − ] 12 [ + ]. Permite escribir el número (acepta decimales). */
@Component({
  selector: 'app-contador',
  template: `
    <button type="button" aria-label="Restar" [disabled]="valor() <= minimo()" (click)="cambiar(-paso())">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>
    </button>
    <input
      type="text"
      inputmode="decimal"
      autocomplete="off"
      [id]="idCampo()"
      [attr.aria-label]="etiqueta()"
      [value]="valor()"
      (change)="alEscribir($event)"
    />
    <button type="button" aria-label="Sumar" (click)="cambiar(paso())">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12" /></svg>
    </button>
  `,
  styles: `
    :host {
      flex: none;
      display: inline-flex;
      align-items: center;
      height: 32px;
      border-radius: 9px;
      background: rgba(118, 118, 128, 0.12);
    }
    button {
      width: 40px;
      height: 100%;
      display: grid;
      place-items: center;
      color: var(--texto);
    }
    button:disabled {
      color: var(--texto-terciario);
      cursor: default;
    }
    button:not(:disabled):active {
      background: rgba(118, 118, 128, 0.2);
    }
    svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.4;
      stroke-linecap: round;
    }
    input {
      width: 56px;
      height: 100%;
      border: none;
      outline: none;
      background: transparent;
      text-align: center;
      font-size: 16px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      border-left: 0.5px solid var(--separador);
      border-right: 0.5px solid var(--separador);
    }
  `,
})
export class Contador {
  readonly valor = model(0);
  readonly paso = input(1);
  readonly minimo = input(0);
  readonly idCampo = input<string>();
  readonly etiqueta = input('Cantidad');

  protected cambiar(diferencia: number): void {
    this.fijar(this.valor() + diferencia);
  }

  protected alEscribir(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const numero = Number(campo.value.replace(',', '.'));
    this.fijar(Number.isFinite(numero) ? numero : this.valor());
    campo.value = String(this.valor());
  }

  private fijar(numero: number): void {
    // Redondea a 2 decimales para evitar cosas como 0.30000000000000004.
    this.valor.set(Math.max(this.minimo(), Math.round(numero * 100) / 100));
  }
}
