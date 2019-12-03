import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  apiURL = '';
  version = '1.6.7';
  ENTORNO = 'PROD';

  constructor(private http: HttpClient) {
    this.setApi();
  }

  setApi() {

    switch (this.ENTORNO) {
      case 'DEV':
        this.apiURL = `http://localhost:3000/v1.0.1`;
        break;

      case 'PROD':
        this.apiURL = `https://joopiterweb.com/v1.0.1`;
        break;

      case 'TEST':
        this.apiURL = `https://footballonapp.com/v1.0.1`;
        break;
    }
  }

  checkUpdate() {
    let serverURL = '';

    switch (this.ENTORNO) {
      case 'DEV':
        serverURL = `http://localhost:3000`;
        break;

      case 'PROD':
        serverURL = `https://joopiterweb.com`;
        break;

      case 'TEST':
        serverURL = `https://footballonapp.com`;
        break;
    }

    return new Promise((resolve, reject) => {
      const url = `${serverURL}/api-version?version=${this.version}&app=clients`;
      this.http.get(url).toPromise().then(data => {
        resolve(data);
      });
    });
  }

}
