import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { ControlService } from 'src/app/services/control.service';
import { ModalController, AlertController, Platform } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Router } from '@angular/router';
import { UbicacionComponent } from 'src/app/components/ubicacion/ubicacion.component';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
declare var google: any;

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
})
export class MapaPage implements OnInit {

  map: any;
  GoogleAutocomplete: any;
  autocomplete: any;
  autocompleteItems = [];
  geocoder: any;

  marker: any;

  service: any;
  position: any = { ok: false };

  puerta: string;
  center = { lat: -33.444600, lng: -70.655585 };
  lastCenter = { lat: -33.444600, lng: -70.655585 };
  address: string;

  isBarraDeBusqueda = false;
  cambiandoCentroFromBarra = false;

  isUbicacionGuardada = false;
  cambiandoCentroFromUbicacion = false;
  cambiandoBarraFromUbicacion = false;

  interval: any;

  timer: any;

  call_google_autocomplete = true;

  image = {
    url: 'https://res.cloudinary.com/ddon9fx1n/image/upload/v1565228910/tools/pin_motocicleta.png',
    scaledSize: new google.maps.Size(40, 40),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 32)
  };

  constructor(
    public _control: ControlService,
    private zone: NgZone,
    public modalCtrl: ModalController,
    public alertController: AlertController,
    private geolocation: Geolocation,
    private router: Router,
    private _data: DataService,
    private _auth: AuthService,
    private platform: Platform
  ) {
    this.service = new google.maps.DistanceMatrixService();
    this.GoogleAutocomplete = new google.maps.places.AutocompleteService();
    this.autocomplete = { input: '' };
    this.autocompleteItems = [];
    this.geocoder = new google.maps.Geocoder();
  }


  ngOnInit() {
    // this.cargarMapa();
    this.start_map();   
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  start_map() {
    if (this.platform.is("cordova")) {
      this.geolocation.getCurrentPosition().then((resp) => {
        this.center = { lat: resp.coords.latitude, lng: resp.coords.longitude };
        this.cargarMapa();
        this.position = {
          coors: this.center,
          ok: false,
          address: ''
        }
      }).catch((error) => {
        this.router.navigateByUrl('home');
      });
    } else {
      setTimeout(() => {
        this.center = { lat: -33.444600, lng: -70.655585 };
        this.lastCenter = { lat: -33.444700, lng: -70.655700 };
        this.cargarMapa();
        this.position = {
          coors: this.center,
          ok: false,
          address: ''
        }
      }, 500);
    }
  }

  cargarMapa() {

    if (this._control.origenReady && this._control.coorsTipo == 'origen') {
      this.center = { lat: this._control.origen.lat, lng: this._control.origen.lng }
    }

    if (this._control.destino && this._control.coorsTipo == 'destino') {
      this.center = { lat: this._control.destino.lat, lng: this._control.destino.lng }
    }

    this.map = new google.maps.Map(document.getElementById('map2'), {
      center: this.center,
      zoom: 15,
      disableDefaultUI: true
    });

    if (this._control.origenReady && this._control.coorsTipo == 'origen') {
      this.codeLatLng(this.center);
      this.lastCenter = JSON.parse(JSON.stringify(this.center));
    }

    if (this._control.destinoReady && this._control.coorsTipo == 'destino') {
      this.codeLatLng(this.center);
      this.lastCenter = JSON.parse(JSON.stringify(this.center));
    }

    this.interval = setInterval(() => {
      if ((this.lastCenter.lat != this.center.lat) && !this.isBarraDeBusqueda && !this.isUbicacionGuardada) {
        this.codeLatLng(this.center);
        this.lastCenter = JSON.parse(JSON.stringify(this.center));
      }
    }, 1800);

    google.maps.event.addListener(this.map, 'center_changed', () => {

      if (this.cambiandoCentroFromBarra) {
        this.cambiandoCentroFromBarra = false;
      } else {
        this.isBarraDeBusqueda = false;
      }

      if (this.cambiandoCentroFromUbicacion) {
        this.cambiandoCentroFromUbicacion = false;
      } else {
        this.isUbicacionGuardada = false;
      }

      this.center.lat = this.map.getCenter().lat();
      this.center.lng = this.map.getCenter().lng();

      this.position.coors.lat = this.center.lat;
      this.position.coors.lng = this.center.lng;
    });
  }

  codeLatLng(coors) {
    this.geocoder.geocode({
      'location': coors
    }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK) {
        if (results[1]) {

          this.position.address = results[1].formatted_address;
          this.autocomplete.input = this.position.address;
          this.position.ok = true;

        } else {
          console.log('No results found');
        }
      } else {
        console.log('Geocoder failed due to: ' + status);
      }
    });
  }

  back() {
    this.router.navigateByUrl('home');
  }

  closeModal() {

    if (!this.position.ok) {
      return this.router.navigateByUrl('home');
    }

    if (this.puerta == 'Piso, puerta... (opcional)') {
      this.puerta = '';
    }

    const data = {
      direccion: this.position.address,
      lat: this.position.coors.lat,
      lng: this.position.coors.lng,
      puerta: this.puerta
    }

    if (this._control.coorsTipo == 'origen') {
      this._control.actualizarOrigen(data);
    }

    if (this._control.coorsTipo == 'destino') {
      this._control.actualizarDestino(data);
    }

    if (this._control.origenReady && this._control.destinoReady) {
      this._control.calcularRuta();
    }

    this.router.navigateByUrl('home');
  }

  updateSearchResults() {

    if (this.call_google_autocomplete) {

      this.timer = setTimeout(() => {
        this.call_google_autocomplete = true;
      }, 2400);

    } else {
      return;
    }

    this.call_google_autocomplete = false;

    if (this.cambiandoBarraFromUbicacion) {
      return this.cambiandoBarraFromUbicacion = false;
    }

    if (this.autocomplete.input == '') {
      this.autocompleteItems = [];
      return;
    }

    this.GoogleAutocomplete.getPlacePredictions({ input: this.autocomplete.input, componentRestrictions: { country: 'cl' } },
      (predictions, status) => {
        this.autocompleteItems = [];
        this.zone.run(() => {
          predictions.forEach((prediction) => {
            this.autocompleteItems.push(prediction);
          });
        });
      });
  }

  selectSearchResult(item) {
    this.autocompleteItems = [];
    this.autocomplete.input = item.description;

    this.isBarraDeBusqueda = true;
    this.cambiandoCentroFromBarra = true;

    this.geocoder.geocode({ 'placeId': item.place_id }, (results, status) => {
      if (status === 'OK' && results[0]) {
        this.position = {
          ok: true,
          address: item.description,
          coors: {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          }
        };
        this.map.setCenter(results[0].geometry.location);
      } else {
        this.position = {
          ok: false
        };
      }
    });
  }

  getMyLocation() {
    this.geolocation.getCurrentPosition().then((resp) => {
      this.map.setCenter({ lat: resp.coords.latitude, lng: resp.coords.longitude });
    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }

  ubicacionHandler(tipo) {

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

  setPositionFromUbicacion(tipo, ubicacion) {
    this.isUbicacionGuardada = true;
    this.cambiandoCentroFromUbicacion = true;
    this.cambiandoBarraFromUbicacion = true;
    this.position.ok = true;
    this.position.address = ubicacion[tipo].direccion;
    this.position.coors.lat = ubicacion[tipo].lat;
    this.position.coors.lng = ubicacion[tipo].lng;
    this.map.setCenter({ lat: ubicacion[tipo].lat, lng: ubicacion[tipo].lng });
    this.autocomplete.input = ubicacion[tipo].direccion;
  }

  async openUbicacionModal(tipo, accion, id?) {

    const modal = await this.modalCtrl.create({
      component: UbicacionComponent,
      componentProps: { tipo, accion, id }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data.ok) {
      this.setPositionFromUbicacion(data.tipo, data.ubicacion);
    }
  }

  async presentAlertPrompt() {
    const alert = await this.alertController.create({
      header: 'Añade detalles!',
      inputs: [
        {
          name: 'puerta',
          type: 'text',
          placeholder: this.puerta
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Ok',
          handler: (data) => {
            this.puerta = data.puerta;
          }
        }
      ]
    });

    await alert.present();
  }
}




