import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { Cargando } from '../../components/loading/cargando';
import { Contador } from '../../components/stepper/contador';
import { CierreDia, VasosDelDia } from '../../models/modelos';
import { MonedaPipe } from '../../pipes/moneda';
import { CierresService } from '../../services/cierres';
import { mensajeDeError } from '../../services/supabase';
import { VasosService } from '../../services/vasos';
import { fechaIso } from '../../utils/fechas';

@Component({
  selector: 'app-cierre-empleada',
  imports: [Cargando, CampoMoneda, Contador, MonedaPipe],
  templateUrl: './cierre-empleada.html',
})
export class CierreEmpleada implements OnInit {
  private readonly vasosServicio = inject(VasosService);
  private readonly cierres = inject(CierresService);

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

  protected readonly filas = computed(() =>
    this.vasos()
      .map((v) => {
        const tenia = v.arrastre + v.cantidad;
        const sobran = this.sobrantes()[v.productoId] ?? 0;
        const vendidos = Math.max(tenia - sobran, 0);
        return { ...v, tenia, sobran, vendidos, total: vendidos * v.precioVenta };
      })
      .filter((f) => f.tenia > 0),
  );

  protected readonly vasosVendidos = computed(() => this.filas().reduce((t, f) => t + f.vendidos, 0));
  protected readonly debeHaber = computed(() => this.filas().reduce((t, f) => t + f.total, 0));
  protected readonly diferenciaEfectivo = computed(() => {
    const contado = this.efectivoContado();
    return contado === null ? null : contado - this.debeHaber();
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
      this.sobrantes.set(Object.fromEntries(vasos.map((v) => [v.productoId, v.sobrantes ?? 0])));
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
