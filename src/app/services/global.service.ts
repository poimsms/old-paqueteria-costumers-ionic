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

      console.log(tarifas, 'TARIFASSS')

      let precioMoto = 0;
      let precioBici = 0;
      let precioAuto = 0;

      if (ciudad == 'santiago') {

        precioBici = this.tarifa_unica(tarifas, distancia, 'bici');
        precioMoto = this.tarifa_triple(tarifas, distancia, 'moto');
        precioAuto = this.tarifa_triple(tarifas, distancia, 'auto');

      } else {

        precioBici = this.tarifa_unica(tarifas, distancia, 'bici');
        precioMoto = this.tarifa_doble(tarifas, distancia, 'moto');
        precioAuto = this.tarifa_doble(tarifas, distancia, 'auto');
      }

      resolve({ moto: precioMoto, bici: precioBici, auto: precioAuto })
    });
  }

  tarifa_unica(data, distancia, vehiculo) {
    let precio = 0;

    let tarifas = data[vehiculo];

    if (distancia < tarifas.limite_aplicacion) {
      precio = tarifas.minima;
    } else {
      const costo = tarifas.distancia * distancia / 1000 + tarifas.base;

      precio = Math.round(costo / 100) * 100;
    }

    return precio;
  }

  tarifa_doble(data, distancia, vehiculo) {

    let precio = 0;
    let tarifas: any;

    if (distancia < data.limite_cambio_1) {
      tarifas = data[vehiculo].A;
    } else {
      tarifas = data[vehiculo].B;
    }

    if (distancia < tarifas.limite_aplicacion) {
      precio = tarifas.minima;
    } else {
      const costo = tarifas.distancia * distancia / 1000 + tarifas.base;

      precio = Math.round(costo / 100) * 100;
    }

    return precio;
  }

  tarifa_triple(data, distancia, vehiculo) {

    let precio = 0;
    let tarifas: any;

    if (distancia < data.limite_cambio_1) {
      tarifas = data[vehiculo].A;
    }
    
    if (distancia > data.limite_cambio_1) {
      tarifas = data[vehiculo].B;
    }

    if (distancia > data.limite_cambio_2) {
      tarifas = data[vehiculo].C;
    }

    if (distancia < tarifas.limite_aplicacion) {
      precio = tarifas.minima;
    } else {
      const costo = tarifas.distancia * distancia / 1000 + tarifas.base;

      precio = Math.round(costo / 100) * 100;
    }

    return precio;
  }


  moto_tarifa_santiago(tarifas_data, distancia) {

    let precio = 0;
    let tarifas: any;

    if (distancia < tarifas_data.limite_cambio) {
      tarifas = tarifas_data.moto.A;
    } else {
      tarifas = tarifas_data.moto.B;
    }

    if (distancia < tarifas.limite_aplicacion) {
      precio = tarifas.minima;
    } else {
      const costo = tarifas.distancia * distancia / 1000 + tarifas.base;

      precio = Math.round(costo / 100) * 100;
    }

    return precio;
  }

  auto_tarifa_santiago(tarifas_data, distancia) {

    let precio = 0;
    let tarifas: any;

    if (distancia < tarifas_data.limite_cambio) {
      tarifas = tarifas_data.moto.A;
    } else {
      tarifas = tarifas_data.moto.B;
    }

    if (distancia < tarifas.limite_aplicacion) {
      precio = tarifas.minima;
    } else {
      const costo = tarifas.distancia * distancia / 1000 + tarifas.base;

      precio = Math.round(costo / 100) * 100;
    }

    return precio;
  }

  
  bici_tarifa_coquimbo(tarifas, distancia) {

    let precio = 0;

    if (distancia < tarifas.bici.limite_aplicacion) {
      precio = tarifas.bici.minima;
    } else {
      const costo = tarifas.bici.distancia * distancia / 1000 + tarifas.bici.base;

      precio = Math.round(costo / 100) * 100;
    }

    return precio;
  }

  
  moto_tarifa_coquimbo(tarifas, distancia) {

    let precio = 0;

    if (distancia < tarifas.moto.limite_aplicacion) {
      precio = tarifas.moto.minima;
    } else {
      const costo = tarifas.moto.distancia * distancia / 1000 + tarifas.moto.base;

      precio = Math.round(costo / 100) * 100;
    }

    return precio;
  }

  auto_tarifa_coquimbo(tarifas, distancia) {

    let precio = 0;

    if (distancia < tarifas.auto.limite_aplicacion) {
      precio = tarifas.auto.minima;
    } else {
      const costo = tarifas.auto.distancia * distancia / 1000 + tarifas.auto.base;

      precio = Math.round(costo / 100) * 100;
    }

    return precio;
  }


}
