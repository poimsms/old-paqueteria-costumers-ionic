import { Component, NgZone, OnInit } from '@angular/core';
import { ControlService } from 'src/app/services/control.service';
import { Router } from '@angular/router';
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
  markers = [];

  service: any;
  position: any = { ok: false };

  puerta = '';

  constructor(
    private _control: ControlService,
    private zone: NgZone,
    private router: Router
  ) {
    this.service = new google.maps.DistanceMatrixService();
    this.GoogleAutocomplete = new google.maps.places.AutocompleteService();
    this.autocomplete = { input: '' };
    this.autocompleteItems = [];
    this.geocoder = new google.maps.Geocoder;
    this.markers = [];
  }

  ngOnInit() {
    this.clean();
    this.map = new google.maps.Map(document.getElementById('map2'), {
      center: { lat: -34.9011, lng: -56.1645 },
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true
    });
  }

  clean() {
    if (this._control.coorsTipo == 'origen') {
      this._control.origen = {};
    } else {
      this._control.destino = {};
    }
  }

  close() {
    let data: any = {};

    if (this.puerta.length > 4) {
      data.puerta = this.puerta;
    }

    data = {
      direccion: this.position.address,
      lat: this.position.coors.lat,
      lng: this.position.coors.lng
    }

    if ( this._control.coorsTipo == 'origen') {
      this._control.actualizarOrigen(data);
    }

    if ( this._control.coorsTipo == 'destino') {
      this._control.actualizarDestino(data);
    }

    if (this._control.origenReady && this._control.destinoReady) {
      this._control.calcularRuta();
    }

    this.router.navigateByUrl('home');
  }

  updateSearchResults() {
    if (this.autocomplete.input == '') {
      this.autocompleteItems = [];
      return;
    }
    this.GoogleAutocomplete.getPlacePredictions({ input: this.autocomplete.input },
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
    this.clearMarkers();
    this.autocompleteItems = [];
    // this.autocomplete.input = item.description;

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
        let marker = new google.maps.Marker({
          position: results[0].geometry.location,
          map: this.map,
        });
        this.markers.push(marker);
        this.map.setCenter(results[0].geometry.location);
      } else {
        this.position = {
          ok: false
        };
      }
    })
  }

  clearMarkers() {
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].setMap(null);
    }
    this.markers = [];
  }
}

