import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { ControlService } from 'src/app/services/control.service';
import { ModalController, AlertController } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
declare var google: any;

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss'],
})
export class MapaComponent implements OnInit, OnDestroy {

  map: any;
  GoogleAutocomplete: any;
  autocomplete: any;
  autocompleteItems = [];
  geocoder: any;

  marker: any;

  service: any;
  position: any = { ok: false };

  // puerta = 'Piso, puerta... (opcional)';
  puerta: string;
  markerReady = false;
  center = { lat: -33.444600, lng: -70.655585 };
  lastCenter = { lat: -33.444600, lng: -70.655585 };
  address: string;

  vista = 'nota';
  isBarraDeBusqueda = false;
  isCambiandoCentroPorBarra = false;

  interval: any;

  image = {
    url: 'https://res.cloudinary.com/ddon9fx1n/image/upload/v1565228910/tools/pin.png',
    scaledSize: new google.maps.Size(40, 40),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 32)
  };

  constructor(
    private _control: ControlService,
    private zone: NgZone,
    public modalCtrl: ModalController,
    public alertController: AlertController,
    private geolocation: Geolocation
  ) {
    this.service = new google.maps.DistanceMatrixService();
    this.GoogleAutocomplete = new google.maps.places.AutocompleteService();
    this.autocomplete = { input: '' };
    this.autocompleteItems = [];
    this.geocoder = new google.maps.Geocoder();
  }


  ngOnInit() {
    this.cargarMapa();
    this.position = {
      coors: this.center,
      ok: false,
      address: 'hoola'
    }
  }

  ngOnDestroy() {
    clearInterval(this.interval);
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

    this.graficarMarcador(this.center);

    if (this._control.origenReady && this._control.coorsTipo == 'origen') {
      this.codeLatLng(this.center);
      this.lastCenter = JSON.parse(JSON.stringify(this.center));
    }

    if (this._control.destinoReady && this._control.coorsTipo == 'destino') {
      this.codeLatLng(this.center);
      this.lastCenter = JSON.parse(JSON.stringify(this.center));
    }

    this.interval = setInterval(() => {
      if ((this.lastCenter.lat != this.center.lat) && !this.isBarraDeBusqueda) {
        this.codeLatLng(this.center);
        this.lastCenter = JSON.parse(JSON.stringify(this.center));
      }
    }, 1800);

    google.maps.event.addListener(this.map, 'center_changed', () => {

      if (this.isCambiandoCentroPorBarra) {
        this.isCambiandoCentroPorBarra = false;
      } else {
        this.isBarraDeBusqueda = false;
      }

      this.center.lat = this.map.getCenter().lat();
      this.center.lng = this.map.getCenter().lng();

      this.graficarMarcador(this.center);
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

  clean() {
    if (this._control.coorsTipo == 'origen') {
      // this._control.origen = {};
    } else {
      // this._control.destino = {};
    }
  }

  graficarMarcador(coors) {
    // if (!this.markerReady) {
    //   this.marker = new google.maps.Marker({
    //     position: coors,
    //     map: this.map,
    //     icon: this.image
    //   });
    //   this.markerReady = true;
    // } else {
    //   this.marker.setPosition(coors);
    // }
  }

  closeModal() {

    if (!this.position.ok) {
      return this.modalCtrl.dismiss();
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

    this.modalCtrl.dismiss();
  }

  updateSearchResults() {
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
    this.isCambiandoCentroPorBarra = true;

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
        this.graficarMarcador(results[0].geometry.location);
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
      // resp.coords.latitude
      // resp.coords.longitude
    }).catch((error) => {
      console.log('Error getting location', error);
    });
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


