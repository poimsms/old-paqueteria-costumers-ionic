import { Component, OnInit } from '@angular/core';
import { NavParams, ModalController, ToastController } from '@ionic/angular';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss'],
})
export class RatingComponent implements OnInit {

  rating: any;
  comentario = '';
  starts = 3;

  constructor(
    public modalCtrl: ModalController,
    private navParams: NavParams,
    private _data: DataService,
    public toastController: ToastController
  ) {
    this.rating = navParams.get('data').rating;
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  omitir() {
    const data: any = {};

    data.pendiente = false;
    data.omitido = true;

    this._data.rateRider(this.rating._id, this.rating.rider, data).then(() => {
      this.closeModal();
      this.omitirToast();
    });
  }

  calificar() {

    const data: any = {};

    if (this.comentario.length > 5) {
      data.comentario = this.comentario;
    }

    data.starts = this.starts;
    data.pendiente = false;
    data.omitido = false;

    this._data.rateRider(this.rating._id, this.rating.rider._id, data).then(() => {
      this.closeModal();
      this.calificacionToast();
    });
  }

  ngOnInit() { }

  async omitirToast() {
    const toast = await this.toastController.create({
      message: 'Tu calificación se ha omitido!',
      duration: 2000,
      position: 'middle'
    });
    toast.present();
  }

  async calificacionToast() {
    const toast = await this.toastController.create({
      message: 'Gracias por calificar al rider!',
      duration: 2000,
      position: 'middle'
    });
    toast.present();
  }

}
