import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { ControlService } from 'src/app/services/control.service';
import { SeleccionarHoraComponent } from 'src/app/components/seleccionar-hora/seleccionar-hora.component';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit {

  pedidos = [];

  constructor(
    private _auth: AuthService,
    private _data: DataService,
    private _control: ControlService,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this._data.getPedidos(this._auth.usuario._id, 'completados').then((pedidos: any) => {
      console.log(pedidos)
      this.pedidos = pedidos;
    });
  }

  async openHoraModal() {

    const modal = await this.modalController.create({
      component: SeleccionarHoraComponent,
      componentProps: { index: 10}
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data.ok) {
      console.log(data.seleccion.index)
      if (data.seleccion.value == 'Lo antes posible') {
        console.log(data.seleccion.value);
      } else {
        console.log('Hoy ' + data.seleccion.value.toLowerCase());
      }
    }
  }

  segmentChanged(e) {
    // console.log(e.detail.value)
    this._data.getPedidos(this._auth.usuario._id, e.detail.value).then((pedidos: any) => {
      console.log(pedidos)
      this.pedidos = pedidos;
    });
  }


}

