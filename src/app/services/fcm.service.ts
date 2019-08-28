import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ConfigService } from './config.service';
import { FCM } from '@ionic-native/fcm/ngx';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class FcmService {

  apiURL: string;

  constructor(
    public http: HttpClient,
    private _config: ConfigService,
    private fcm: FCM,
    private platform: Platform
  ) { 

    this.apiURL = this._config.apiURL;

  }

    // Get permission from the user
    async getToken(uid) {

      let token;
    
      if (this.platform.is('android')) {
        token = await this.fcm.getToken()
      } 

      const body = {
        token,
        usuario: uid
      }

      const url = `${this.apiURL}/riders/create-token-device`;
      await this.http.put(url, body).toPromise();
    
   }
  
    // Listen to incoming FCM messages
    listenToNotifications() {
      this.fcm.onNotification().subscribe(data => {
        console.log(data);
        if (data.wasTapped) {
          console.log('Received in background');
          // this.router.navigate([data.landing_page, data.price]);
        } else {
          console.log('Received in foreground');
          // this.router.navigate([data.landing_page, data.price]);
        }
      });    }


    
}
