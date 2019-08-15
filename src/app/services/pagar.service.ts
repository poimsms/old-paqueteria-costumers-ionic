import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ConfigService } from './config.service';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { AlertController } from '@ionic/angular';


@Injectable({
  providedIn: 'root'
})
export class PagarService {

  apiURL: string;
  isBrowser: boolean;
  transactionID: string;

  constructor(
    public http: HttpClient,
    private _config: ConfigService,
    private iab: InAppBrowser,
    public alertController: AlertController
  ) {
    this.apiURL = this._config.apiURL;
  }


  pagarConFlow(token, transaccion) {

    return new Promise((resolve, reject) => {

      this.createTransaction('', transaccion)
        .then((res: any) => {

          this.transactionID = res._id;

          this.iniciarCompra(token, res).then((data) => {
            let respuesta = JSON.parse(JSON.stringify(data));

            if (respuesta.code != undefined && respuesta.code == 108) {
              this.presentAlert('Error', 'Imposible conectar con el sistema de pagos.');
              resolve(false);
            } else {

              let token = respuesta.token;
              let url = respuesta.url;

              const browser = this.iab.create(url + '?token=' + token, '_blank', 'location=yes');


              browser.on('exit').subscribe(event => {
                this.getTransaction(token, this.transactionID)
                  .then((result: any) => {
                    if (result.ok) {
                      resolve(true);
                    } else {
                      resolve(false);
                    }
                  });
              });

              browser.on('loadstart').subscribe(event => {
                if (event.url == 'hjhjk') {
                  browser.close();
                  resolve(true);
                }
              });
            }

          });
        });
    });

  }

  async presentAlert(titulo, mensaje) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    await alert.present();
  }


  createTransaction(token, body) {
    const url = `${this.apiURL}/transacciones/pago-iniciar`;
    const headers = new HttpHeaders({
      Authorization: `JWT ${token}`
    });
    return this.http.post(url, body, { headers }).toPromise();
  }

  getTransaction(token, body) {
    const url = `${this.apiURL}/transacciones/pago-iniciar`;
    const headers = new HttpHeaders({
      Authorization: `JWT ${token}`
    });
    return this.http.post(url, body, { headers }).toPromise();
  }

  iniciarCompra(token, body) {
    const url = `${this.apiURL}/transacciones/pago-iniciar`;
    const headers = new HttpHeaders({
      Authorization: `JWT ${token}`
    });
    return this.http.post(url, body, { headers }).toPromise();
  }

  iniciarPagoUsuario(id, body) {
    const url = `${this.apiURL}/pago/pagar-con-flow?${id}`;
    return this.http.post(url, body).toPromise();
  }

  registrarPagoEmpresa(body) {
    const url = `${this.apiURL}/pago/registrar-pago-empresa`;
    return this.http.post(url, body).toPromise();
  }

  actualizarRegistroEmpresa(id, body) {
    const url = `${this.apiURL}/pago/actualizar-pago-empresa?${id}`;
    return this.http.post(url, body).toPromise();
  }
}
