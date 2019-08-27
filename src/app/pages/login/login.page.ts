import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

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

  err_password = false;
  err_telefono_en_uso = false;
  err_cuenta_desactivada = false;
  err_8_digitos_telefono = false;
  err_num_telefono = false;


  passwordType = 'password';

  constructor(
    private _auth: AuthService,
    public toastController: ToastController,
    private router: Router
  ) {
    this._auth.authState
  }
  
  ngOnInit() {
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'Ya fue enviado un SMS',
      duration: 2000,
      position: 'middle'
    });
    toast.present();
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
    this.err_cuenta_desactivada = false;
    this.err_num_telefono = false;
    this.err_password = false;
    this.err_telefono_en_uso = false;
  }

  next() {

    this.resetErros();

    if (this.telefono.length != 8) {
      return this.err_8_digitos_telefono = true;
    }

    if (!Number(this.telefono)) {
      return this.err_num_telefono = true;
    }

    this.isLoading = true;

    this._auth.phoneNumberSendRequest(this.telefono).then((res:any) => {

      if (res.ok) {
        if (res.result.status == '0') {
          this._auth.idPhone = res.result.request_id;
          this._auth.telefono = Number(this.telefono);
          this.router.navigateByUrl(`login-verify`);
        } else {
          this.presentToast();
        }
      }

      if (!res.ok && res.err.tipo == 'telefono') {
        this.err_telefono_en_uso = true;
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

      this._auth.loginIn(this.telefono, this.password).then((res: any) => {
        
        if (!res.ok) {

          if (res.err.tipo == 'password') {
            this.err_password = true;
          }

          if (res.err.tipo == 'desactivado') {
            this.err_cuenta_desactivada = true;
          }
        }

        if (res.ok) {
          // Todo normal.. el observable cambiará la vista.
        }

        this.isLoading = false;
      });
    }
  }


}

