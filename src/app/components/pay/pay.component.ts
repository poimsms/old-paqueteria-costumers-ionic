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

  checkout_id: string;

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
    this.checkoutTime();
  }

  ngOnInit() {
    this.codigoSubcription();
    this.clearAutocomplete();
  }

  checkoutTime() {
    const body = {
      cliente: this._auth.usuario._id,
      rider: this.rider._id
    };

    this.isLoading = true;

    this._data.creteCheckout(body)
      .then((data: any) => {
        this.checkout_id = data._id;
        this.isLoading = false;
      });
  }

  async confirmar_envio() {

    const flow = {
      monto: this.monto,
      email: this.usuario.email,
      usuario: this.usuario._id
    };

    const pedido: any = {
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
      instrucciones: this.instrucciones,
      tiempo_entrega: this.tiempo_entrega
    };

    pedido.checkout = this.checkout_id;

    if (this.cuponData.ok) {
      flow.monto = this.precio_descuento;
      pedido.costo = this.precio_descuento;
    }

    this.isLoading = true;

    const checkout: any = await this._data.getCheckout(this.checkout_id);

    if (!checkout.ok) {
      this.isLoading = false;
      return this.alert_tiempo_expirado();
    }

    if (this.metodo_pago == 'Tarjeta') {

      if (this.precio_descuento <= 350) {
        return this.alert_monto_minimo();
      }

      this._pagar.pagarConFlow(flow).then(pagoExitoso => {

        this._data.getCheckout(this.checkout_id).then((checkout: any) => {
        
          this.isLoading = false;

          if (!checkout.ok) {            
            return this.close();;
          }

          if (pagoExitoso) {
            this._data.crearPedido(pedido).then((pedido: any) => {
              this.save(pedido);
            });
          } else {
            this.close();
          }
        })


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
        this.modalCtrl.dismiss({ state: 'PAGO_EXITOSO', riderID: this.rider._id, tiempoExpirado: false });
      });

    } else {
      this.modalCtrl.dismiss({ state: 'PAGO_EXITOSO', riderID: this.rider._id, tiempoExpirado: false });
    }
  }

  close() {
    this.updateRiderEstadoDisponible();
    this._data.updateCheckout(this.checkout_id);
    this.modalCtrl.dismiss({ state: 'PAGO_NO_REALIZADO' });
  }

  updateRiderEstadoOcupado(pedidoId) {

    this._control.estaBuscandoRider = false;

    this._fire.updateRider(this.rider._id, 'rider', {
      fase: 'navegando_al_origen',
      pagoPendiente: false,
      actividad: 'ocupado',
      pedido: pedidoId,
      aceptadoId: '',
      evento: 1
    });

    this._fire.updateRider(this.rider._id, 'coors', {
      pagoPendiente: false,
      actividad: 'ocupado',
      pedido: pedidoId,
      cliente: this.usuario._id,
      evento: 1
    });
  }

  updateRiderEstadoDisponible() {
    this._fire.updateRider(this.rider._id, 'rider', {
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

  async codigo_promo() {
    const alert = await this.alertController.create({
      header: 'Código promo',
      subHeader: 'Ingresa acá tu Código Promo de Moviapp',
      inputs: [
        {
          name: 'codigo',
          type: 'text',
          placeholder: ''
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Ok',
          handler: (data) => {
            this.ingresar_codigo(data.codigo);
          }
        }
      ]
    });

    await alert.present();
  }

  codigoSubcription() {
    this._data.cuponData.subscribe(data => {
      this.cuponData = data;
      this.aplicar_codigo();
    });
  }

  ingresar_codigo(codigo) {
    const body = {
      usuario: this._auth.usuario._id,
      codigo: codigo.toLowerCase()
    };

    this.isLoading = true;

    this._data.addCupon(body).then((res: any) => {

      this.isLoading = false;

      if (!res.ok) {
        return this.toast(res.message);
      }

      this._data.getCuponActivo(this._auth.usuario._id);
    });
  }

  aplicar_codigo() {
    if (this.cuponData.ok) {

      if (this.cuponData.cupon.tipo == 'PORCENTAJE') {

        const delta = this.monto * this.cuponData.cupon.descuento / 100;

        if (delta > this.cuponData.cupon.tope) {
          const diff = this.monto - this.cuponData.cupon.tope;
          diff < 0 ? this.precio_descuento = 0 : this.precio_descuento = diff;
        } else {
          this.precio_descuento = Math.round((this.monto - this.monto * this.cuponData.cupon.descuento / 100) / 100) * 100;
        }
      }

      if (this.cuponData.cupon.tipo == 'DINERO') {
        const delta = this.monto - this.cuponData.cupon.descuento;
        delta < 0 ? this.precio_descuento = 0 : this.precio_descuento = delta;
      }
    }
  }

  async toast(message) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2500,
      position: 'middle'
    });
    toast.present();
  }

  clearAutocomplete() {
    setTimeout(() => {
      this.telefono_origen = this._auth.usuario.telefono;
      this.telefono_destino = null;
    }, 200);
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
          }
        }
      ]
    });

    await alert.present();
  }

  async alert_tiempo_expirado() {
    const alert = await this.alertController.create({
      header: 'Tiempo expirado',
      message: 'Se ha agotado el tiempo de confirmación. Por favor, solicita un nuevo rider.',
      buttons: [
        {
          text: 'Ok',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            this.modalCtrl.dismiss({ state: 'TIEMPO_EXPIRADO' });
          }
        }
      ]
    });

    await alert.present();
  }


}
