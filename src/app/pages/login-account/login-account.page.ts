import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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

  constructor(
    private _auth: AuthService,
    private router: Router,
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

    if (!(this.nombre && this.password && this.email)) {
      return this.toastPresent('Favor completar todo los datos');
    }

    if (!this.validateEmail(this.email)) {
      return this.toastPresent('Email incorrecto');
    }

    const data = {
      nombre: this.nombre,
      email: this.email,
      telefono: this.telefono,
      password: this.password
    }

    this._auth.loginUp(data);
  }
}
