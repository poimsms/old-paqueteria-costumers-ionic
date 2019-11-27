import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ConfigService } from './config.service';
import { Platform, AlertController } from '@ionic/angular';
import { FCM } from '@ionic-native/fcm/ngx';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class FcmService {

  constructor(
    public http: HttpClient,
    private _config: ConfigService,
    private platform: Platform,
    private fcm: FCM,
    private _auth: AuthService,
    public alertController: AlertController

  ) { 
    // this.listenToNotifications();
  }

  async getToken(uid) {

    if (!this.platform.is('cordova')) {
      return;
    }

    const token = await this.fcm.getToken();
    const body = { token, usuario: uid };
    this.updateDevice(body);
  }

  async onTokenRefresh(uid) {

    if (!this.platform.is('cordova')) {
      return;
    }

    this.fcm.onTokenRefresh().subscribe(token => {
      const body = { token, usuario: uid };
      this.updateDevice(body);
    });
  }

  listenToNotifications() {

    

    if (!this.platform.is('android')) {
      return;
    }

    // alert( 'JSON.stringify(data)' );


    this.fcm.onNotification().subscribe(data => {
      if (data.wasTapped) {
        console.log('Received in background');
        this.alert_area_sin_riders(JSON.stringify(data));   

      } else {
        this.alert_area_sin_riders(JSON.stringify(data));
        console.log('Received in foreground');
      }
    });
  }

  async sendPushNotification(id, topico) {
    const device: any = await this.getDevice(id);
    const pushURL = `https://us-central1-mapa-334c3.cloudfunctions.net/pushNotification?topico=${topico}&&token=${device.token}`;
    this.http.get(pushURL, { responseType: 'text' }).toPromise();
  }

  updateDevice(body) {
    const url = `${this._config.apiURL}/core/device-update`;
    const headers = new HttpHeaders({ token: this._auth.token, version: this._config.version });
    return this.http.put(url, body, { headers }).toPromise();
  }

  getDevice(id) {
    const url = `${this._config.apiURL}/core/device-get-one?id=${id}`;
    const headers = new HttpHeaders({ token: this._auth.token, version: this._config.version });
    return this.http.get(url, { headers }).toPromise();
  }

  async alert_area_sin_riders(m) {
    const alert = await this.alertController.create({
      header: 'fcm',
      message: m,
      buttons: [
        {
          text: 'Ok',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            // this.resetMapa();
          }
        }
      ]
    });

    await alert.present();
  }

}
