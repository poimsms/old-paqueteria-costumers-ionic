import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ModalController, NavParams, AlertController, PopoverController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { RatingComponent } from '../rating/rating.component';
import { OpcionesComponent } from '../opciones/opciones.component';
import { OtrosService } from 'src/app/services/otros.service';

@Component({
  selector: 'app-seleccionar-hora',
  templateUrl: './seleccionar-hora.component.html',
  styleUrls: ['./seleccionar-hora.component.scss'],
})
export class SeleccionarHoraComponent implements OnInit {

  isLoading = false;
  index_horario = 0;
  index_metodo_pago = 0;
  horarioValue = 'Lo antes posible';
  fecha_recogida = '';
  metodoPago = 'Efectivo';
  

  constructor(
    public modalCtrl: ModalController,
    private _data: DataService,
    private _auth: AuthService,
    private navParams: NavParams,
    public alertController: AlertController,
    public popoverController: PopoverController,
    private _otros: OtrosService
  ) {
  }

  ngOnInit() {
    // setTimeout(() => {
    //   this.presentPopover();
    // }, 2000);
  }

  async presentHorario() {

    const modal = await this.popoverController.create({
      component: OpcionesComponent,
      componentProps: { index: this.index_horario, tipo: 'horario' }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {

      this.index_horario = data.seleccion.index;
      this.horarioValue = data.seleccion.value;

      if (data.seleccion.value == 'Lo antes posible') {
        this.fecha_recogida = data.seleccion.value;
      } else {
        this.fecha_recogida = 'Hoy ' + data.seleccion.value.toLowerCase();
      }
      console.log(this.fecha_recogida);

      // this._otros.verificarPedidosProgramados(data.seleccion).then(aplicarCambio => {
      //   if (aplicarCambio) {
      //     console.log(data.seleccion.index)
      //     if (data.seleccion.value == 'Lo antes posible') {
      //       console.log(data.seleccion.value);
      //     } else {
      //       console.log('Hoy ' + data.seleccion.value.toLowerCase());
      //     }
      //   }
      // });

    }
  }


  async presentMetodoPago(ev: any) {

    const modal = await this.popoverController.create({
      component: OpcionesComponent,
      event: ev,

      componentProps: { index: this.index_metodo_pago, tipo: 'metodo_pago' }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {
      console.log(data, 'dataa')
      this.index_metodo_pago = data.seleccion.index;
      console.log(this.index_metodo_pago, 'indexxx')
      this.metodoPago = data.seleccion.value;
    }
  }

  togglePay(tipo) {
    this.metodoPago = tipo;
  }


}
