import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { ControlService } from 'src/app/services/control.service';
import { ModalController, AlertController, Platform } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Router } from '@angular/router';
import { UbicacionComponent } from 'src/app/components/ubicacion/ubicacion.component';
declare var google: any;

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
})
export class MapaPage implements OnInit {

  map: any;
  autocomplete: any;
  geocoder: any;

  marker: any;

  service: any;
  position: any = { ok: false };

  center = { lat: -33.444600, lng: -70.655585 };
  lastCenter = { lat: -33.444600, lng: -70.655585 };
  address: string;

  interval: any;

  timer: any;

  image = {
    url: 'https://res.cloudinary.com/ddon9fx1n/image/upload/v1565228910/tools/pin_motocicleta.png',
    scaledSize: new google.maps.Size(40, 40),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 32)
  };

  constructor(
    public _control: ControlService,
    public modalController: ModalController,
    public alertController: AlertController,
    private geolocation: Geolocation,
    private router: Router,
    private platform: Platform
  ) {
    this.service = new google.maps.DistanceMatrixService();
    this.autocomplete = { input: '' };
    this.geocoder = new google.maps.Geocoder();
  }

  ngOnInit() {
    console.log('hmm')
    this.start_map();
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.timer) {
      clearTimeout(this.timer);
    }

    google.maps.event.clearListeners(this.map, 'center_changed');
    this.map = null;
  }

  start_map() {
    this.center = this._control.gpsCoors;    
    this.cargarMapa();
    this.position = {
      coors: this.center,
      ok: false,
      address: ''
    }
  }

  cargarMapa() {

    this.map = new google.maps.Map(document.getElementById('map2'), {
      center: this.center,
      zoom: 17,
      disableDefaultUI: true
    });

    console.log(this.center, 'cargoo mapa')

    this.codeLatLng(this.center);
    this.lastCenter = JSON.parse(JSON.stringify(this.center));

    this.interval = setInterval(() => {
      if ((this.lastCenter.lat != this.center.lat)) {
        console.log('calculo')
        this.codeLatLng(this.center);
        this.lastCenter = JSON.parse(JSON.stringify(this.center));
      }
    }, 1800);

    google.maps.event.addListener(this.map, 'center_changed', () => {

      console.log('escuchando')

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
      }
      
      if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
        this.position.address = 'Calle desconocida';
        this.autocomplete.input = 'Calle desconocida';
        this.position.ok = true;
      }
    });
  }

  back() {
    this.router.navigateByUrl('direcciones');
    // this.openModal();
  }

  save() {

    if (!this.position.ok) {
      return this.router.navigateByUrl('home');
    }

    const data = {
      direccion: this.position.address,
      lat: this.position.coors.lat,
      lng: this.position.coors.lng
    };

    this._control.posicion = data;

    if (this._control.tipo == 'origen') {
      this._control.origenReady = true;
      this._control.origen = data;
    }

    if (this._control.tipo == 'destino') {
      this._control.destinoReady = true;
      this._control.destino = data;

    }

    this._control.checkDirecciones();
    this.router.navigateByUrl('direcciones');
    // this.openModal();
  }

  async openModal() {
    const modal = await this.modalController.create({
      component: UbicacionComponent
    });
    await modal.present();
  }

  getMyLocation() {
    this.geolocation.getCurrentPosition().then((resp) => {
      this.map.setCenter({ lat: resp.coords.latitude, lng: resp.coords.longitude });
    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }

  setPositionFromUbicacion(tipo, ubicacion) {
    this.position.ok = true;
    this.position.address = ubicacion[tipo].direccion;
    this.position.coors.lat = ubicacion[tipo].lat;
    this.position.coors.lng = ubicacion[tipo].lng;
    this.map.setCenter({ lat: ubicacion[tipo].lat, lng: ubicacion[tipo].lng });
    this.autocomplete.input = ubicacion[tipo].direccion;
  }
}




