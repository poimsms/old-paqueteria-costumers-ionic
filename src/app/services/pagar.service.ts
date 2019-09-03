import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ConfigService } from './config.service';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { AlertController } from '@ionic/angular';


@Injectable({
  providedIn: 'root'
})
export class PagarService {

  constructor(
    public http: HttpClient,
    private _config: ConfigService,
    private iab: InAppBrowser,
    public alertController: AlertController
  ) { }


  pagarConFlow(token, dataFLOW) {

    return new Promise((resolve, reject) => {

      this.createTransaction(token, dataFLOW)
        .then((transaction: any) => {

          const body = {
            monto: dataFLOW.monto,
            email: dataFLOW.email,
            transaccionID: transaction._id
          };

          this.iniciarPago(token, body).then((data) => {
            let respuesta = JSON.parse(JSON.stringify(data));

            if (respuesta.code != undefined && respuesta.code == 108) {
              this.presentAlert('Error', 'Imposible conectar con el sistema de pagos.');
              resolve(false);
            } else {

              let token = respuesta.token;
              let url = respuesta.url;

              const browser = this.iab.create(url + '?token=' + token, '_blank', 'location=yes');

              browser.on('exit').subscribe(event => {
                this.getTransaction(token, transaction._id)
                  .then((result: any) => {
                    if (result.ok) {
                      resolve(true);
                    } else {
                      resolve(false);
                    }
                  });
              });

              browser.on('loadstart').subscribe(event => {
                if (event.url == 'https://joopiterweb.com/pago/compra-exitosa') {
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
    const url = `${this._config.apiURL}/pago/transaction-create-one`;
    const headers = new HttpHeaders({
      Authorization: `JWT ${token}`
    });
    return this.http.post(url, body, { headers }).toPromise();
  }

  getTransaction(token, id) {
    const url = `${this._config.apiURL}/pago/transaction-get-one?id=${id}`;
    const headers = new HttpHeaders({
      Authorization: `JWT ${token}`
    });
    return this.http.get(url, { headers }).toPromise();
  }

  iniciarPago(token, body) {
    const url = `${this._config.apiURL}/pago/pago-iniciar`;
    const headers = new HttpHeaders({
      Authorization: `JWT ${token}`
    });
    return this.http.post(url, body, { headers }).toPromise();
  }

}
