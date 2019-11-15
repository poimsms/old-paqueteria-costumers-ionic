import { Component, OnInit } from '@angular/core';
import { ToastController, ModalController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { PoliticasComponent } from 'src/app/components/politicas/politicas.component';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  telefono: string;
  password: string;

  signInUsuario = false;
  signUpUsuario = true;
  isLoading = false;

  err_telefono_en_uso = false;
  err_9_digitos_telefono = false;
  err_num_telefono = false;

  passwordType = 'password';
  politicas = false;

  constructor(
    private _auth: AuthService,
    public toastController: ToastController,
    private router: Router,
    public modalController: ModalController,
    public alertController: AlertController
  ) {
    this._auth.authState
  }

  ngOnInit() {
  }

  next() {

    if (!this.politicas) {
      return;
    }

    this.resetErros();

    if (this.telefono.length != 9) {
      return this.err_9_digitos_telefono = true;
    }

    if (!Number(this.telefono)) {
      return this.err_num_telefono = true;
    }

    this.isLoading = true;

    const authData = {
      telefono: this.telefono,
      from: 'clients-app'
    };
    
    this._auth.phoneNumberSendRequest(authData).then((res: any) => {

      this.isLoading = false;

      if (!res.ok) {
        return this.presentAlert(res.message);
      }

      this._auth.tipo = res.tipo;
      this._auth.id = res.id;
      this._auth.telefono = this.telefono;
      this.telefono = null;

      this.router.navigateByUrl(`login-verify`);

    }).catch(() => this.isLoading = false);
  }

  togglePoliticas() {
    if (this.politicas) {
      this.politicas = false;
    } else {
      this.politicas = true;
    }
  }

  resetErros() {
    this.err_9_digitos_telefono = false;
    this.err_num_telefono = false;
    this.err_telefono_en_uso = false;
  }

  async openPoliticasModal() {

    const modal = await this.modalController.create({
      component: PoliticasComponent
    });

    await modal.present();
  }

  async presentAlert(message) {
    const alert = await this.alertController.create({
      header: 'Algo salio mal..',
      subHeader: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'Ya fue enviado un SMS',
      duration: 2500,
      position: 'middle'
    });
    toast.present();
  }

}

