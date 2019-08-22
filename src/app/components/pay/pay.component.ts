import { Component, OnInit } from '@angular/core';
import { NavParams, ModalController } from '@ionic/angular';
import { DataService } from 'src/app/services/data.service';
import { PagarService } from 'src/app/services/pagar.service';
import { FireService } from 'src/app/services/fire.service';

@Component({
  selector: 'app-pay',
  templateUrl: './pay.component.html',
  styleUrls: ['./pay.component.scss'],
})

export class PayComponent implements OnInit {

  mPago = 'Tarjeta';
  usuario: any;
  rider: any;
  monto: number;
  pedido: any;

  constructor(
    public modalCtrl: ModalController,
    private navParams: NavParams,
    private _data: DataService,
    private _pagar: PagarService,
    private _fire: FireService
  ) {
    this.usuario = navParams.get('pago').usuario;
    this.rider = navParams.get('pago').rider;
    this.monto = navParams.get('pago').monto;
    this.pedido = navParams.get('pago').pedido;
    console.log(this.pedido)
  }

  ngOnInit() { }

  togglePay(tipo) {
    this.mPago = tipo;
  }

  closeModal() {
    this.modalCtrl.dismiss({ pagoExitoso: false });
  }

  pagar() {

    const dataFLOW = {
      monto: this.monto,
      email: this.usuario.email
    }

    const pedido = {
      precio: this.monto,
      metodoPago: this.mPago,
      distancia: this.pedido.distancia,
      origen: this.pedido.origen,
      destino: this.pedido.destino,
      rider: this.rider._id,
      cliente: this.usuario._id,
      entregado: false
    };

    if (this.mPago == 'Tarjeta' && this.usuario.rol != 'empresa') {
      this._pagar.pagarConFlow(this.usuario._id, dataFLOW).then(pagoExitoso => {
        if (pagoExitoso) {
          this._data.crearPedido(pedido).then((pedido: any) => {

            this._fire.updateRider(this.rider._id, 'rider', {
              pagoPendiente: false,
              actividad: 'ocupado',
              pedido: pedido._id
            });

            this._fire.updateRider(this.rider._id, 'coors', {
              actividad: 'ocupado',
              pedido: pedido._id,
              cliente: this.usuario._id
            });

            this.modalCtrl.dismiss({ pagoExitoso });

          });
        } else {
          this.modalCtrl.dismiss({ pagoExitoso });
        }
      });

    }


    if (this.mPago == 'Tarjeta' && this.usuario.rol == 'empresa') {
      this._data.crearPedido(pedido).then((pedido: any) => {

        this._fire.updateRider(this.rider._id, 'rider', {
          pagoPendiente: false,
          actividad: 'ocupado',
          pedido: pedido._id
        });

        this._fire.updateRider(this.rider._id, 'coors', {
          actividad: 'ocupado',
          pedido: pedido._id,
          cliente: this.usuario._id
        });

        this.modalCtrl.dismiss({ pagoExitoso: true });
      });

    }

    if (this.mPago == 'Efectivo') {

      this._data.crearPedido(pedido).then((pedido: any) => {

        this._fire.updateRider(this.rider._id, 'rider', {
          pagoPendiente: false,
          actividad: 'ocupado',
          pedido: pedido._id
        });

        this._fire.updateRider(this.rider._id, 'coors', {
          actividad: 'ocupado',
          pedido: pedido._id,
          cliente: this.usuario._id
        });

        this.modalCtrl.dismiss({ pagoExitoso: true });
      });

    }
  }

}
