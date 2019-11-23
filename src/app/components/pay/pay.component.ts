import { Component, OnInit } from '@angular/core';
import { NavParams, ModalController, PopoverController, ToastController, AlertController } from '@ionic/angular';
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
  precio_descuento = 0;
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
    public toastController: ToastController,
    public alertController: AlertController
  ) {
    this.usuario = navParams.get('pago').usuario;
    this.rider = navParams.get('pago').rider;
    this.monto = navParams.get('pago').monto;
    this.pedido = navParams.get('pago').pedido;
    this.tiempo_entrega = navParams.get('tiempo');
    this.cuponData = navParams.get('cuponData');
    // this.telefono_origen = this._auth.usuario.telefono;

    this.cuponHandler();
    // this.checkoutTime();
  }

  ngOnInit() { 
    setTimeout(() => {
      this.telefono_origen = this._auth.usuario.telefono;
      this.telefono_destino = null;
    }, 200);
  }

  cuponHandler() {
    if (this.cuponData.ok) {
      if (this.cuponData.cupon.tipo == 'PORCENTAJE') {
        const delta = Math.round((this.monto - this.monto * this.cuponData.cupon.descuento / 100) / 10) * 10;
        this.precio_descuento = delta;
      }

      if (this.cuponData.cupon.tipo == 'DINERO') {
        const delta = this.monto - this.cuponData.cupon.descuento;
        delta < 0 ? this.precio_descuento = 0 : this.precio_descuento = delta;
      }
    }
  }

  checkoutTime() {

    const body = {
      cliente: this._auth.usuario._id,
      rider: this.rider._id
    };

    this.isLoading = true;

    this._data.creteCheckoutTime(body)
      .then(() => this.isLoading = false)
      .catch(() => this.isLoading = false);
  }

  async confirmar_envio() {

    const flow = {
      monto: this.monto,
      email: this.usuario.email,
      usuario: this.usuario._id
    };

    const pedido = {
      costo: this.monto,
      costo_real: this.monto,
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

    this.isLoading = true;

    // const checkout_time: any = await this._data.getCheckoutTime(this._auth.usuario._id);

    // if (!checkout_time.ok) {
    //   this.isLoading = false;
    //   return this.alert_tiempo_expirado();
    // }

    if (this.metodo_pago == 'Tarjeta') {

      if (this.precio_descuento <= 350) {
        return this.alert_monto_minimo();
      }

      this._pagar.pagarConFlow(flow).then(pagoExitoso => {

        this.isLoading = false;

        if (pagoExitoso) {
          this._data.crearPedido(pedido).then((pedido: any) => {
            this.save(pedido);
          });
        } else {
          this.modalCtrl.dismiss({ pagoExitoso: false });
        }
      });
    }

    if (this.metodo_pago == 'Efectivo') {

      this._data.crearPedido(pedido).then((pedido: any) => {
        this.save(pedido);
      });
    }
  }

  save(pedido) {

    this.updateRiderEstadoOcupado(pedido._id);

    if (this.cuponData.ok) {

      this.isLoading = true;

      this._data.useCupon(this.cuponData.id).then(() => {
        this._data.getCuponActivo(this.usuario._id);
        this.isLoading = false;
        this.modalCtrl.dismiss({ pagoExitoso: true, riderID: this.rider._id });
      });

    } else {
      this.modalCtrl.dismiss({ pagoExitoso: true, riderID: this.rider._id });
    }
  }

  close() {
    this.updateRiderEstadoDisponible();
    this.modalCtrl.dismiss({ pagoExitoso: false });
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

  updateRiderEstadoDisponible() {
    this._fire.updateRider(this.rider._id, 'rider', {
      fase: '',
      pagoPendiente: false,
      aceptadoId: '',
      cliente_activo: ''
    });
    this._fire.updateRider(this.rider._id, 'coors', {
      pagoPendiente: false
    });
  }

  async openMetodoPago() {

    const modal = await this.modalCtrl.create({
      component: OpcionesComponent,
      componentProps: { metodo: this.metodo_pago }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data.ok) {
      this.metodo_pago = data.seleccion;
    }
  }

  async toast_cambio_a_efectivo() {
    const toast = await this.toastController.create({
      message: 'Se ha cambiado tu metodo de pago',
      duration: 2500,
      position: 'middle'
    });
    toast.present();
  }

  async alert_monto_minimo() {
    const alert = await this.alertController.create({
      header: 'Monto inválido',
      message: 'Recuerda que el monto mínimo a pagar con TARJETA son $350 CLP.',
      buttons: [
        {
          text: 'Ok',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            // this.metodo_pago = 'Efectivo';
          }
        }
      ]
    });

    await alert.present();
  }

  async alert_tiempo_expirado() {
    const alert = await this.alertController.create({
      header: 'Tiempo expirado',
      message: 'Por favor, crea un nuevo pedido.',
      buttons: [
        {
          text: 'Ok',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            this.modalCtrl.dismiss({ pagoExitoso: false });
          }
        }
      ]
    });

    await alert.present();
  }

}
