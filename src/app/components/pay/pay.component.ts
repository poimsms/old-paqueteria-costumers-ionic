import { Component, OnInit } from '@angular/core';
import { NavParams, ModalController } from '@ionic/angular';
import { DataService } from 'src/app/services/data.service';
import { PagarService } from 'src/app/services/pagar.service';
import { FireService } from 'src/app/services/fire.service';
import { ControlService } from 'src/app/services/control.service';

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
    private _fire: FireService,
    private _control: ControlService
  ) {
    this.usuario = navParams.get('pago').usuario;
    this.rider = navParams.get('pago').rider;
    this.monto = navParams.get('pago').monto;
    this.pedido = navParams.get('pago').pedido;
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
      costo: this.monto,
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

            this.updateRiderEstadoOcupado(pedido._id);
            this.modalCtrl.dismiss({ pagoExitoso: true });
          });
        } else {
          this.modalCtrl.dismiss({ pagoExitoso: false });
        }
      });
    }


    if (this.mPago == 'Tarjeta' && this.usuario.rol == 'empresa') {
      this._data.crearPedido(pedido).then((pedido: any) => {

        this.updateRiderEstadoOcupado(pedido._id);
        this.modalCtrl.dismiss({ pagoExitoso: true });
      });
    }

    if (this.mPago == 'Efectivo') {

      this._data.crearPedido(pedido).then((pedido: any) => {

        this.updateRiderEstadoOcupado(pedido._id);
        this.modalCtrl.dismiss({ pagoExitoso: true });
      });
    }
  }


  updateRiderEstadoOcupado(pedidoId) {

    this._control.estaBuscandoRider = false;

    this._fire.updateRider(this.rider._id, 'rider', {
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

}
