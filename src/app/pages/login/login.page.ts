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
  signInEmpresa = false;
  showErrorPassword = false;
  showErrorPhoneIsFound = false;
  isLoading = false;

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
    if (tipo == 'login in normal') {
      this.signInUsuario = true;
      this.signUpUsuario = false;
      this.signInEmpresa = false;
    }
    if (tipo == 'login up normal') {
      this.signInUsuario = false;
      this.signUpUsuario = true;
      this.signInEmpresa = false;
    }
    if (tipo == 'login in empresa') {
      this.signInUsuario = false;
      this.signUpUsuario = false;
      this.signInEmpresa = true;
    }
    this.password = undefined;
    this.telefono = undefined;
    this.showErrorPassword = false;
    this.showErrorPhoneIsFound = false;

  }

  next() {
    this.isLoading = true;
    const phone = Number(`569${this.telefono}`);    
    this._auth.phoneNumberSendRequest(phone).then((res:any) => {
     
      if (res.ok) {
        if (res.result.status == '0') {
          this._auth.idPhone = res.result.request_id;
          this._auth.telefono = this.telefono;
          this._auth.phone = phone;
          this.router.navigateByUrl(`login-verificar`);
        } else {
          this.presentToast();
        }

        this.isLoading = false;  
      }      
    });    
  }

  loginUsuario() {
    this.isLoading = true;

    // if (this.telefono.length != 8) {
    //   return this.error_telefono = true;
    // }

    if (this.telefono && this.password) {     
      this._auth.signInUsuario(this.telefono, this.password).then(done => {
        if (done) {
          this.router.navigateByUrl('home');
        } else {
          this.showErrorPassword = true;
        }
        this.isLoading = false;
      });
    }
  }


}

