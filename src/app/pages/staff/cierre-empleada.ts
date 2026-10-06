import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { Contador } from '../../components/stepper/contador';
import { CierreDia, Pedido, VasosDelDia } from '../../models/modelos';
import { MonedaPipe } from '../../pipes/moneda';
import { CierresService } from '../../services/cierres';
import { mensajeDeError } from '../../services/supabase';
import { VasosService } from '../../services/vasos';
import { fechaIso } from '../../utils/fechas';

@Component({
  selector: 'app-cierre-empleada',
  imports: [CampoMoneda, Contador, MonedaPipe],
  templateUrl: './cierre-empleada.html',
})
export class CierreEmpleada implements OnInit {
  private readonly vasosServicio = inject(VasosService);
  private readonly cierres = inject(CierresService);

  readonly pedidos = input.required<Pedido[]>();
  readonly cierre = input<CierreDia | null>(null);
  readonly enviado = output<void>();
  readonly cancelar = output<void>();

  protected readonly vasos = signal<VasosDelDia[]>([]);
  protected readonly sobrantes = signal<Record<string, number>>({});
  protected readonly efectivoContado = signal<number | null>(null);
  protected readonly nota = signal('');
  protected readonly cargando = signal(true);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly registradosPorNombre = computed(() => {
    const mapa = new Map<string, number>();
    for (const pedido of this.pedidos()) {
      for (const item of pedido.items) mapa.set(item.nombre, (mapa.get(item.nombre) ?? 0) + item.cantidad);
    }
    return mapa;
  });

  protected readonly filas = computed(() =>
    this.vasos()
      .map((v) => {
        const tenia = v.arrastre + v.cantidad;
        const sobran = this.sobrantes()[v.productoId] ?? 0;
        const registrados = this.registradosPorNombre().get(v.nombre) ?? 0;
        const porConteo = tenia - sobran;
        return { ...v, tenia, sobran, registrados, porConteo, diferencia: porConteo - registrados };
      })
      .filter((f) => f.tenia > 0 || f.registrados > 0),
  );

  protected readonly totalRegistrado = computed(() =>
    this.pedidos().reduce((t, p) => t + p.total, 0),
  );
  protected readonly efectivoRegistrado = computed(() =>
    this.pedidos()
      .filter((p) => p.metodoPago === 'Efectivo')
      .reduce((t, p) => t + p.total, 0),
  );
  protected readonly nequiRegistrado = computed(() => this.totalRegistrado() - this.efectivoRegistrado());
  protected readonly diferenciaEfectivo = computed(() => {
    const contado = this.efectivoContado();
    return contado === null ? null : contado - this.efectivoRegistrado();
  });
  protected readonly hayErrores = computed(() => this.filas().some((f) => f.sobran > f.tenia));

  ngOnInit(): void {
    const cierre = this.cierre();
    this.efectivoContado.set(cierre?.efectivoContado ?? null);
    this.nota.set(cierre?.nota ?? '');
    this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const vasos = await this.vasosServicio.delDia(fechaIso());
      this.vasos.set(vasos);
      const registrados = this.registradosPorNombre();
      this.sobrantes.set(
        Object.fromEntries(
          vasos.map((v) => [
            v.productoId,
            v.sobrantes ?? Math.max(v.arrastre + v.cantidad - (registrados.get(v.nombre) ?? 0), 0),
          ]),
        ),
      );
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected fijarSobrantes(productoId: string, cantidad: number): void {
    this.sobrantes.update((actual) => ({ ...actual, [productoId]: Math.round(cantidad) }));
  }

  protected async enviar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.hayErrores() || this.enviando()) return;

    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.cierres.cerrarDiaEmpleada(this.sobrantes(), this.efectivoContado(), this.nota());
      this.enviado.emit();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.enviando.set(false);
    }
  }
}
