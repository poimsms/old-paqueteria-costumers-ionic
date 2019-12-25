import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-account',
  templateUrl: './login-account.page.html',
  styleUrls: ['./login-account.page.scss'],
})
export class LoginAccountPage implements OnInit {

  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  isLoading = false;

  constructor(
    private _auth: AuthService,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    this.telefono = this._auth.telefono;
  }

  ngOnInit() {
  }

  createAccount() {

    this.isLoading = true;

    if (!this.validateEmail(this.email)) {
      this.isLoading = false;
      return this.toastPresent('Email incorrecto');
    }

    const body = {
      nombre: this.nombre.toLowerCase().trim() + ' ' + this.apellido.toLowerCase().trim(),
      email: this.email.toLowerCase().trim(),
      telefono: this.telefono,
      token: this._auth.tokenPhone
    }

    this._auth.registrarUsuario(body).then((res: any) => {

      if (!res.ok) {
        this.router.navigateByUrl(`login`);
      }

      this.isLoading = false;

      this._auth.saveStorage(res.token, res.usuario);

    }).catch(() => this.isLoading = false);

  }

  async toastPresent(text) {

    const toast = await this.toastCtrl.create({
      message: text,
      duration: 2500,
      position: 'middle'
    });

    toast.present();
  }

  validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  }
}
