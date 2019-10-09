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

  metodoPago = 'Tarjeta';
  usuario: any;
  rider: any;
  monto: number;
  pedido: any;
  isLoading = false;

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
    this.metodoPago = tipo;
  }

  closeModal() {
    this.modalCtrl.dismiss({ pagoExitoso: false });
  }

  pagar() {

    const dataFLOW = {
      monto: this.monto,
      email: this.usuario.email,
      usuario: this.usuario._id
    }

    const pedido = {
      costo: this.monto,
      metodo_de_pago: this.metodoPago,
      distancia: this.pedido.distancia,
      origen: this.pedido.origen,
      destino: this.pedido.destino,
      rider: this.rider._id,
      cliente: this.usuario._id,
      entregado: false
    };

    if (this.metodoPago == 'Tarjeta' && this.usuario.role != 'EMPRESA_ROLE') {

      this.isLoading = true;

      this._pagar.pagarConFlow(dataFLOW).then(pagoExitoso => {

        this.isLoading = false;

        if (pagoExitoso) {
          this._data.crearPedido(pedido).then((pedido: any) => {

            this.updateRiderEstadoOcupado(pedido._id);
            this.modalCtrl.dismiss({ pagoExitoso: true, riderID: this.rider._id });
          });
        } else {
          this.modalCtrl.dismiss({ pagoExitoso: false });
        }
      });
    }


    if (this.metodoPago == 'Tarjeta' && this.usuario.role == 'EMPRESA_ROLE') {
      this._data.crearPedido(pedido).then((pedido: any) => {

        this.updateRiderEstadoOcupado(pedido._id);
        this.modalCtrl.dismiss({ pagoExitoso: true, riderID: this.rider._id });
      });
    }

    if (this.metodoPago == 'Efectivo') {

      this._data.crearPedido(pedido).then((pedido: any) => {

        this.updateRiderEstadoOcupado(pedido._id);
        this.modalCtrl.dismiss({ pagoExitoso: true, riderID: this.rider._id });
      });
    }
  }


  updateRiderEstadoOcupado(pedidoId) {

    this._control.estaBuscandoRider = false;

    this._fire.updateRider(this.rider._id, 'rider', {
      fase: 'navegando-al-origen',
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
