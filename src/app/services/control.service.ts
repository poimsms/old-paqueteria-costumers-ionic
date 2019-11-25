import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Platform } from '@ionic/angular';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class ControlService {

  tipo: string;

  origen: any = null;
  destino: any;

  centro: any = { lat: -33.444600, lng: -70.655585 };

  posicion: any;

  origenReady = false;
  destinoReady = false;
  rutaReady = false;
  estaBuscandoRider = false;


  mis_lugares = {
    tipo: '',
    accion: '',
    id: ''
  };

  mapState = new Subject();
  ubicacionState = new Subject();

  gpsState = new Subject();

  gps_counter = 0;

  gpsCoors: any = { lat: -33.444600, lng: -70.655585 };

  constructor(
    private geolocation: Geolocation,
    private platform: Platform,
    private _config: ConfigService
  ) { }

  grand_GPS_permission() {

    return new Promise((resolve, reject) => {

      if (this._config.ENTORNO == 'DEV') {
        if (!this.platform.is('cordova')) {
          return resolve(false);
        }
      }

      this.geolocation.getCurrentPosition().then((resp) => {

        this.gpsCoors = {
          lat: resp.coords.latitude,
          lng: resp.coords.longitude
        };

        resolve(true)

      }).catch((error) => {

        resolve(false);


        // if (this.gps_counter <= 1) {

        //   this.gps_counter++;

        //   setTimeout(() => {
        //     this.grand_GPS_permission();
        //   }, 1000);

        // } else {
        //   resolve(false);
        // }
      });
    })
  }

  grand_GPS_permission2() {
    return new Promise((resolve, reject) => {

      if (this._config.ENTORNO == 'DEV') {
        if (!this.platform.is('cordova')) {
          return resolve();
        }
      }

      this.geolocation.getCurrentPosition().then((resp) => {

        this.gpsCoors = {
          lat: resp.coords.latitude,
          lng: resp.coords.longitude
        };

        this.gpsState.next(true);
        resolve();

      }).catch((error) => {

        setTimeout(() => {
          this.grand_GPS_permission();
        }, 1000);
      });
    });
  }

  calcularRuta() {
    this.rutaReady = true;
    const data = {
      accion: 'calcular-ruta',
      origen: this.origen,
      destino: this.destino
    }
    this.mapState.next(data);
  }

  checkDirecciones() {
    if (this.origenReady && this.destinoReady) {
      this.ubicacionState.next(true);
    } else {
      this.ubicacionState.next(false);
    }
  }
}
