import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-codigo',
  templateUrl: './codigo.page.html',
  styleUrls: ['./codigo.page.scss'],
})
export class CodigoPage implements OnInit {

  codigo: string;

  constructor(
    private router: Router,
    private _data: DataService,
    private _auth: AuthService,
    public alertController: AlertController,
    public toastController: ToastController
    ) { }

  ngOnInit() {
  }

  openPage(page) {
    this.router.navigateByUrl(page);
  }

  addCodigo() {
    const body = {
      usuario: this._auth.usuario._id,
      codigo: this.codigo.toLowerCase()
    };

    this._data.addCupon(body).then((res: any) => {

      if (!res.ok) {
        return this.presentAlert(res.message);
      }

      this.presentToast('¡Cupón añadido!');
      this.codigo = null;
      this._data.getCuponActivo(this._auth.usuario._id);
    });
  }

  async presentAlert(message) {
    const alert = await this.alertController.create({
      header: 'Algo salio mal..',
      subHeader: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  async presentToast(message) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }

}
