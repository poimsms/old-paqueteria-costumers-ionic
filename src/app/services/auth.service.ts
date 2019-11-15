import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from "@ionic/storage";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject } from "rxjs";
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  telefono: string;
  id: string;
  authState = new BehaviorSubject({ isAuth: false, usuario: {}, token: null, readyState: false });

  usuario: any;
  token: string;

  tipo: string;
  tokenPhone: string;

  constructor(
    private http: HttpClient,
    private platform: Platform,
    private storage: Storage,
    private _config: ConfigService
  ) { }

  phoneNumberSendRequest(body) {
    const url = `${this._config.apiURL}/usuarios/request-code`;
    return this.http.post(url, body).toPromise();
  }

  phoneResendCode(body) {
    const url = `${this._config.apiURL}/usuarios/resend-code`;
    return this.http.post(url, body).toPromise();
  }

  phoneVerifyCode(body) {
    const url = `${this._config.apiURL}/usuarios/verify-code`;
    return this.http.post(url, body).toPromise();
  }

  registrarUsuario(body) {
    const url = `${this._config.apiURL}/usuarios/create-account`;
    return this.http.post(url, body).toPromise();
  }

  logout() {
    this.removeStorage();
    this.authState.next({ isAuth: false, usuario: null, token: null, readyState: true });
  }

  saveFlowOrderStorage(order) {
    localStorage.setItem("order", JSON.stringify(order));
  }

  removeStorage() {
    if (this.platform.is("cordova")) {
      this.storage.remove("authData");
    } else {
      localStorage.removeItem("authData");
    }
  }

  saveStorage(token, usuario) {

    const authData = { token, uid: usuario._id };
    this.usuario = usuario;
    this.token = token;

    if (this.platform.is("cordova")) {
      this.storage.set("authData", JSON.stringify(authData));
      this.authState.next({ isAuth: true, usuario, token, readyState: true });
    } else {
      localStorage.setItem("authData", JSON.stringify(authData));
      this.authState.next({ isAuth: true, usuario, token, readyState: true  });
    }
  }

  loadStorage() {
    if (this.platform.is('cordova')) {
      this.storage.get('authData').then(res => {

        if (res) {

          const token = JSON.parse(res).token;
          const uid = JSON.parse(res).uid;

          this.getUser(token, uid).then(usuario => {
            this.usuario = usuario;
            this.token = token;
            this.authState.next({ isAuth: true, usuario, token, readyState: true  });
          });

        } else {
          this.authState.next({ isAuth: false, usuario: null, token: null, readyState: true  });
        }
      });
    } else {
      if (localStorage.getItem('authData')) {

        const res = localStorage.getItem('authData');
        const token = JSON.parse(res).token;
        const uid = JSON.parse(res).uid;

        this.getUser(token, uid).then(usuario => {
          this.usuario = usuario;
          this.token = token;
          this.authState.next({ isAuth: true, usuario, token, readyState: true  });
        });

      } else {
        this.authState.next({ isAuth: false, usuario: null, token: null, readyState: true  });
      }
    }
  }

  getUser(token, id) {
    const url = `${this._config.apiURL}/usuarios/get-one?id=${id}`;
    const headers = new HttpHeaders({ token, version: this._config.version });
    return this.http.get(url, { headers }).toPromise();
  }

  updateUser(body) {
    const url = `${this._config.apiURL}/usuarios/update?id=${this.usuario._id}`;
    const headers = new HttpHeaders({ token: this.token, version: this._config.version });
    return this.http.put(url, body, { headers }).toPromise();
  }

  updatePassword(body) {
    const url = `${this._config.apiURL}/usuarios/update-password?id=${this.usuario._id}`;
    const headers = new HttpHeaders({ token: this.token, version: this._config.version });
    return this.http.put(url, body, { headers }).toPromise();
  }

}