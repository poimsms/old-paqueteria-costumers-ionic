import { Injectable } from '@angular/core';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { ConfigService } from './config.service';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {

  tarifas: any;

  constructor(
    private appVersion: AppVersion,
    private platform: Platform,
    private http: HttpClient,
    private _config: ConfigService
  ) { }

  checkAppVersion() {
    return new Promise((resolve, reject) => {

      let serverURL: string;

      if (this._config.ENTORNO == 'DEV') {
        serverURL = 'http://localhost:3000';
      } else {
        serverURL = 'https://joopiterweb.com';
      }

      if (this.platform.is('cordova')) {
        this.appVersion.getVersionNumber().then(version => {
          const url = `${serverURL}/api-version?version=${version}&app=clients`;
          this.http.get(url).toPromise().then(data => {
            resolve(data);
          });
        });

      } else {
        const version = this._config.version;
        const url = `${serverURL}/api-version?version=${version}&app=clients`;
        this.http.get(url).toPromise().then(data => {
          resolve(data);
        });
      }
    });
  }

  getTarifas() {
    const url = `${this._config.apiURL}/core/tarifas-get-active-one`;
    this.http.get(url).toPromise().then(tarifas => this.tarifas = tarifas);
  }


}
