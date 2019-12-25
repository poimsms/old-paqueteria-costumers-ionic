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
  isLoading = false;
  nombre_comercial: string;
  tipo_tienda: string;
  isActivacion = false;
  isPromo = true;

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

  onAplicar() {
    const body = {
      usuario: this._auth.usuario._id,
      codigo: this.codigo.toLowerCase()
    };

    this.isLoading = true;

    this._data.addCupon(body).then((res: any) => {

      this.isLoading = false;

      this.codigo = null;

      if (!res.ok) {
        return this.presentAlert(res.message);
      }

      console.log(res, 'ress')

      if (res.tipo == 'PROMO') {
        this.presentToast('¡Promoción añadida!');
        this._data.getCuponActivo(this._auth.usuario._id);
      }

      if (res.tipo == 'ACTIVACION') {
        this.isPromo = false;
        this.isActivacion = true;
        this.tipo_tienda = res.tienda;

        this.presentToast('¡Activación exitosa!');
      }

     
    });
  }

  onActualizar() {
    this.isLoading = true;

    this._auth.updateUser({nombre: this.nombre_comercial}).then(() => {
      this.isLoading = false;

      this._auth.refreshUser();
      this.isPromo = true;
      this.isActivacion = false;
      this.presentToast('Se actualizó el nombre correctamente.');
    })
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
      duration: 3000,
      position: 'middle'
    });
    toast.present();
  }

}
