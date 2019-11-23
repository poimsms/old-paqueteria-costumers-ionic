import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { NavParams, ModalController } from '@ionic/angular';
import { Subject } from 'rxjs';

import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ControlService } from 'src/app/services/control.service';
import { LugaresComponent } from 'src/app/components/lugares/lugares.component';

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

  constructor(
    private _data: DataService,
    private _auth: AuthService,
    private zone: NgZone,
    public modalCtrl: ModalController,
    private router: Router,
    public _control: ControlService
  ) {
    this.GoogleAutocomplete = new google.maps.places.AutocompleteService();
    this.autocomplete = { input: '' };
    this.autocompleteItems = [];
    this.geocoder = new google.maps.Geocoder();

    this.getUbicaciones();
  }

  ngOnInit() {
    this._control.ubicacionState.subscribe(done => {

      if (this._control.origenReady) {
        this.inputOrigen = this._control.origen.direccion;
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

  ngOnDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
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
      this.itemsOrigen = [];
      return;
    }

    if (this.tipo == 'destino' && this.inputDestino == '') {
      this.itemsDestino = [];
      return;
    }

    let input = '';

    this.tipo == 'origen' ? input = this.inputOrigen : input = this.inputDestino;

    this.GoogleAutocomplete.getPlacePredictions({ input, componentRestrictions: { country: 'cl' } },
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

  clear(tipo) {

    if (tipo == 'origen') {
      this.inputOrigen = null;
      this.itemsOrigen = [];
      this._control.origenReady = false;
      this._control.origen = null;
    }

    if (tipo == 'destino') {
      this.inputDestino = null;
      this.itemsDestino = [];
      this._control.origenReady = false;
      this._control.destino = null;
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
        console.log('hmmm')
        this.oficina_direccion = data.ubicacion.oficina.direccion;
        console.log( this.oficina_direccion)
      }
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

  ubicacionHandler2(tipo) {

    this._data.getUbicaciones(this._auth.usuario._id).then((data: any) => {

      console.log(data, 'dataaa')
      if (!data.ok) {
        this._control.mis_lugares.tipo = tipo;
        this._control.mis_lugares.accion = 'crear';
        console.log('entroo')
        this.router.navigateByUrl('mis-lugares');
      }

      if (data.ubicacion[tipo].configurado) {
        console.log('pasooo')
        this._control.mis_lugares.tipo = tipo;
        this.setPositionFromUbicacion(tipo, data.ubicacion);
      } else {
        this._control.mis_lugares.tipo = tipo;
        this._control.mis_lugares.accion = 'editar';
        this._control.mis_lugares.id = data.ubicacion._id;
        this.router.navigateByUrl('mis-lugares');
      }

    });
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

  toggleMap(tipo) {
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
}
