import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ConfigService } from './config.service';
import { Platform } from '@ionic/angular';
import { FCM } from '@ionic-native/fcm/ngx';


@Injectable({
  providedIn: 'root'
})
export class FcmService {

  constructor(
    public http: HttpClient,
    private _config: ConfigService,
    private platform: Platform,
    private fcm: FCM
  ) { }


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

    this.fcm.onNotification().subscribe(data => {
      if (data.wasTapped) {
        console.log('Received in background');
      } else {
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
    return this.http.put(url, body).toPromise();
  }

  getDevice(id) {
    const url = `${this._config.apiURL}/core/device-get-one?id=${id}`;
    return this.http.get(url).toPromise();
  }
}
