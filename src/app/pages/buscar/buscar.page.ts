import { Component, OnInit, NgZone } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { NavParams, ModalController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
declare var google: any;

@Component({
  selector: 'app-buscar',
  templateUrl: './buscar.page.html',
  styleUrls: ['./buscar.page.scss'],
})
export class BuscarPage implements OnInit {

  GoogleAutocomplete: any;
  autocomplete: any;
  autocompleteItems = [];
  geocoder: any;

  position: any = { ok: false };
  tipo: string;
  accion: string;
  id: string;
  puerta: string;

  isLoading = false;

  constructor(
    private _data: DataService,
    private zone: NgZone,
    // private navParams: NavParams,
    public modalCtrl: ModalController,
    private _auth: AuthService
  ) {
    console.log('ENTROOOO')
    // this.tipo = this.navParams.get('tipo');
    // this.accion = this.navParams.get('accion');
    // this.id = this.navParams.get('id');

    this.GoogleAutocomplete = new google.maps.places.AutocompleteService();
    this.autocomplete = { input: '' };
    this.autocompleteItems = [];
    this.geocoder = new google.maps.Geocoder();
  }

  ngOnInit() { }

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
      } else {
        this.position = {
          ok: false
        };
      }
    });
  }

  closeModal() {
    if (this.position.ok) {

      const body: any = {};
      body.usuario = this._auth.usuario._id;

      body[this.tipo] = {
        configurado: true,
        direccion: this.position.address,
        lat: this.position.coors.lat,
        lng: this.position.coors.lng,
        puerta: this.puerta
      };

      this.isLoading = true;

      if (this.accion == 'crear') {
        this._data.guardarUbicacion(body).then((data: any) => {
          this.isLoading = false;
          this.modalCtrl.dismiss({ ok: true, tipo: this.tipo, ubicacion: data.ubicacion });
        });
      } else {
        this._data.editarUbicacion(this.id, body).then((data: any) => {
          this.isLoading = false;
          this.modalCtrl.dismiss({ ok: true, tipo: this.tipo, ubicacion: data.ubicacion });
        });
      }

    } else {
      this.modalCtrl.dismiss({ ok: false });
    }
  }

}
