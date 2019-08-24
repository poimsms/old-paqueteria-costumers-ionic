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

  async toastPresent() {

    const toast = await this.toastCtrl.create({
      message: 'Favor completar todo los datos',
      duration: 2000,
      position: 'middle'
    });

    toast.present();
  }


  next() {
    if (this.nombre && this.password) {
      this._auth.signUpUsuario(this.nombre, this.telefono, this.password)
        .then(done => {
          if (done) {
            this.router.navigateByUrl('home');
          } else {
            console.log('error');
          }
        });
    } else {
      this.toastPresent();
    }
  }
}
