import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { ControlService } from 'src/app/services/control.service';
import { Router } from '@angular/router';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DataService } from 'src/app/services/data.service';
import { PagarService } from 'src/app/services/pagar.service';
import { AuthService } from 'src/app/services/auth.service';
import { MapaService } from 'src/app/services/mapa.service';
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
  markerReady: boolean;
  marker: any;

  distancia: number;

  precioBici = 2000;
  precioMoto = 2800;
  precioCamioneta = 3500;

  transporte = 'moto';
  texto_origen = '¿Dónde retirar?';
  texto_destino = '¿Dónde lo entregamos?';

  isBicicleta = false;
  isMoto = true;
  isCamioneta = false;

  confirmado = false;

  pedidos = [];
  pedido: any;

  origen: any;
  destino: any;
  rider: any;

  token: string;
  usuario: any;
  isAuth: boolean;

  constructor(
    private menu: MenuController,
    private _control: ControlService,
    private router: Router,
    public wsService: WebsocketService,
    private _data: DataService,
    private _pagar: PagarService,
    private _auth: AuthService,
    private _mapa: MapaService
  ) {

    this._auth.authState.subscribe((data: any) => {

      if (data.isAuth) {
        this.usuario = data.usuario;
        this.token = data.token;
        this.isAuth = true;
        this._auth.readFlowOrderStorage(this.token);

        if (this.usuario.tipo == 'empresa') {
          this.getPedidosEmpresa
        }

        this.service = new google.maps.DistanceMatrixService();
        this.directionsDisplay = new google.maps.DirectionsRenderer();
        this.directionsService = new google.maps.DirectionsService();

      } else {
        this.router.navigateByUrl('login');
      }

    });
  }

  ngOnInit() {

    this.cargarMapa();
    this.escucharCambiosDelMapa();
  }

  getPedidosEmpresa() {
    this._data.getPedidos(this.usuario._id).then((data: any) => {
      if (data.ok) {

        data.pedidos.forEach(pedido => {
          this.pedidos.push({
            isTracking: false,
            ...pedido
          });
        });

        this.pedidos[0].isTracking = true;

        this.rider = this.pedidos[0].rider;
        const origen = this.pedidos[0].origen;
        const destino = this.pedidos[0].destino;
        const id = this.pedidos[0].rider._id;
        this.confirmado = true;

        this.graficarRuta(origen, destino);

        this._mapa.getRiderCoors(id).subscribe(coors => {
          if (!this.markerReady) {
            this.marker = new google.maps.Marker({
              position: coors,
              title: "Hello World!"
            });
            this.marker.setMap(this.map);
          } else {
            this.marker.setPosition(coors);
          }
        });

      }
    });
  }

  getPedidoUsuario() {
    this._data.getPedidos(this.usuario._id).then((data: any) => {
      if (data.ok) {

        this.pedido = data.pedido;
        this.rider = this.pedido.rider;
        this.confirmado = true;

        this.graficarRuta(this.pedido.origen, this.pedido.destino);

        const id = this.rider._id;
        this._mapa.getRiderCoors(id).subscribe(coors => {

        });

      }
    });
  }

  confirmarPedido() {

    let tipo: string;
    let precio: number;

    if (this.isBicicleta) {
      tipo = 'bicicleta';
      precio = this.precioBici;
    } else if (this.isMoto) {
      tipo = 'moto';
      precio = this.precioMoto;
    } else {
      tipo = 'camioneta';
      precio = this.precioCamioneta;
    }

    const lat = this._control.origen.lat;
    const lng = this._control.origen.lng;

    this._data.buscarRider(tipo, lat, lng).then((resp: any) => {
      if (resp.ok) {

        if (this.usuario.tipo == 'empresa') {

          const body = {
            email: this.usuario.email,
            monto: precio,
            empresa: this.usuario._id
          }

          this._pagar.registrarPagoEmpresa(this.usuario._id, body).then((pago: any) => {
            if (pago.ok) {

              const pedido = {
                precio: precio,
                origin: this._control.origen,
                destino: this._control.destino,
                rider: resp.rider._id,
                cliente: this.usuario._id,
                tipo: this.usuario.tipo
              };

              this._data.crearPedido(pedido).then((pedido: any) => {
                this.rider = resp.rider;
                this.confirmado = true;
                this._pagar.actualizarRegistroEmpresa(pago._id, pedido._id);
              });
            }
          });

        } else {

          const body = {
            email: this.usuario.email,
            monto: precio,
            usuario: this.usuario._id
          }

          this._pagar.iniciarPagoUsuario(this.usuario._id, body).then((pago: any) => {
            if (pago.ok) {

              const pedido = {
                precio: precio,
                origin: this._control.origen,
                destino: this._control.destino,
                rider: resp.rider._id,
                cliente: this.usuario._id,
                tipo: this.usuario.tipo
              };

              this._data.crearPedido(pedido).then(() => {
                // graficas del mapa
                this.confirmado = true;
              });
            }
          });
        }
      } else {
        this.showAlert('No hay Riders disponibles en estos momentos. Intenta más tarde.')
      }
    });
  }

  cargarMapa() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: -34.9011, lng: -56.1645 },
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true
    });
    this.directionsDisplay.setMap(this.map);
  }

  openMapaPage(tipo) {

    this._control.coorsTipo = tipo;
    this.router.navigateByUrl('mapa');

    // if (this.usuario.tipo == 'empresa') {
    //   this._control.coorsTipo = tipo;
    //   this.router.navigateByUrl('mapa');
    // } else {
    //   if (this.confirmado) {
    //     Espere a que termine su pedido en progreso
    //   } else {
    //     this._control.coorsTipo = tipo;
    //     this.router.navigateByUrl('mapa');
    //   }
    // }  
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

  escucharCambiosDelMapa() {

    this._control.mapState.subscribe((data: any) => {

      let self = this;

      if (data.accion == 'calcular-ruta') {
        this.texto_origen = data.origen.direccion;
        this.texto_destino = data.destino.direccion;
        this.service.getDistanceMatrix(
          {
            origins: [data.origen.direccion],
            destinations: [data.destino.direccion],
            travelMode: 'DRIVING',
          }, function (response, status) {
            self.distancia = response.rows[0].elements[0].distance.value;
            self.graficarRuta(data.origen, data.destino);
            self.calcularPrecio(self.distancia, 'bicicleta');
            self.calcularPrecio(self.distancia, 'moto');
            self.calcularPrecio(self.distancia, 'camioneta');
          });
      }

      if (data.accion == 'actualizar-origen') {
        this.texto_origen = data.origen.direccion;
      }

      if (data.accion == 'actualizar-destino') {
        this.texto_destino = data.destino.direccion;
      }
    });
  }

  graficarRuta(origen, destino) {
    var self = this;
    this.directionsService.route({
      origin: origen.direccion,
      destination: destino.direccion,
      travelMode: 'DRIVING',
    }, function (response, status) {
      self.directionsDisplay.setDirections(response);
    });
  }

  calcularPrecio(distancia, transporte) {
    if (transporte == 'bicicleta' && distancia < 4000) {
      if (distancia < 1000) {
        this.precioBici = 2000;
      } else {
        this.precioBici = 1.0 * distancia + 1000;
      }
    }

    if (transporte == 'bicicleta' && distancia > 4000) {
      this.showAlert('Mucha distancia para una bicicleta')
    }

    if (transporte == 'moto') {
      if (distancia < 1000) {
        this.precioMoto = 2000;
      } else {
        this.precioMoto = 1.3 * distancia + 1000;
      }
    }

    if (transporte == 'camioneta') {
      if (distancia < 1000) {
        this.precioCamioneta = 2000;
      } else {
        this.precioCamioneta = 1.5 * distancia + 1000;
      }
    }

  }

  showAlert(texto) {

  }

  openMenu() {
    this.menu.enable(true, 'first');
    this.menu.open('first');
  }
}
