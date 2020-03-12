import { Component, OnInit, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { NavParams, ModalController, IonInput, Platform } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Subject } from 'rxjs';

import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ControlService } from 'src/app/services/control.service';
import { LugaresComponent } from 'src/app/components/lugares/lugares.component';
import { FireService } from 'src/app/services/fire.service';

declare var google: any;

@Component({
  selector: 'app-direcciones',
  templateUrl: './direcciones.page.html',
  styleUrls: ['./direcciones.page.scss'],
})
export class DireccionesPage implements OnInit, OnDestroy {

  GoogleAutocomplete: any;
  autocomplete: any;
  autocompleteItems = [];

  itemsDestino = [];
  itemsOrigen = [];
  inputDestino: string;
  inputOrigen: string;
  posicionOrigen: any;
  posicionDestino: any;

  showOpenMap = false;

  state = new Subject();

  geocoder: any;

  position: any = { ok: false };
  tipo: string;
  accion: string;
  id: string;
  puerta: string;
  google_flag = true;

  isLoading = false;
  timer: any;
  call_google_autocomplete = true;

  tipo_mapa: string;

  casa_direccion: string;
  oficina_direccion: string;

  ubicacionSub$: Subscription;

  isGPSLocation = true;

  location: any;

  @ViewChild('inputId') inputElement: IonInput;


