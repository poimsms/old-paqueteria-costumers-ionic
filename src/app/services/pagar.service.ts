import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ConfigService } from './config.service';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { AlertController } from '@ionic/angular';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class PagarService {

  constructor(
    public http: HttpClient,
    private _config: ConfigService,
    private iab: InAppBrowser,
    public alertController: AlertController,
    private _auth: AuthService
  ) { }


  pagarConFlow(dataFLOW) {

    return new Promise((resolve, reject) => {

      this.createTransaction(dataFLOW)
        .then((transaction: any) => {

          const body = {
            monto: dataFLOW.monto,
            email: dataFLOW.email,
            transaccionID: transaction._id
          };

          this.iniciarPago(body).then((data) => {
            let respuesta = JSON.parse(JSON.stringify(data));

            if (respuesta.code != undefined && respuesta.code == 108) {
              this.presentAlert('Error', 'Imposible conectar con el sistema de pagos.');
              resolve(false);
            } else {

              let token = respuesta.token;
              let url = respuesta.url;

              const browser = this.iab.create(url + '?token=' + token, '_blank', 'location=yes');

              browser.on('exit').subscribe(event => {
                this.getTransaction(transaction._id)
                  .then((result: any) => {
                    if (result.pago_exitoso) {
                      resolve(true);
                    } else {
                      resolve(false);
                    }
                  });
              });

              browser.on('loadstart').subscribe(event => {
                if (event.url == `${this._config.apiURL}/pago/compra-exitosa`) {
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

  createTransaction(body) {
    const url = `${this._config.apiURL}/pago/transaction-create-one`;
    const headers = new HttpHeaders({ token: this._auth.token, version: this._config.version });
    return this.http.post(url, body, { headers }).toPromise();
  }

  getTransaction(id) {
    const url = `${this._config.apiURL}/pago/transaction-get-one?id=${id}`;
    const headers = new HttpHeaders({ token: this._auth.token, version: this._config.version });
    return this.http.get(url, { headers }).toPromise();
  }

  iniciarPago(body) {
    const url = `${this._config.apiURL}/pago/pago-iniciar`;
    const headers = new HttpHeaders({ token: this._auth.token, version: this._config.version });
    return this.http.post(url, body, { headers }).toPromise();
  }

}
