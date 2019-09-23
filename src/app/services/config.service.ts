import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  apiURL = '';
  version = '1.0.1'
  ENTORNO = 'DEV';

  constructor() { }

  setApi(version) {

    if (this.ENTORNO == 'DEV') {
      this.apiURL = `http://localhost:3000/v${version}`;
    }

    if (this.ENTORNO == 'PROD') {
      this.apiURL = `https://joopiterweb.com/v${version}`;
    }
    
  }
}
