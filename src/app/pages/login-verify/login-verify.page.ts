import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login-verify',
  templateUrl: './login-verify.page.html',
  styleUrls: ['./login-verify.page.scss'],
})
export class LoginVerifyPage implements OnInit {
  codigo: string;

  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  n6: number;

  counter = 120;
  textTime = '2:00';

  isActive = [true, false, false, false, false, false];

  constructor(
    private _auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.cuentaAtras();
  }

  async toastPresent() {
    const toast = await this.toastCtrl.create({
      message: 'Código incorrecto',
      duration: 2000,
      position: 'middle'
    });
    toast.present();
  }

  cuentaAtras() {
    let id = setInterval(() => {
      this.counter -= 1;
      if (this.counter == 0) {
        clearInterval(id);
      } else if (this.counter < 60) {
        this.textTime = `${this.counter}`;
      } else if (this.counter >= 60 && this.counter < 70) {
        this.textTime = `1:0${this.counter - 60}`;
      } else {
        this.textTime = `1:${this.counter - 60}`;
      }
    }, 1000);
  }

  codigoListo(index) {

    if (index == 0) {
      if (this.n1) {
        this.isActive[index] = true;
      } else {
        this.isActive[index] = false;
      }
    }

    if (index == 1) {
      if (this.n2) {
        this.isActive[index] = true;
      } else {
        this.isActive[index] = false;
      }
    }

    if (index == 2) {
      if (this.n3) {
        this.isActive[index] = true;
      } else {
        this.isActive[index] = false;
      }
    }

    if (index == 3) {
      if (this.n4) {
        this.isActive[index] = true;
      } else {
        this.isActive[index] = false;
      }
    }

    if (this.n1 && this.n2 && this.n3 && this.n4) {
      this.checkCode();
    }
  }

  checkCode() {

    const code = `${this.n1}${this.n2}${this.n3}${this.n4}`;

    this._auth.phoneVerifyCode(this._auth.idPhone, code).then((res: any) => {
      if (res.ok) {
        if (res.result.status == 0) {
          this.router.navigateByUrl('login-account');
        } else {
          this.n1 = null;
          this.n2 = null;
          this.n3 = null;
          this.n4 = null;
          this.isActive[0] = true;
          this.isActive[1] = false;
          this.isActive[2] = false;
          this.isActive[3] = false;
          this.toastPresent();
        }
      } else {
        console.log('error');
      }
      console.log(res);
    });
  }

  cancelar() {
    this._auth.phoneCancelRequest(this._auth.idPhone).then(res => {
      console.log(res);
    });
  }
}
