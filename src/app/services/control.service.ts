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

    if (this._config.ENTORNO == 'DEV') {
      if (!this.platform.is('cordova')) {
        return;
      }
    }

    this.geolocation.getCurrentPosition().then((resp) => {

      this.gpsCoors = {
        lat: resp.coords.latitude,
        lng: resp.coords.longitude
      };

      setTimeout(() => {
        this.gpsState.next(true);
      }, 500);

    }).catch((error) => {

      if (this.gps_counter <= 1) {

        this.gps_counter++;

        setTimeout(() => {
          this.grand_GPS_permission();
        }, 1000);

      }
    });
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

  actualizarOrigen(posicion) {
    this.origen = posicion;
    this.origenReady = true;
    const data = {
      accion: 'actualizar-origen',
      origen: posicion
    }
    this.mapState.next(data);
  }

  actualizarDestino(posicion) {
    this.destino = posicion;
    this.destinoReady = true;
    const data = {
      accion: 'actualizar-destino',
      destino: posicion
    }
    this.mapState.next(data);
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
    console.log('aca vaae')
    if (this.origenReady && this.destinoReady) {
      console.log('pasoo')
      this.ubicacionState.next(true);
    } else {
      this.ubicacionState.next(false);

    }
  }
}
