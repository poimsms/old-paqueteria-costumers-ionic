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

  origen = {
    direccion: '',
    lat: 0,
    lng: 0
  };

  destino = {
    direccion: '',
    lat: 0,
    lng: 0
  };

  isGPSLocation: boolean;


  centro: any = { lat: -33.263063, lng: -70.693496 };

  posicion: any;

  origenReady = false;
  destinoReady = false;
  rutaReady = false;
  estaBuscandoRider = false;

  metodo_pago = 'Efectivo';

  mis_lugares = {
    tipo: '',
    accion: '',
    id: ''
  };

  mapState = new Subject();
  ubicacionState = new Subject();

  gpsState = new Subject();

  gps_counter = 0;

  gpsCoors: any = { lat: -33.263063, lng: -70.693496 };

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

        console.log('ENTRO_PLUGIN')
        console.log(resp.coords.latitude, 'LAT')
        console.log(resp.coords.longitude, 'LNG')

        this.gpsCoors = {
          lat: resp.coords.latitude,
          lng: resp.coords.longitude
        };

        resolve(true)

      }).catch((error) => {

        console.log('PLUGIN_ERROR')
        console.log(error, 'ERROR_DESCRIPCION')


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
