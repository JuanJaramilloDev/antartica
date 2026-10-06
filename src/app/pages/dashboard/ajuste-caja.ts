import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CampoMoneda } from '../../components/money-input/campo-moneda';
import { MovimientoCaja, TipoMovimiento } from '../../models/modelos';
import { FechaCortaPipe } from '../../pipes/fecha-corta';
import { MonedaPipe } from '../../pipes/moneda';
import { CajaService } from '../../services/caja';
import { mensajeDeError } from '../../services/supabase';

type Modo = 'agregar' | 'retirar' | 'contar';

const NOMBRES_TIPO: Record<TipoMovimiento, string> = {
  saldo_inicial: 'Saldo inicial',
  venta: 'Venta',
  gasto: 'Gasto',
  prestamo: 'Préstamo',
  abono: 'Abono',
  ajuste: 'Ajuste',
  ingreso: 'Otro ingreso',
};

@Component({
  selector: 'app-ajuste-caja',
  imports: [CampoMoneda, MonedaPipe, FechaCortaPipe],
  templateUrl: './ajuste-caja.html',
})
export class AjusteCaja implements OnInit {
  private readonly caja = inject(CajaService);

  readonly saldo = input.required<number>();
  readonly ajustado = output<void>();
  readonly cerrar = output<void>();

  protected readonly nombresTipo = NOMBRES_TIPO;
  protected readonly modos: { valor: Modo; etiqueta: string }[] = [
    { valor: 'agregar', etiqueta: 'Agregar' },
    { valor: 'retirar', etiqueta: 'Retirar' },
    { valor: 'contar', etiqueta: 'Contar caja' },
  ];
  protected readonly modo = signal<Modo>('agregar');
  protected readonly monto = signal<number | null>(null);
  protected readonly nota = signal('');

  protected readonly movimientos = signal<MovimientoCaja[]>([]);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly diferencia = computed(() => {
    const monto = this.monto();
    if (monto === null) return 0;
    switch (this.modo()) {
      case 'agregar':
        return monto;
      case 'retirar':
        return -monto;
      case 'contar':
        return monto - this.saldo();
    }
  });
  protected readonly nuevoSaldo = computed(() => this.saldo() + this.diferencia());
  protected readonly valido = computed(() => this.monto() !== null && this.diferencia() !== 0);

  ngOnInit(): void {
    this.cargarMovimientos();
  }

  private async cargarMovimientos(): Promise<void> {
    try {
      this.movimientos.set(await this.caja.movimientos());
    } catch (error) {
      this.error.set(mensajeDeError(error));
    }
  }

  protected cambiarModo(modo: Modo): void {
    this.modo.set(modo);
    this.monto.set(null);
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.valido() || this.guardando()) return;

    const descripcionBase =
      this.modo() === 'contar' ? 'Conteo de caja' : this.modo() === 'agregar' ? 'Dejé plata' : 'Saqué plata';
    const nota = this.nota().trim();

    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.caja.ajustar(this.diferencia(), nota ? `${descripcionBase} · ${nota}` : descripcionBase);
      this.monto.set(null);
      this.nota.set('');
      this.ajustado.emit();
      await this.cargarMovimientos();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.guardando.set(false);
    }
  }
}
