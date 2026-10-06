import { Component, computed, inject, signal } from '@angular/core';
import { Contador } from '../../components/stepper/contador';
import { Encabezado } from '../../components/page-header/encabezado';
import { MetodoPago, Pedido, ProductoVenta } from '../../models/modelos';
import { MonedaPipe } from '../../pipes/moneda';
import { PedidosService } from '../../services/pedidos';
import { mensajeDeError } from '../../services/supabase';
import { fechaDeHoy } from '../../utils/fechas';

@Component({
  selector: 'app-vender',
  imports: [Encabezado, Contador, MonedaPipe],
  templateUrl: './vender.html',
  styleUrl: './vender.css',
})
export class Vender {
  private readonly servicio = inject(PedidosService);

  protected readonly hoy = fechaDeHoy();
  protected readonly metodos: MetodoPago[] = ['Efectivo', 'Nequi'];

  protected readonly productos = signal<ProductoVenta[]>([]);
  protected readonly cantidades = signal<Record<string, number>>({});
  protected readonly metodo = signal<MetodoPago>('Efectivo');
  protected readonly pedidosHoy = signal<Pedido[]>([]);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);

  protected readonly totalVenta = computed(() =>
    this.productos().reduce((t, p) => t + this.cantidad(p.id) * p.precioVenta, 0),
  );
  protected readonly vasosVenta = computed(() =>
    Object.values(this.cantidades()).reduce((t, n) => t + n, 0),
  );
  protected readonly totalHoy = computed(() =>
    this.pedidosHoy().reduce((t, p) => t + p.total, 0),
  );

  private temporizador?: ReturnType<typeof setTimeout>;

  constructor() {
    this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const [productos, pedidos] = await Promise.all([
        this.servicio.productos(),
        this.servicio.deHoy(),
      ]);
      this.productos.set(productos);
      this.pedidosHoy.set(pedidos);
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected cantidad(id: string): number {
    return this.cantidades()[id] ?? 0;
  }

  protected fijar(id: string, cantidad: number): void {
    this.cantidades.update((actual) => ({ ...actual, [id]: Math.max(0, Math.round(cantidad)) }));
  }

  protected sumar(id: string): void {
    this.fijar(id, this.cantidad(id) + 1);
    this.exito.set(null);
  }

  protected limpiar(): void {
    this.cantidades.set({});
  }

  protected async registrar(): Promise<void> {
    if (!this.totalVenta() || this.guardando()) return;

    const total = this.totalVenta();
    this.guardando.set(true);
    this.error.set(null);
    try {
      await this.servicio.registrar(this.metodo(), this.cantidades());
      this.cantidades.set({});
      this.metodo.set('Efectivo');
      this.mostrarExito(`Venta registrada · ${new MonedaPipe().transform(total)}`);
    } catch (error) {
      this.error.set(mensajeDeError(error));
      return;
    } finally {
      this.guardando.set(false);
    }
    this.servicio
      .deHoy()
      .then((pedidos) => this.pedidosHoy.set(pedidos))
      .catch(() => undefined);
  }

  private mostrarExito(texto: string): void {
    clearTimeout(this.temporizador);
    this.exito.set(texto);
    this.temporizador = setTimeout(() => this.exito.set(null), 3000);
  }
}