  constructor(
    private _data: DataService,
    private _auth: AuthService,
    private zone: NgZone,
    public modalCtrl: ModalController,
    private router: Router,
    public _control: ControlService,
    private geolocation: Geolocation,
    private _fire: FireService,
    private platform: Platform
  ) {
    this.GoogleAutocomplete = new google.maps.places.AutocompleteService();
    this.autocomplete = { input: '' };
    this.autocompleteItems = [];
    this.geocoder = new google.maps.Geocoder();

    this._control.isGPSLocation = true;

    this.getUbicaciones();
    this.setUbicacionGPS();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.inputElement.setFocus();
      this.togglePinMap('destino');
    }, 400);
  }

  ngOnInit() {
    this.subToUbicacion();
    this.getWhatsapp();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.reset();
    this.ubicacionSub$.unsubscribe();
  }

  subToUbicacion() {
    this.ubicacionSub$ = this._control.ubicacionState.subscribe(done => {

      if (!this.isGPSLocation) {
        if (this._control.origenReady) {
          this.inputOrigen = this._control.origen.direccion;
        }
      }

      if (this._control.destinoReady) {
        this.inputDestino = this._control.destino.direccion;
      }

      if (done) {
        setTimeout(() => {
          this._control.calcularRuta();
          this.router.navigateByUrl('home');
        }, 500);
      }

    });
  }

  async getWhatsapp() {
    this.location = await this._data.getLocation(this._auth.usuario._id);
  }

  updateSearchResults(type) {
    this.tipo = type;

    if (!this.google_flag) {
      return;
    }

    this.google_flag = false;

    this.timer = setTimeout(() => {
      this.google_flag = true;
    }, 1500);

    if (this.tipo == 'origen' && this.inputOrigen == '') {
      this.isGPSLocation = false;
      this._control.isGPSLocation = false;
      this.itemsOrigen = [];
      return;
    }

    if (this.tipo == 'destino' && this.inputDestino == '') {
      this.itemsDestino = [];
      return;
    }

    let input = '';

    this.tipo == 'origen' ? input = this.inputOrigen : input = this.inputDestino;

    // var cityBounds = new google.maps.LatLngBounds(
    //   new google.maps.LatLng(-39.852979, -73.255130),
    //   new google.maps.LatLng(-39.817916, -73.292552),
    //   new google.maps.LatLng(-39.788639, -73.240711),
    //   new google.maps.LatLng(-39.772544, -73.191959),
    //   new google.maps.LatLng(-39.772544, -73.191959)
    //   );

    let options = {};

    let coors = [this._control.origen.lat, this._control.origen.lng]

    let ciudad = this._fire.calcular_ciudad(coors);

    if (ciudad == 'valdivia') {
      options = {
        input,
        componentRestrictions: { country: 'cl' },
        location: new google.maps.LatLng(-39.825958, -73.237449),
        radius: 8000
      }
    } else {
      options = {
        input,
        componentRestrictions: { country: 'cl' }
      }
    }

    this.GoogleAutocomplete.getPlacePredictions(options,
      (predictions, status) => {

        if (!predictions) {
          return;
        }

        if (this.tipo == 'origen') {
          this.itemsOrigen = [];
          this.zone.run(() => {
            predictions.forEach((prediction) => {
              this.itemsOrigen.push(prediction);
            });
          });
        }

        if (this.tipo == 'destino') {
          this.itemsDestino = [];
          this.zone.run(() => {
            predictions.forEach((prediction) => {
              this.itemsDestino.push(prediction);
            });
          });
        }

      });
  }

  selectSearchResult(item, type) {

    this.tipo = type;

    if (this.tipo == 'origen') {
      this.itemsOrigen = [];
      this.inputOrigen = item.description;
    }

    if (this.tipo == 'destino') {
      this.itemsDestino = [];
      this.inputDestino = item.description;
    }

    this.geocoder.geocode({ 'placeId': item.place_id }, (results, status) => {

      if (this.tipo == 'origen') {
        if (status === 'OK' && results[0]) {

          const data = {
            direccion: item.description,
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          };

          this._control.origen = data;
          this._control.origenReady = true;
        }
      }

      if (this.tipo == 'destino') {
        if (status === 'OK' && results[0]) {

          const data = {
            direccion: item.description,
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          };

          this._control.destino = data;
          this._control.destinoReady = true;
        }
      }

      this._control.checkDirecciones();
    });
  }

  async setUbicacionGPS() {
    this.inputOrigen = 'Ubicación actual';

    this.geolocation.getCurrentPosition().then(async (resp) => {
      console.log('acaa')
      let coors = {
        lat: resp.coords.latitude,
        lng: resp.coords.longitude
      };

      const direccion: any = await this.codeLatLng(coors);
      this._control.origenReady = true;
      this._control.origen.direccion = direccion;
      this._control.origen.lat = coors.lat;
      this._control.origen.lng = coors.lng;

    }).catch(async () => {

      let coors = this._control.gpsCoors;

      const direccion: any = await this.codeLatLng(coors);
      this._control.origenReady = true;
      this._control.origen.direccion = direccion;
      this._control.origen.lat = this._control.gpsCoors.lat;
      this._control.origen.lng = this._control.gpsCoors.lng;
    });
  }

  codeLatLng(coors) {
    return new Promise((resolve, reject) => {
      this.geocoder.geocode({
        'location': coors
      }, (results, status) => {

        if (status === google.maps.GeocoderStatus.OK) {
          if (results[1]) {
            resolve(results[1].formatted_address);
          } else {
            console.log('No results found');
          }
        }
        if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
          resolve('Calle desconocida');
        }
      });
    })
  }

  clear(tipo) {

    if (tipo == 'origen') {
      this.inputOrigen = null;
      this.itemsOrigen = [];
      this._control.origenReady = false;
    }

    if (tipo == 'destino') {
      this.inputDestino = null;
      this.itemsDestino = [];
      this._control.origenReady = false;
    }
  }

  getUbicaciones() {
    this._data.getUbicaciones(this._auth.usuario._id).then((data: any) => {

      if (!data.ok) {
        return;
      }

      if (data.ubicacion.casa.configurado) {
        this.casa_direccion = data.ubicacion.casa.direccion;
      }

      if (data.ubicacion.oficina.configurado) {
        this.oficina_direccion = data.ubicacion.oficina.direccion;
      }
    });
  }

  ubicacionHandler(tipo) {

    if (tipo == 'whatsapp') {

      if (this.location.activo) {
        this.setPositionFromWhatsapp();
      } else {
        this.launch_whatsapp();
      }

      return;
    }

    this._data.getUbicaciones(this._auth.usuario._id).then((data: any) => {

      if (!data.ok) {
        return this.openUbicacionModal(tipo, 'crear');
      }

      if (data.ubicacion[tipo].configurado) {
        this.setPositionFromUbicacion(tipo, data.ubicacion);
      } else {
        this.openUbicacionModal(tipo, 'editar', data.ubicacion._id);
      }
    });
  }

  launch_whatsapp() {

    let url = '';

    if (this.platform.is('cordova')) {
      url = `whatsapp://send?phone=56967618088&text=Hola!`;
    } else {
      url = `https://web.whatsapp.com/send?phone=56967618088&text=Hola!`;
    }

    window.open(url, '_blank');
  }

  async openUbicacionModal(tipo, accion, id?) {

    const modal = await this.modalCtrl.create({
      component: LugaresComponent,
      componentProps: { tipo, accion, id }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data.ok) {
      this.getUbicaciones();
    }
  }

  setPositionFromWhatsapp() {

    if (this._control.tipo == 'origen') {
      this._control.origen = this.location.destino;
      this._control.origenReady = true;
      this.inputOrigen = this.location.destino.direccion;
    }

    if (this._control.tipo == 'destino') {
      this._control.destino = this.location.destino;
      this._control.destinoReady = true;
      this.inputDestino = this.location.destino.direccion;
    }

    this._control.checkDirecciones();
  }

  setPositionFromUbicacion(tipo, ubicacion) {

    const data = {
      direccion: ubicacion[tipo].direccion,
      lat: ubicacion[tipo].lat,
      lng: ubicacion[tipo].lng
    };

    if (this._control.tipo == 'origen') {
      this._control.origen = data;
      this._control.origenReady = true;
      this.inputOrigen = ubicacion[tipo].direccion;
    }

    if (this._control.tipo == 'destino') {
      this._control.destino = data;
      this._control.destinoReady = true;
      this.inputDestino = ubicacion[tipo].direccion;
    }

    this._control.checkDirecciones();
  }

  togglePinMap(tipo) {
    this.showOpenMap = false;
    this._control.tipo = tipo;
    setTimeout(() => {
      this.showOpenMap = true;
    }, 500);
  }

  openMapa() {
    this.showOpenMap = false;
    this.router.navigateByUrl('mapa');
  }

  back() {
    this.router.navigateByUrl('home');
  }

  reset() {

    if (this._control.origenReady && this._control.destinoReady) {
      return;
    }

    this._control.origenReady = false;
    this._control.origen.direccion = '';
    this._control.origen.lat = 0;
    this._control.origen.lng = 0;

    this._control.destinoReady = false;
    this._control.destino.direccion = '';
    this._control.destino.lat = 0;
    this._control.destino.lng = 0;

  }
}
