import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { Contador } from '../../components/stepper/contador';
import { VasosDelDia } from '../../models/modelos';
import { mensajeDeError } from '../../services/supabase';
import { VasosService } from '../../services/vasos';
import { fechaIso } from '../../utils/fechas';

@Component({
  selector: 'app-ajuste-vasos',
  imports: [Contador],
  template: `
    <form (submit)="guardar($event)" novalidate>
      <header class="hoja-barra">
        <button type="button" class="boton-texto" (click)="cerrar.emit()">Cancelar</button>
        <h2>{{ vasos().nombre }}</h2>
        <button type="submit" class="boton-texto" [disabled]="!cambio() || guardando()">
          {{ guardando() ? 'Guardando…' : 'Guardar' }}
        </button>
      </header>

      <div class="lista">
        <div class="fila">
          <label class="fila-cuerpo" for="vasos-cantidad">Vasos agregados hoy</label>
          <app-contador idCampo="vasos-cantidad" etiqueta="Vasos agregados hoy" [(valor)]="cantidad" />
        </div>
      </div>

      @if (vasos().unidadesPaquete; as paquete) {
        <div style="display: flex; gap: 8px; margin-top: 12px">
          <button type="button" class="boton boton-bloque" style="background: var(--azul-suave); color: var(--azul-fuerte)" [disabled]="cantidad() < paquete" (click)="sumarPaquetes(-1)">
            − 1 paquete
          </button>
          <button type="button" class="boton boton-bloque boton-azul" (click)="sumarPaquetes(1)">
            + 1 paquete ({{ paquete }})
          </button>
        </div>
        <p class="nota-formulario">
          {{ paquetes() }}
          @if (vasos().paquetesEnInventario !== null) {
            <br />
            Inventario: quedan {{ vasos().paquetesEnInventario }} paquetes
            @if (cambio()) {
              → quedarán {{ inventarioDespues() }}
            }
          }
        </p>
      }

      @if (error()) {
        <div class="aviso-error" role="alert">{{ error() }}</div>
      }
    </form>
  `,
})
export class AjusteVasos implements OnInit {
  private readonly servicio = inject(VasosService);

  readonly vasos = input.required<VasosDelDia>();
  readonly guardado = output<void>();
  readonly cerrar = output<void>();

  protected readonly cantidad = signal(0);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly cambio = computed(() => this.cantidad() !== this.vasos().cantidad);
  protected readonly inventarioDespues = computed(() => {
    const { paquetesEnInventario, unidadesPaquete, cantidad } = this.vasos();
    if (paquetesEnInventario === null || !unidadesPaquete) return null;
    const diferencia = (this.cantidad() - cantidad) / unidadesPaquete;
    return Math.round((paquetesEnInventario - diferencia) * 100) / 100;
  });

  protected readonly paquetes = computed(() => {
    const porPaquete = this.vasos().unidadesPaquete ?? 0;
    if (!porPaquete) return '';
    const completos = Math.floor(this.cantidad() / porPaquete);
    const sueltos = this.cantidad() % porPaquete;
    const texto = `${completos} ${completos === 1 ? 'paquete' : 'paquetes'} de ${porPaquete}`;
    return sueltos ? `${texto} + ${sueltos} sueltos` : texto;
  });

  ngOnInit(): void {
    this.cantidad.set(this.vasos().cantidad);
  }

  protected sumarPaquetes(paquetes: number): void {
    const porPaquete = this.vasos().unidadesPaquete ?? 0;
    this.cantidad.update((actual) => Math.max(0, actual + paquetes * porPaquete));
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.cambio() || this.guardando()) return;

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.servicio.fijar(this.vasos().productoId, this.cantidad(), fechaIso());
      this.guardado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }
}
