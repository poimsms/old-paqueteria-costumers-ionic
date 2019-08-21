import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuController, ModalController, LoadingController } from '@ionic/angular';
import { ControlService } from 'src/app/services/control.service';
import { Router } from '@angular/router';
import { WebsocketService } from 'src/app/services/websocket.service';
import { DataService } from 'src/app/services/data.service';
import { PagarService } from 'src/app/services/pagar.service';
import { AuthService } from 'src/app/services/auth.service';
import { AlertController } from '@ionic/angular';
import { FireService } from 'src/app/services/fire.service';
import { Subscription, Subject } from 'rxjs';
import { GlobalService } from 'src/app/services/global.service';
import { RatingComponent } from 'src/app/components/rating/rating.component';

declare var google: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  map: any;
  service: any;
  directionsDisplay: any;
  directionsService: any;
  markerReady: boolean;
  marker: any;

  distancia: number;
  precioBici = 0;
  precioMoto = 0;

  transporte = 'moto';
  texto_origen = '¿Dónde retirar?';
  texto_destino = '¿Dónde lo entregamos?';

  distancia_excedida_moto = false;
  distancia_excedida_bici = false;

  isBicicleta = false;
  isMoto = true;

  pedidoActivo = false;

  pedido: any;
  rider: any;
  riders = [];

  token: string;
  usuario: any;
  isAuth: boolean;

  riderSubscription$: Subscription;
  actionsSubscripcion$: Subscription;
  actions$ = new Subject<any>();

  solicitudAceptada = false;
  coors = { lat: 0, lng: 0 };

  vehiculo: string;
  precio: number;
  payloadFLOW: any;
  pago = 'tarjeta';

  rutaReady = false;
  loadingRider = false;

  timer: any;
  riderIndex = 0;


  constructor(
    private menu: MenuController,
    private _control: ControlService,
    private router: Router,
    public wsService: WebsocketService,
    private _data: DataService,
    private _pagar: PagarService,
    private _auth: AuthService,
    public alertController: AlertController,
    private _fire: FireService,
    private _global: GlobalService,
    public modalController: ModalController,
    public loadingController: LoadingController
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
    this.actionsSub();
    this.getRatings();
  }

  ngOnDestroy() {
    this.actionsSubscripcion$.unsubscribe();
  }

  actionsSub() {
    this.actionsSubscripcion$ = this.actions$.subscribe(action => {
      if (action == 'buscar rider') {
        this.buscarRider();
      }

      if (action == 'subscribirse al rider') {
        this.riderSub();
      }

      if (action == 'cancelar subscripción del rider') {
        this.riderSub();
      }

      if (action == 'iniciar pago empresa') {        
        this.pagoEmpresa();
      }

      if (action == 'iniciar pago usuario') {
        this.pagoUsuario();
      }
    })
  }

  riderSub() {
    this.riderSubscription$ = this._fire.getRiderCoors(this.rider._id).subscribe((res: any) => {
      const coors = { lat: res[0].lat, lng: res[0].lng };
      this.graficarMarcador(coors);
    });
  }

  getRatings() {
    this._data.getActiveRating(this.usuario._id).then((data: any) => {
      if (data.ok) {
        this.openRatingModal(data);
      }
    });
  }


  getPedido() {
    this._data.getPedidoActivo(this.usuario._id).then((data: any) => {
     
      if (!data.ok) {
        return;
      }

      this.rider = data.pedido.rider;
      const origen = data.pedido.origen;
      const destino = data.pedido.destino;
      this.texto_origen = data.pedido.origen.direccion;
      this.texto_destino = data.pedido.destino.direccion;
      this.pedidoActivo = true;

      this.graficarRuta(origen, destino);
      this.actions$.next('subscribirse al rider');
    });
  }


  iniciarPedido() {

    if (this.texto_origen == '¿Dónde retirar?' || this.texto_destino == '¿Dónde lo entregamos?') {
      return;
    }

    if (this.isBicicleta) {
      this.vehiculo = 'bicicleta';
      this.precio = this.precioBici;
    } else {
      this.vehiculo = 'moto';
      this.precio = this.precioMoto;
    }

    this.coors.lat = this._control.origen.lat;
    this.coors.lng = this._control.origen.lng;
    this.actions$.next('buscar rider');
  }

  buscarRider() {

    this.loadingRider = true;

    const vehiculo = this.vehiculo;
    const lat = this.coors.lat;
    const lng = this.coors.lng;
    const precio = this.precio;

    console.log(vehiculo, lat, lng)

    this._fire.getRiderMasCercano(vehiculo, lat, lng).then((resp: any) => {
      console.log(resp, 'RESS MAS CERCANO')
      if (resp.hayRiders) {

      
        // this.sendRiderSolicitude();


        this._fire.rider$.subscribe(riderFire => {
          console.log(riderFire, 'riderFire')

          // Si rider aun está libre
          if (riderFire.actividad == 'disponible' && riderFire.isOnline && !riderFire.pagoPendiente) {
            console.log( 'PASOOOOOO2')

            // Enviar solicitud
            this._fire.updateRider(riderFire.rider, 'rider', {
              solicitud: true,
              pagoPendiente: true,
              cliente: this.usuario._id,
              created: new Date().getTime()
            });

          }

          // Si rider acepta solicitud
          if (riderFire.solicitudAceptada && riderFire.cliente == this.usuario._id) {
            console.log( 'PASOOOOOO3')

            clearInterval(this.timer);
            this.solicitudAceptada = true;

            this.loadingRider = false;

            this.payloadFLOW = {
              email: this.usuario.email,
              monto: precio,
              cliente: this.usuario._id,
              tipo: this.usuario.tipo
            }

            this._data.getOneRider(riderFire.rider).then(rider => {
              this.rider = rider;
              this.actions$.next(`iniciar pago ${this.usuario.rol}`);
            });
          }

          // Si rider rechaza solicitud
          if (!riderFire.solicitudAceptada && riderFire.cliente == this.usuario._id) {
            console.log( 'PASOOOOOO4')

            clearInterval(this.timer);
            this.sendRiderSolicitude();
          }

        });

      } else {
        this.loadingRider = false;
        this.presentAlert('Oops', 'No hay Riders disponibles en estos momentos. Intenta más tarde.')
      }


      this.riders = resp.riders;
      const id = this.riders[this.riderIndex];
      console.log(id, 'iiiiddd')
      this.riderIndex += 1;
      this._fire.rider_query$.next(id);
    });


  }

  sendRiderSolicitude() {
    this.timer = setTimeout(() => {
      if (!this.solicitudAceptada && this.riderIndex != 4) {
        const id = this.riders[this.riderIndex];
        console.log(id, 'iiiiddd')
        this._fire.rider_query$.next(id);
        this.riderIndex += 1;
        this.sendRiderSolicitude();
      } else {
        // rebuscar getRiderMasCercano()
      }
    }, 45000);
  }

  pagoEmpresa() {

    const pedido = {
      precio: this.precio,
      distancia: this.distancia,
      metodoPago: 'Tarjeta',
      origen: this._control.origen,
      destino: this._control.destino,
      rider: this.rider._id,
      cliente: this.usuario._id
    };

    this._data.crearPedido(pedido).then((pedido: any) => {

      this._fire.updateRider(this.rider._id, 'rider', {
        pagoPendiente: false,
        actividad: 'ocupado',
        pedido: pedido._id
      });

      this._fire.updateRider(this.rider._id, 'coors', {
        actividad: 'ocupado',
        pedido: pedido._id,
        cliente: this.usuario._id
      });
      
      this.getPedido();
    });
  }

  pagoUsuario() {

    if (this.pago == 'tarjeta') {
      this._pagar.pagarConFlow(this.usuario._id, this.payloadFLOW).then(pagoExitoso => {
        if (pagoExitoso) {

          const pedido = {
            precio: this.precio,
            distancia: this.distancia,
            metodoPago: 'tarjeta',
            origen: this._control.origen,
            destino: this._control.destino,
            rider: this.rider._id,
            cliente: this.usuario._id,
            entregado: false
          };

          this._data.crearPedido(pedido).then((pedido: any) => {

            this._fire.updateRider(this.rider._id, 'rider', {
              pagoPendiente: false,
              actividad: 'ocupado',
              pedido: pedido._id
            });

            this._fire.updateRider(this.rider._id, 'coors', {
              actividad: 'ocupado',
              pedido: pedido._id,
              cliente: this.usuario._id
            });

            this.getPedido();
          });
        }
      });

    }

    if (this.pago == 'efectivo') {

      const pedido = {
        precio: this.precio,
        distancia: this.distancia,
        metodoPago: 'efectivo',
        origen: this._control.origen,
        destino: this._control.destino,
        rider: this.rider._id,
        cliente: this.usuario._id,
        entregado: false
      };

      this._data.crearPedido(pedido).then((pedido: any) => {

        this._fire.updateRider(this.rider._id, 'rider', {
          pagoPendiente: false,
          actividad: 'ocupado',
          pedido: pedido._id
        });

        this._fire.updateRider(this.rider._id, 'coors', {
          actividad: 'ocupado',
          pedido: pedido._id,
          cliente: this.usuario._id
        });

        this.getPedido();
      });

    }

  }

  async openRatingModal(data) {
    const modal = await this.modalController.create({
      component: RatingComponent,
      componentProps: {data}
    });

    await modal.present();
  }

  openMapaPage(tipo) {
    this._control.coorsTipo = tipo;
    this.router.navigateByUrl('mapa');
  }

  transportToggle(tipo) {
    this.transporte = tipo;
    if (tipo == 'bicicleta') {
      this.isBicicleta = true;
      this.isMoto = false;
    }
    if (tipo == 'moto') {
      this.isBicicleta = false;
      this.isMoto = true;
    }
  }

  escucharCambiosDelMapa() {

    this._control.mapState.subscribe((data: any) => {

      let self = this;

      if (data.accion == 'calcular-ruta') {
        this.rutaReady = true;
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

  cargarMapa() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: -34.9011, lng: -56.1645 },
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true
    });
    this.directionsDisplay.setMap(this.map);
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

  graficarMarcador(coors) {
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
  }

  calcularPrecio(distancia, transporte) {

    const bici = this._global.tarifas.bici;
    const moto = this._global.tarifas.moto;

    // cosas raras aca
    if (transporte == 'bicicleta' && distancia > bici.maxLimite) {
      this.distancia_excedida_bici = true;
    } else if (transporte == 'bicicleta') {
      this.distancia_excedida_bici = false;
      if (distancia < bici.limite) {
        this.precioBici = bici.minima;
      } else {
        const costo = bici.distancia * distancia/1000 + bici.base;
        this.precioBici = Math.ceil(costo/10)*10;
      }
    }


    if (transporte == 'moto' && distancia > moto.maxLimite) {
      this.distancia_excedida_moto = true;
    } else if (transporte == 'moto') {
      this.distancia_excedida_moto = false;
      if (distancia < moto.limite) {
        this.precioMoto = moto.minima;
      } else {
        const costo = moto.distancia * distancia/1000 + moto.base;
        this.precioMoto = Math.ceil(costo/10)*10;
      }
    }

  }

  async presentAlert(titulo, mensaje) {
    const alert = await this.alertController.create({
      header: titulo,
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
