import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';

@Component({
  selector: 'app-opciones',
  templateUrl: './opciones.component.html',
  styleUrls: ['./opciones.component.scss'],
})
export class OpcionesComponent implements OnInit {


  metodo_pago = 'Efectivo';

  constructor(
    private navParams: NavParams,
    public modalCtrl: ModalController
  ) {
    this.metodo_pago = this.navParams.get('metodo');
  }

  ngOnInit() { }

  togglePay(tipo) {
    this.modalCtrl.dismiss({ seleccion: tipo });
  }
}
