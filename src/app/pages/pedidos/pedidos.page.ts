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
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
})
export class PedidosPage implements OnInit {

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
  }

  ngOnDestroy() {
  }

}




