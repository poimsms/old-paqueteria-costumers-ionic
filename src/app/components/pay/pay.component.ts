import { Component, OnInit } from '@angular/core';
import { NavParams, ModalController, PopoverController, ToastController } from '@ionic/angular';
import { DataService } from 'src/app/services/data.service';
import { PagarService } from 'src/app/services/pagar.service';
import { FireService } from 'src/app/services/fire.service';
import { ControlService } from 'src/app/services/control.service';
import { AuthService } from 'src/app/services/auth.service';
import { OtrosService } from 'src/app/services/otros.service';
import { OpcionesComponent } from '../opciones/opciones.component';

@Component({
  selector: 'app-pay',
  templateUrl: './pay.component.html',
  styleUrls: ['./pay.component.scss'],
})

export class PayComponent implements OnInit {

  usuario: any;
  rider: any;
  monto: number;
  pedido: any;
  isLoading = false;
  cuponData: any;
  precio_descuento: number;
  seleccion: any = { programado: false };

  index_horario = 0;
  index_metodo_pago = 0;
  horario_value = 'Lo antes posible';
  fecha_recogida = '';
  metodo_pago = 'Efectivo';
  telefono_origen: string;
  telefono_destino: string;
  instrucciones = '';
  tiempo_entrega = '';

  constructor(
    public modalCtrl: ModalController,
    private navParams: NavParams,
    private _data: DataService,
    private _pagar: PagarService,
    private _fire: FireService,
    private _control: ControlService,
    private _auth: AuthService,
    public popoverController: PopoverController,
    private _otros: OtrosService,
    public toastController: ToastController
  ) {
    this.usuario = navParams.get('pago').usuario;
    this.rider = navParams.get('pago').rider;
    this.monto = navParams.get('pago').monto;
    this.pedido = navParams.get('pago').pedido;
    this.tiempo_entrega = navParams.get('tiempo');
    this.cuponData = navParams.get('cuponData');
    this.telefono_origen = this._auth.usuario.telefono;

    if (this.cuponData.ok && this.cuponData.cupon.tipo == 'porcentaje') {
      this.cuponPorcentaje();
    }

    if (this.cuponData.ok && this.cuponData.cupon.tipo == 'dinero') {
      this.cuponDinero();
    }

    // if (this.cuponData.ok) {
    //   this.precio_descuento = Math.round((this.monto - this.monto * this.cuponData.cupon.descuento / 100) / 10) * 10;
    // }
  }

  ngOnInit() { }

  cuponPorcentaje() {
    const delta = Math.round((this.monto - this.monto * this.cuponData.cupon.descuento / 100) / 10) * 10;
    if (delta <= 0) {
      this.precio_descuento = 0;
    } else {
      this.precio_descuento = delta;
    }
  }

  cuponDinero() {
    const delta = this.monto - this.cuponData.cupon.descuento;
    if (delta <= 0) {
      this.precio_descuento = 0;
    } else {
      this.precio_descuento = delta;
    }
  }

  confirmar_envio() {

    if (this.telefono_origen == '' || this.telefono_destino == '') {
      return this.presentToast();
    }

    const flow = {
      monto: this.monto,
      email: this.usuario.email,
      usuario: this.usuario._id
    };

    const pedido = {
      costo: this.monto,
      metodo_de_pago: this.metodo_pago,
      distancia: this.pedido.distancia,
      origen: this.pedido.origen,
      destino: this.pedido.destino,
      rider: this.rider._id,
      cliente: this.usuario._id,
      telefono_origen: this.telefono_origen,
      telefono_destino: this.telefono_destino,
      instrucciones: this.instrucciones
    };

    if (this.cuponData.ok) {
      flow.monto = this.precio_descuento;
      pedido.costo = this.precio_descuento;
    }

    if (this.metodo_pago == 'Tarjeta') {

      this.isLoading = true;

      this._pagar.pagarConFlow(flow).then(pagoExitoso => {

        this.isLoading = false;

        if (pagoExitoso) {
          this._data.crearPedido(pedido).then((pedido: any) => {
            this.closeModal('pago_efectuado', pedido);
          });
        } else {
          this.modalCtrl.dismiss({ pagoExitoso: false });
        }
      });
    }

    if (this.metodo_pago == 'Efectivo') {

      this._data.crearPedido(pedido).then((pedido: any) => {
        this.closeModal('pago_efectuado', pedido);
      });
    }
  }

  closeModal(tipo, pedido?) {

    if (tipo == 'pago_no_efectuado') {
      return this.modalCtrl.dismiss({ pagoExitoso: false });
    }

    if (pedido) {
      this.updateRiderEstadoOcupado(pedido._id);
    }

    if (this.cuponData.ok) {

      this.isLoading = true;

      this._data.useCupon(this.cuponData.id).then(() => {
        this.isLoading = false;
        this.modalCtrl.dismiss({ pagoExitoso: true, riderID: this.rider._id });
      });

    } else {
      this.modalCtrl.dismiss({ pagoExitoso: true, riderID: this.rider._id });
    }
  }

  updateRiderEstadoOcupado(pedidoId) {

    this._control.estaBuscandoRider = false;

    this._fire.updateRider(this.rider._id, 'rider', {
      fase: 'navegando_al_origen',
      pagoPendiente: false,
      actividad: 'ocupado',
      pedido: pedidoId,
      aceptadoId: ''
    });

    this._fire.updateRider(this.rider._id, 'coors', {
      pagoPendiente: false,
      actividad: 'ocupado',
      pedido: pedidoId,
      cliente: this.usuario._id
    });
  }


  async openMetodoPago() {

    const modal = await this.modalCtrl.create({
      component: OpcionesComponent,
      componentProps: { metodo: this.metodo_pago }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {
      this.metodo_pago = data.seleccion;
    }
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'Por favor complete todos los campos',
      duration: 2500,
      position: 'middle'
    });
    toast.present();
  }


}
