import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { ControlService } from 'src/app/services/control.service';
import { Router } from '@angular/router';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DataService } from 'src/app/services/data.service';
import { PagarService } from 'src/app/services/pagar.service';
import { AuthService } from 'src/app/services/auth.service';
import { AlertController } from '@ionic/angular';
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
    public alertController: AlertController,
    private _mapa: MapaService
  ) {
    this.usuario = _auth.usuario;
    this.token = _auth.token;
    this.service = new google.maps.DistanceMatrixService();
    this.directionsDisplay = new google.maps.DirectionsRenderer();
    this.directionsService = new google.maps.DirectionsService();
  }

  ngOnInit() {
    this.cargarMapa();
    this.escucharCambiosDelMapa();
    this.getPedido();
  }

  getPedido() {
    this._data.obtener_pedido(this.usuario._id).then((data: any) => {

      if (data.ok) {
        this.rider = data.pedido.rider;
        const origen = data.pedido.origen;
        const destino = data.pedido.destino;
        this.confirmado = true;
        this.texto_origen = data.pedido.origen.direccion;
        this.texto_destino = data.pedido.destino.direccion;

        this.graficarRuta(origen, destino);
        const id = data.pedido.rider._id;

        this._data.getRiderCoorsFirebase(id).subscribe((res: any) => {
          // res.cliente == this.usuario._id
          if (res.cliente == this.usuario._id) {

            let coors = {
              lat: res[0].lat,
              lng: res[0].lng
            }

            if (!this.markerReady) {
              this.marker = new google.maps.Marker({
                position: coors,
                map: this.map,
                title: "Hello World!"
              });
              this.markerReady = true;
            } else {
              this.marker.setPosition(coors);
            }
          } else {
            // this.getPedido();
            // unsusbcribe()
          }
        });
      }

    });
  }


  confirmarPedido() {

    if (this.texto_origen == '¿Dónde retirar?' || this.texto_destino == '¿Dónde lo entregamos?') {
      return;
    }

    let vehiculo: string;
    let precio: number;

    if (this.isBicicleta) {
      vehiculo = 'bicicleta';
      precio = this.precioBici;
    } else if (this.isMoto) {
      vehiculo = 'moto';
      precio = this.precioMoto;
    } else {
      vehiculo = 'camioneta';
      precio = this.precioCamioneta;
    }

    const lat = this._control.origen.lat;
    const lng = this._control.origen.lng;

    this._mapa.getRiderMasCercano(vehiculo, lat, lng).then((resp: any) => {
      if (resp.ok) {

        this._mapa.updateRider(resp.rider._id, { isPay: true });


        if (this.usuario.tipo == 'empresa') {

          const body = {
            email: this.usuario.email,
            monto: precio,
            empresa: this.usuario._id
          }

          this._pagar.registrarPagoEmpresa(body).then((pago: any) => {

            const pedido = {
              precio: precio,
              distancia: this.distancia,
              metodoPago: 'Tarjeta',
              origen: this._control.origen,
              destino: this._control.destino,
              rider: resp.rider._id,
              cliente: this.usuario._id,
              tipo: this.usuario.tipo
            };

            this._data.crearPedido(pedido).then((pedido: any) => {
              this.getPedido();
              this._pagar.actualizarRegistroEmpresa(pago._id, { pedido: pedido._id });
            });
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
                distancia: this.distancia,
                metodoPago: 'Tarjeta',
                origen: this._control.origen,
                destino: this._control.destino,
                rider: resp.rider._id,
                cliente: this.usuario._id,
                tipo: this.usuario.tipo
              };

              this._data.crearPedido(pedido).then((pedido: any) => {
                this._mapa.updateRider(resp.rider._id, { actividad: 'activo', cliente: this.usuario._id });
                this._mapa.updatePedido(resp.rider._id, { nuevoPedido: true, pedido: pedido._id });
                this.getPedido();
              });
            }
          });
        }
      } else {
        this.presentAlert('Oops', 'No hay Riders disponibles en estos momentos. Intenta más tarde.')
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
  }

  selectTransport(tipo) {
    this.transporte = tipo;
    if (tipo == 'bicicleta') {
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

    const origenLatLng = new google.maps.LatLng(origen.lat, origen.lng);
    const destinoLatLng = new google.maps.LatLng(destino.lat, destino.lng);

    this.directionsService.route({
      origin: origenLatLng,
      destination: destinoLatLng,
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
      this.presentAlert('Imposible', 'Mucha distancia para una bicicleta')
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

  async presentAlert(titulo, mensaje) {
    const alert = await this.alertController.create({
      header: titulo,
      subHeader: 'Subtitle',
      message: mensaje,
      buttons: ['Aceptar']
    });

    await alert.present();
  }

  openMenu() {
    this.menu.enable(true, 'first');
    this.menu.open('first');
  }
}
