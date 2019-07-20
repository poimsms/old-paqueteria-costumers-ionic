import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { ControlService } from 'src/app/services/control.service';
import { Router } from '@angular/router';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DataService } from 'src/app/services/data.service';
import { PagarService } from 'src/app/services/pagar.service';
declare var google: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  map: any;
  service: any;
  directionsDisplay: any;
  directionsService: any;

  distancia: number;

  precioBici = 2000;
  precioMoto = 2800;
  precioCamioneta = 3500;

  transporte = 'moto';
  textoRecoger = '¿Dónde retirar?';
  textoEntregar = '¿Dónde lo entregamos?';

  isBicicleta = false;
  isMoto = true;
  isCamioneta = false;

  confirmado = false;

  origen: any;
  destino: any;
  rider: any;
  user: any;

  constructor(
    private menu: MenuController,
    private _control: ControlService,
    private router: Router,
    public wsService: WebsocketService,
    private _data: DataService,
    private _pagar: PagarService
  ) {
    this.service = new google.maps.DistanceMatrixService();
    this.directionsDisplay = new google.maps.DirectionsRenderer();
    this.directionsService = new google.maps.DirectionsService();
  }

  ngOnInit() {
    this.cargarMapa();
    // this.escucharSockets();
    this.detectarRider();
  }

  detectarRider() {

  }

  confirmar() {

    const payload: any = {};

    if (this.isBicicleta) {
      payload.transporte = 'bici';
    }
    if (this.isMoto) {
      payload.transporte = 'moto';
    }
    if (this.isCamioneta) {
      payload.transporte = 'camioneta';
    }

    const lat = this._control.origen.lat;
    const lng = this._control.origen.lng;

    this._data.buscarRider(lat, lng).then((resp: any) => {
      if (resp.ok) {
        this._pagar.iniciarPago('id').then((pago: any) => {
          if (pago.ok) {
            this.confirmado = true;
            this.iniciarTrayecto(resp.rider)
          }
        });
      } else {
        this.showAlert('No hay Riders disponibles en estos momentos. Intentalo en 5 minutos.')
      }
    })
  }

  iniciarTrayecto(rider) {
    const pedido = {
      precio: 0,
      origin: this._control.origen,
      destino: this._control.destino,
      rider: rider._id,
      cliente: this.user._id
    }
    if (this.isBicicleta) {
      pedido.precio = this.precioBici;
    }
    if (this.isMoto) {
      pedido.precio = this.precioMoto;
    }
    if (this.isCamioneta) {
      pedido.precio = this.precioCamioneta;
    }
    this._data.crearPedido(pedido).then(() => {
      this.rider = rider;
    });
  }

  escucharSockets() {
    this.wsService.listen('rider-moviendose').subscribe(resp => {
      this.agregarMarcador(resp);
    });
  }

  agregarMarcador(marcador) {
  }

  cargarMapa() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: -34.9011, lng: -56.1645 },
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true
    });
    this.directionsDisplay.setMap(this.map);
    this.calcularDistancia();
  }

  openMenu() {
    this.menu.enable(true, 'first');
    this.menu.open('first');
  }

  openMapa(tipo) {
    this._control.coorsTipo = tipo;
    this.router.navigateByUrl('mapa');
  }

  selectTransport(tipo) {
    this.transporte = tipo;
    if (tipo == 'bici') {
      this.isBicicleta = true;
      this.isMoto = false;
      this.isCamioneta = false;
    }
    if (tipo == 'moto') {
      this.isBicicleta = false;
      this.isMoto = true;
      this.isCamioneta = false;
    }
    if (tipo == 'camioneta') {
      this.isBicicleta = false;
      this.isMoto = false;
      this.isCamioneta = true;
    }
  }

  calcularDistancia() {
    this._control.mapState.subscribe((data: any) => {
      
      let self = this;
      if (data.lugar == 'todo') {
        this.textoRecoger = data.origen.direccion;
        this.textoEntregar = data.destino.direccion;
        this.service.getDistanceMatrix(
          {
            origins: [data.origen.direccion],
            destinations: [data.destino.direccion],
            travelMode: 'DRIVING',
          }, function (response, status) {
            self.distancia = response.rows[0].elements[0].distance.value;
            self.setRoute(data.origen, data.destino);
            self.calcularPrecio(self.distancia, 'bici');
            self.calcularPrecio(self.distancia, 'moto');
            self.calcularPrecio(self.distancia, 'camioneta');
          });
      }
      if (data.lugar == 'origen') {
        this.textoRecoger = data.origen.direccion;
      }
      if (data.lugar == 'destino') {
        this.textoEntregar = data.destino.direccion;
      }
    });

  }

  setRoute(origen, destino) {
    var self = this;
    this.directionsService.route({
      origin: origen.direccion,
      destination: destino.direccion,
      travelMode: 'DRIVING',
    }, function (response, status) {
      self.directionsDisplay.setDirections(response);
    });
  }

  callback(response, status) {
    this.distancia = response.rows[0].elements[0].distance.value;
    this.calcularPrecio(this.distancia, 'bici');
    this.calcularPrecio(this.distancia, 'moto');
    this.calcularPrecio(this.distancia, 'camioneta');
  }

  calcularPrecio(distancia, transporte) {
    if (transporte == 'bici' && distancia < 4000) {
      if (distancia < 2000) {
        this.precioBici = 2000;
      } else {
        this.precioBici = 1.0 * distancia + 1000;
      }
    }

    if (transporte == 'bici' && distancia > 4000) {
      this.showAlert('Mucha distancia para una bici')
    }

    if (transporte == 'moto') {
      if (distancia < 2000) {
        this.precioMoto = 2000;
      } else {
        this.precioMoto = 1.3 * distancia + 1000;
      }
    }

    if (transporte == 'camioneta') {
      if (distancia < 2000) {
        this.precioCamioneta = 2000;
      } else {
        this.precioCamioneta = 1.5 * distancia + 1000;
      }
    }

  }

  showAlert(texto) {

  }
}
