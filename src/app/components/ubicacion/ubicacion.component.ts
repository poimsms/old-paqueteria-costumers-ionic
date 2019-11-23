import { Component, OnInit, NgZone, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { NavParams, ModalController } from '@ionic/angular';
import { Subject } from 'rxjs';

import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ControlService } from 'src/app/services/control.service';

declare var google: any;

@Component({
  selector: 'app-ubicacion',
  templateUrl: './ubicacion.component.html',
  styleUrls: ['./ubicacion.component.scss'],
})
export class UbicacionComponent implements OnInit, OnDestroy {

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

  @ViewChild('hola') hola:ElementRef;


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

    // this.inputOrigen = 'Ubicación actual';
        // this.inputDestino = 'Ubicación actual';
        // console.log(this.hola.nativeElement.value, 'hmm')

        // this.hola.nativeElement.value ='chaoo';

        // console.log(this.hola.nativeElement.value, 'hmm22')

  }

  ngOnInit() {

    setTimeout(() => {
      console.log(this.hola.nativeElement.value, 'hmm')

      this.hola.nativeElement.value ='chaoo';
  
      console.log(this.hola.nativeElement.value, 'hmm22')
    }, 100);

  
    this._control.ubicacionState.subscribe(done => {

      console.log(done)
      console.log(this._control.origenReady, this._control.destinoReady)
      if (this._control.origenReady) {
        console.log('entrooo?oring')

        this.inputOrigen = this._control.origen.direccion;
      }

      if (this._control.destinoReady) {
        setTimeout(() => {
          console.log('entrooo?dest')
          // this.inputDestino = this._control.destino.direccion;
          // this.inputDestino = 'Ubicación actual';
          this.zone.run(() => {
            this.inputDestino = 'Ubicación actual';
          });

          console.log(this.inputDestino)
        }, 100);
       
      }
      
      if (done) {
        setTimeout(() => {
          this._control.calcularRuta();
          this.modalCtrl.dismiss();
        }, 500);
      }

    });

  //   this._control.ubicacionState.subscribe((data:any) => {

  //     if (data.direccionOrigen) {
  //       this.inputOrigen = data.direccion;
  //   }

  //   if (data.direccionDestino) {
  //     this.inputOrigen = data.direccion;
  // }

  //   });



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

  toggleMap(tipo) {
    this.showOpenMap = false;
    this._control.tipo = tipo;
    setTimeout(() => {
      this.showOpenMap = true;
    }, 500);
  }

  openMapa() {
    this.showOpenMap = false;
    console.log('entrooo')
    this.modalCtrl.dismiss();
    this.router.navigateByUrl('mapa');
  }

  back() {
    this.modalCtrl.dismiss();
    this.router.navigateByUrl('home');
  }

  save2() {
    // if (this.position.ok) {

    //   const body: any = {};
    //   body.usuario = this._auth.usuario._id;

    //   body[this.tipo] = {
    //     configurado: true,
    //     direccion: this.position.address,
    //     lat: this.position.coors.lat,
    //     lng: this.position.coors.lng,
    //     puerta: this.puerta
    //   };

    //   this.isLoading = true;

    //   if (this.accion == 'crear') {
    //     this._data.guardarUbicacion(body).then((data: any) => {
    //       this.isLoading = false;
    //       this.modalCtrl.dismiss({ ok: true, tipo: this.tipo, ubicacion: data.ubicacion });
    //     });
    //   } else {
    //     this._data.editarUbicacion(this.id, body).then((data: any) => {
    //       this.isLoading = false;
    //       this.modalCtrl.dismiss({ ok: true, tipo: this.tipo, ubicacion: data.ubicacion });
    //     });
    //   }

    // } else {
    //   this.modalCtrl.dismiss({ ok: false });
    // }
  }



}
