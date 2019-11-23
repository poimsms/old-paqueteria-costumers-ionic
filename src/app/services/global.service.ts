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

  getTarifas(ciudad) {
    const url = `${this._config.apiURL}/core/tarifas-get?ciudad=${ciudad}`;
    return this.http.get(url).toPromise();
  }

  calcularPrecios(data) {

    return new Promise(async (resolve, reject) => {

      const { distancia, ciudad } = data;

      const tarifas: any = await this.getTarifas(ciudad);

      console.log(tarifas);

      let precioBici = 0;
      let precioMoto = 0;

      if (distancia < tarifas.limite_aplicacion) {
        precioBici = tarifas.bici.minima
      } else {
        const costo = tarifas.bici.distancia * distancia / 1000 + tarifas.bici.base;
        precioBici = Math.ceil(costo / 10) * 10;
      }

      if (ciudad == 'santiago') {
        precioMoto = this.precio_moto_santiago(tarifas, distancia);
      } else {
        precioMoto = this.precio_moto_normal(tarifas, distancia);
      }

      resolve({ bici: precioBici, moto: precioMoto })
    });
  }

  precio_moto_santiago(tarifas_data, distancia) {

    let precioMoto = 0;
    let tarifas: any;

    if (distancia < tarifas_data.limite_cambio) {
      tarifas = tarifas_data.moto.A;
    } else {
      tarifas = tarifas_data.moto.B;
    }

    console.log(tarifas, 'tarifaaas')

    if (distancia < tarifas.limite_aplicacion) {
      precioMoto = tarifas.minima;
    } else {
      const costo = tarifas.distancia * distancia / 1000 + tarifas.base;
      precioMoto = Math.ceil(costo / 10) * 10;
    }

    return precioMoto;
  }

  precio_moto_normal(tarifas, distancia) {

    let precioMoto = 0;

    if (distancia < tarifas.moto.limite_aplicacion) {
      precioMoto = tarifas.moto.minima;
    } else {
      const costo = tarifas.moto.distancia * distancia / 1000 + tarifas.moto.base;
      precioMoto = Math.ceil(costo / 10) * 10;
    }

    return precioMoto;
  }


}
