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
  
  telefono: number;
  phone: number;
  idPhone: string;
  authState = new BehaviorSubject({ isAuth: false, usuario: {}, token: null });

  usuario: any;
  token: string;

  constructor(
    private http: HttpClient,
    private platform: Platform,
    private storage: Storage,
    private _config: ConfigService
  ) { }

  phoneNumberSendRequest(telefono) {
    const url = `${this._config.apiURL}/nexmo/number`;
    const body = { telefono };
    return this.http.post(url, body).toPromise();
  }

  phoneCancelRequest(id) {
    const url = `${this._config.apiURL}/nexmo/cancel`;
    const body = { id };
    return this.http.post(url, body).toPromise();
  }

  phoneVerifyCode(id, code) {
    const url = `${this._config.apiURL}/nexmo/verify`;
    const body = { id, code };
    return this.http.post(url, body).toPromise();
  }

  loginUp(data) {
    return new Promise((resolve, reject) => {
      this.signUp(data).then((res: any) => {

        if (res.ok) {
          this.saveStorage(res.token, res.usuario, res.usuario._id);
        }

        resolve(res);
      });
    });
  }

  loginIn(telefono, password) {
    return new Promise((resolve, reject) => {
      this.signIn(telefono, password).then((res: any) => {

        if (res.ok) {
          this.saveStorage(res.token, res.usuario, res.usuario._id);
        }

        resolve(res);
      });
    });
  }

  logout() {
    this.removeStorage();
    this.authState.next({ isAuth: false, usuario: null, token: null });
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

  saveStorage(token, usuario, uid) {

    const authData = { token, uid };
    this.usuario = usuario;
    this.token = token;

    if (this.platform.is("cordova")) {
      this.storage.set("authData", JSON.stringify(authData));
      this.authState.next({ isAuth: true, usuario, token });
    } else {
      localStorage.setItem("authData", JSON.stringify(authData));
      this.authState.next({ isAuth: true, usuario, token });
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
            this.authState.next({ isAuth: true, usuario, token });
          });

        } else {
          this.authState.next({ isAuth: false, usuario: null, token: null });
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
          this.authState.next({ isAuth: true, usuario, token });
        });

      } else {
        this.authState.next({ isAuth: false, usuario: null, token: null });
      }
    }
  }

  signIn(telefono, password) {
    const url = `${this._config.apiURL}/usuarios/signin-phone`;
    const body = { telefono, password };
    return this.http.post(url, body).toPromise();
  }

  signUp(body) {
    const url = `${this._config.apiURL}/usuarios/signup`;
    return this.http.post(url, body).toPromise();
  }

  getUser(token, id) {
    const url = `${this._config.apiURL}/usuarios/get-one?id=${id}`;
    const headers = new HttpHeaders({
      Authorization: `JWT ${token}`
    });
    return this.http.get(url, { headers }).toPromise();
  }

}