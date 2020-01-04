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
  pedido: any;
  isLoading = false;
  cuponData: any;

  precio: number;
  precio_promo: number;

  telefono_origen: string;
  telefono_destino: string;
  nombre_origen: string;
  nombre_destino: string;
  instrucciones = '';
  tiempo_entrega = '';

  checkout_id: string;

  isRecogida = false;
  isEntrega = true;

  tipos = [
    {
      tipo: 'foodtruck',
      isActive: false
    },
    {
      tipo: 'restaurante',
      isActive: false
    }
  ];

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
    this.usuario = navParams.get('data').usuario;
    this.rider = navParams.get('data').rider;
    this.precio = navParams.get('data').monto;
    this.precio_promo = navParams.get('data').monto_promo;
    this.pedido = navParams.get('data').pedido;
    this.tiempo_entrega = navParams.get('data').pedido.tiempo;
    console.log(this.tiempo_entrega,'tiempo_entrega')
    this.checkoutTime();
  }

  ngOnInit() {
    this.clearAutocomplete();
  }

  togglePunto(tipo) {
    this.isRecogida = false;
    this.isEntrega = false;

    setTimeout(() => {

      if (tipo == 'recogida') {
        this.isRecogida = true;
        this.isEntrega = false;
      }
      if (tipo == 'entrega') {
        this.isRecogida = false;
        this.isEntrega = true;
      }
    }, 250);
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
      monto: this.precio_promo,
      email: this.usuario.email,
      usuario: this.usuario._id
    };

    const pedido: any = {
      costo: this.precio_promo,
      costo_real: this.precio,
      metodo_de_pago: this._control.metodo_pago,
      distancia: this.pedido.distancia,
      origen: this.pedido.origen,
      destino: this.pedido.destino,
      rider: this.rider._id,
      cliente: this.usuario._id,
      telefono_origen: this.telefono_origen,
      telefono_destino: this.telefono_destino,
      nombre_origen: this.nombre_origen,
      nombre_destino: this.nombre_destino,
      instrucciones: this.instrucciones,
      tiempo_entrega: this.tiempo_entrega,
      from: 'APP'
    };

    if (this._auth.usuario.role == 'EMPRESA_ROLE') {

      pedido.envio_pagado = false;
      pedido.pagar_productos = true;
      pedido.cobrar_productos = true;

      if (this.precio_promo == 0) {
        pedido.envio_pagado = true;
      }

    }

    pedido.checkout = this.checkout_id;

    this.isLoading = true;

    const checkout: any = await this._data.getCheckout(this.checkout_id);

    if (!checkout.ok) {
      this.isLoading = false;
      return this.alert_tiempo_expirado();
    }

    if (this._control.metodo_pago == 'Tarjeta') {

      if (this.precio_promo <= 350) {
        this.isLoading = false;
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

    if (this._control.metodo_pago == 'Efectivo') {

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
      this.nombre_origen = this._auth.usuario.nombre;
      this.telefono_origen = this._auth.usuario.telefono;

      this.nombre_destino = null;
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

  tipoToggle(i) {

    if (i == 0) {
      this.tipos[0].isActive = !this.tipos[0].isActive;
      this.tipos[1].isActive = false;
    }

    if (i == 1) {
      this.tipos[1].isActive = !this.tipos[1].isActive;
      this.tipos[0].isActive = false;
    }
  }



}
