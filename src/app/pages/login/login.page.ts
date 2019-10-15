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
  err_8_digitos_telefono = false;
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

  showHidePassword() {
    if (this.passwordType == 'password') {
      this.passwordType = 'text';
    } else {
      this.passwordType = 'password';
    }
  }

  changeLogin(tipo) {

    if (tipo == 'login in') {
      this.signInUsuario = true;
      this.signUpUsuario = false;
    }

    if (tipo == 'login up') {
      this.signInUsuario = false;
      this.signUpUsuario = true;
    }

    this.password = undefined;
    this.telefono = undefined;

    this.resetErros();
  }

  resetErros() {
    this.err_8_digitos_telefono = false;
    this.err_num_telefono = false;
    this.err_telefono_en_uso = false;
  }

  next() {

    if (!this.politicas) {
      return;
    }

    this.resetErros();

    if (this.telefono.length != 8) {
      return this.err_8_digitos_telefono = true;
    }

    if (!Number(this.telefono)) {
      return this.err_num_telefono = true;
    }

    this.isLoading = true;

    this._auth.phoneNumberSendRequest(this.telefono).then((res: any) => {

      if (res.ok) {
        if (res.result.status == '0') {
          this._auth.idPhone = res.result.request_id;
          this._auth.telefono = Number(this.telefono);
          this.router.navigateByUrl(`login-verify`);
        } else {
          this.presentToast();
        }
      }
      if (!res.ok) {
        this.presentAlert(res.message);
      }

      this.isLoading = false;
    });
  }

  loginUsuario() {

    this.resetErros();

    // if (this.telefono.length != 8) {
    //   return this.err_8_digitos_telefono = true;
    // }

    if (!Number(this.telefono)) {
      return this.err_num_telefono = true;
    }

    this.isLoading = true;

    if (this.telefono && this.password) {

      const authData = {
        telefono: this.telefono,
        password: this.password,
        from: 'clients-app'
      };

      this._auth.loginIn(authData).then((res: any) => {

        if (!res.ok) {
          return this.presentAlert(res.message);
        }

        this.telefono = null;
        this.password = null;
        this.isLoading = false;

      }).catch(() => this.isLoading = false);
    }
  }

  togglePoliticas() {
    if (this.politicas) {
      this.politicas = false;
    } else {
      this.politicas = true;
    }
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
      duration: 2000,
      position: 'middle'
    });
    toast.present();
  }

}

