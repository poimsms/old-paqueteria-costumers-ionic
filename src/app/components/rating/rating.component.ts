import { Component, OnInit } from '@angular/core';
import { NavParams, ModalController, ToastController, PopoverController } from '@ionic/angular';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss'],
})
export class RatingComponent implements OnInit {

  rating: any;
  comentario: string;
  starts = 0;
  rider: any;
  isLoading = false;

  constructor(
    public modalCtrl: ModalController,
    private navParams: NavParams,
    private _data: DataService,
    public toastController: ToastController,
    public popoverController: PopoverController

  ) {
    this.rider = navParams.get('rating').rider;
  }

  closeModal() {
    this.popoverController.dismiss();
  }

  omitir() {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;


    const data: any = {
      isActive: false,
      omitido: true
    };

    this._data.rateRider(this.rating._id, this.rating.rider, data).then(() => {
      this.closeModal();
      this.omitirToast();
    });
  }

  calificar() {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    const data: any = {
      comentario: this.comentario,
      starts: this.starts,
      isActive: false,
      omitido: false
    };

    this._data.rateRider(this.rating._id, this.rating.rider._id, data).then(() => {
      this.closeModal();
      this.calificacionToast();
    });
  }

  ngOnInit() { }

  async omitirToast() {
    const toast = await this.toastController.create({
      message: 'Tu calificación se ha omitido',
      duration: 2000,
      position: 'middle'
    });
    toast.present();
  }

  async calificacionToast() {
    const toast = await this.toastController.create({
      message: 'Gracias por calificar al Rider!',
      duration: 2000,
      position: 'middle'
    });
    toast.present();
  }

}
