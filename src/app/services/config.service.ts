import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  version = '1.6.9';
  ENTORNO = 'DEV';

  coleccion_riders = '';
  path_riders = '';

  coleccion_coors = '';
  path_coors = '';
  
  apiURL = '';

  constructor(private http: HttpClient) {
    this.setApi();
    this.setCollections();
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

  setCollections() {

    switch (this.ENTORNO) {
      case 'DEV':
        this.coleccion_riders = 'riders_dev';
        this.path_riders = 'riders_dev/';

        this.coleccion_coors = 'riders_coors_dev';
        this.path_coors = 'riders_coors_dev/';
        break;

      case 'PROD':
        this.coleccion_riders = 'riders';
        this.path_riders = 'riders/';

        this.coleccion_coors = 'riders_coors';
        this.path_coors = 'riders_coors/';
        break;

      case 'TEST':
        this.coleccion_riders = 'riders_dev';
        this.path_riders = 'riders_dev/';

        this.coleccion_coors = 'riders_coors_dev';
        this.path_coors = 'riders_coors_dev/';
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
