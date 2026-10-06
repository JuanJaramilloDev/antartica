import { Component, input, output } from '@angular/core';

/**
 * Hoja modal estilo iOS: sube desde abajo en el celular y se centra en PC.
 * El contenido (normalmente un formulario) se proyecta adentro.
 */
@Component({
  selector: 'app-hoja',
  host: { '(document:keydown.escape)': 'abierta() && cerrar.emit()' },
  template: `
    @if (abierta()) {
      <div class="fondo" (click)="cerrar.emit()"></div>
      <section class="hoja" role="dialog" aria-modal="true" [attr.aria-label]="etiqueta()">
        <div class="agarre" aria-hidden="true"></div>
        <ng-content />
      </section>
    }
  `,
  styles: `
    .fondo {
      position: fixed;
      inset: 0;
      z-index: 90;
      background: rgba(0, 0, 0, 0.35);
      animation: aparecer 0.25s ease-out;
    }
    .hoja {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 91;
      max-height: 92dvh;
      overflow-y: auto;
      background: var(--fondo);
      border-radius: 14px 14px 0 0;
      padding: 0 16px calc(var(--seguro-abajo) + 24px);
      animation: subir 0.32s cubic-bezier(0.32, 0.72, 0, 1);
    }
    .agarre {
      width: 36px;
      height: 5px;
      margin: 6px auto 0;
      border-radius: 3px;
      background: rgba(60, 60, 67, 0.3);
    }
    @media (min-width: 768px) {
      .hoja {
        left: 50%;
        right: auto;
        bottom: auto;
        top: 50%;
        width: 440px;
        transform: translate(-50%, -50%);
        border-radius: var(--radio-lg);
        padding-bottom: 24px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
        animation: aparecer 0.2s ease-out;
      }
      .agarre {
        display: none;
      }
    }
    @keyframes aparecer {
      from {
        opacity: 0;
      }
    }
    @keyframes subir {
      from {
        transform: translateY(100%);
      }
    }
  `,
})
export class Hoja {
  readonly abierta = input(false);
  readonly etiqueta = input('');
  readonly cerrar = output<void>();
}
