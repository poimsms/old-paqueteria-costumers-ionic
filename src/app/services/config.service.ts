import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  apiURL = '';
  version = '1.6.2'
  ENTORNO = 'PROD';

  constructor(private http: HttpClient) {
    this.setApi();
  }

  setApi() {
    if (this.ENTORNO == 'DEV') {
      this.apiURL = `http://localhost:3000/v1.0.1`;
    }
    if (this.ENTORNO == 'PROD') {
      this.apiURL = `https://joopiterweb.com/v1.0.1`;
    }
  }

  checkUpdate() {
    let serverURL = '';

    if (this.ENTORNO == 'DEV') {
      serverURL = `http://localhost:3000`;
    }

    if (this.ENTORNO == 'PROD') {
      serverURL = `https://joopiterweb.com`;
    }

    return new Promise((resolve, reject) => {
      const url = `${serverURL}/api-version?version=${this.version}&app=clients`;
      this.http.get(url).toPromise().then(data => {
        resolve(data);
      });
    });
  }

}
