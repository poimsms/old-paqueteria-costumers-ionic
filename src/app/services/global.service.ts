import { Injectable } from '@angular/core';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { ConfigService } from './config.service';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {

  apiURL: string;

  constructor(
    private appVersion: AppVersion,
    private platform: Platform,
    private http: HttpClient,
    private _config: ConfigService
  ) {
    this.apiURL = this._config.apiURL;
  }

  checkAppVersion() {
    return new Promise((resolve, reject) => {

      if (this.platform.is('cordova')) {
        console.log('pasoo')
        this.appVersion.getVersionNumber().then(version => {
          const url = `${this.apiURL}/global/app-version?version=${version}`;
          this.http.get(url).toPromise().then(data => {
            resolve(data);
          });
        });

      } else {

        const version = this._config.version;
        const url = `${this.apiURL}/global/app-version?version=${version}`;
        this.http.get(url).toPromise().then(data => {
          resolve(data);
        });
      }
    });
  }




}
