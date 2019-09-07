import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login-account',
  templateUrl: './login-account.page.html',
  styleUrls: ['./login-account.page.scss'],
})
export class LoginAccountPage implements OnInit {

  nombre: string;
  passwordType = "password";
  password: string;
  telefono: number;
  email: string;
  isLoading = false;

  constructor(
    private _auth: AuthService,
    private toastCtrl: ToastController
  ) {
    this.telefono = this._auth.telefono;
  }

  ngOnInit() {
  }

  togglePass() {
    if (this.passwordType == 'password') {
      this.passwordType = 'text';
    } else {
      this.passwordType = 'password';
    }
  }

  async toastPresent(text) {

    const toast = await this.toastCtrl.create({
      message: text,
      duration: 2000,
      position: 'middle'
    });

    toast.present();
  }

  validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  createAccount() {

    this.isLoading = true;

    if (!(this.nombre && this.password && this.email)) {
      this.isLoading = false;
      return this.toastPresent('Favor completar todo los datos');
    }

    if (!this.validateEmail(this.email)) {
      this.isLoading = false;
      return this.toastPresent('Email incorrecto');
    }


    const data = {
      nombre: this.nombre,
      email: this.email,
      telefono: this.telefono,
      password: this.password
    }

    this._auth.loginUp(data).then(() => this.isLoading = false);
  }
}
