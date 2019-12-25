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

      let precioMoto = 0;
      let precioBici = 0;
      let precioAuto = 0;

      if (distancia < tarifas.comida.B.limite) {
        let precio = this.tarifa_comida(tarifas, distancia);
        precioBici = precio;
        precioMoto = precio;
        precioAuto = precio;
      } else {
        if (ciudad == 'santiago') {
          precioBici = this.tarifa_unica(tarifas, distancia, 'bici');
          precioMoto = this.tarifa_triple(tarifas, distancia, 'moto');
          precioAuto = this.tarifa_triple(tarifas, distancia, 'auto');
        } else {
          precioBici = this.tarifa_unica(tarifas, distancia, 'bici');
          precioMoto = this.tarifa_doble(tarifas, distancia, 'moto');
          precioAuto = this.tarifa_doble(tarifas, distancia, 'auto');
        }
      }

      resolve({ moto: precioMoto, bici: precioBici, auto: precioAuto })
    });
  }

  tarifa_comida(tarifas, distancia) {
    let precio = 0;
    
    if (distancia < tarifas.comida.A.limite) {
      precio = tarifas.comida.A.costo
    }

    if (tarifas.comida.A.limite < distancia
      && distancia < tarifas.comida.B.limite) {
      precio = tarifas.comida.A.costo
    }

    return precio;
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


  aplicar_codigo(data, monto) {

    let precio_descuento = 0;

    if (data.cupon.tipo == 'PORCENTAJE') {

      const delta = monto * data.cupon.descuento / 100;

      if (delta > data.cupon.tope) {
        const diff = monto - data.cupon.tope;
        diff < 0 ? precio_descuento = 0 :precio_descuento = diff;
      } else {
        precio_descuento = Math.round((monto - monto * data.cupon.descuento / 100) / 100) * 100;
      }
    }

    if (data.cupon.tipo == 'DINERO') {
      const delta = monto - data.cupon.descuento;
      delta < 0 ? precio_descuento = 0 : precio_descuento = delta;
    }

    return precio_descuento;
  }

}
