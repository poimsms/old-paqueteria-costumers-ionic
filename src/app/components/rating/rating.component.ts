import { Component, OnInit } from '@angular/core';
import { NavParams, ModalController } from '@ionic/angular';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss'],
})
export class RatingComponent implements OnInit {

  rating: any;
  cliente: any;

  comentario = '';
  starts = 3;

  constructor(
    public modalCtrl: ModalController,
    private navParams: NavParams,
    private _data: DataService
  ) {
    this.cliente = navParams.get('data').cliente;
    this.rating = navParams.get('data').rating;
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  rate() {

    const body: any = {
      comentario: this.comentario,
      starts: this.starts,
      pendiente: false
    };
    console.log(body)

    this.closeModal();

    // const body: any = {
    //   starts: this.starts,
    //   omitir: false,
    //   pendiente: false
    // };

    // if (this.comentario.length > 5) {
    //   body.comentario = this.comentario;
    // }

    // this._data.rateRider(this.rating._id, this.rating.rider, body).then(() => {
    //   this.closeModal();
    // });
  }

  ngOnInit() { }

}
