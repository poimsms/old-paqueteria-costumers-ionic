import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuController, ModalController, LoadingController } from '@ionic/angular';
import { ControlService } from 'src/app/services/control.service';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { AlertController } from '@ionic/angular';
import { FireService } from 'src/app/services/fire.service';
import { Subscription } from 'rxjs';
import { GlobalService } from 'src/app/services/global.service';
import { RatingComponent } from 'src/app/components/rating/rating.component';
import { PayComponent } from 'src/app/components/pay/pay.component';
import { FcmService } from 'src/app/services/fcm.service';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { MapaComponent } from 'src/app/components/mapa/mapa.component';

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

  riderPrevio = '';

  transporte = 'moto';
  texto_origen = '¿Dónde retiramos?';
  texto_destino = '¿Dónde entregamos?';

  distancia_excedida_moto = false;
  distancia_excedida_bici = false;

  isBicicleta = false;
  isMoto = false;

  pedidoActivo = false;

  pedido: any;
  rider: any;
  riders = [];

  usuario: any;
  isAuth: boolean;

  riderCoorsSub$: Subscription;
  riderSub$: Subscription;

  solicitudAceptada = false;

  vehiculo: string;
  precio: number;

  rutaReady = false;
  loadingRider = false;

  timer: any;
  riderIndex = 0;

  graciasPorComprar = false;
  estaBuscandoRider = false;
  riderActivoEnBusqueda: string;


  imageURL = 'https://res.cloudinary.com/ddon9fx1n/image/upload/v1555014076/tools/bike-parking.svg';

  image = {
    url: this.imageURL,
    // This marker is 20 pixels wide by 32 pixels high.
    // size: new google.maps.Size(100, 100),
    scaledSize: new google.maps.Size(40, 40),
    // The origin for this image is (0, 0).
    origin: new google.maps.Point(0, 0),
    // The anchor for this image is the base of the flagpole at (0, 32).
    anchor: new google.maps.Point(0, 32)
  };

  constructor(
    private menu: MenuController,
    private _control: ControlService,
    private router: Router,
    private _data: DataService,
    private _auth: AuthService,
    public alertController: AlertController,
    private _fire: FireService,
    private _global: GlobalService,
    public modalController: ModalController,
    public loadingController: LoadingController,
    private _fcm: FcmService,
    private callNumber: CallNumber
  ) {
    this.usuario = _auth.usuario;
    this.service = new google.maps.DistanceMatrixService();
    this.directionsDisplay = new google.maps.DirectionsRenderer();
    this.directionsService = new google.maps.DirectionsService();
  }

  // openMapaPage() {

  // }
  ngOnInit() {
    this.cargarMapa();
    this.escucharCambiosDelMapa();
    this.getPedido();
    this.getRating();
  }

  ngOnDestroy() {
    this.riderCoorsSub$ ? this.riderCoorsSub$.unsubscribe() : console.log();
    this.riderSub$ ? this.riderSub$.unsubscribe() : console.log();
    clearInterval(this.timer);
  }

  riderSubCoors() {
    this.riderCoorsSub$ = this._fire.getRiderCoors(this.rider._id).subscribe((res: any) => {

      if (res[0].cliente == this.usuario._id) {
        const coors = { lat: res[0].lat, lng: res[0].lng };
        this.graficarMarcador(coors);
      } else {
        this.riderCoorsSub$.unsubscribe();
        setTimeout(() => {
          this.getRating();
          this.resetMapa();
          this.marker.setMap(null);
        }, 6000);
      }

    });
  }

  getRating() {
    this._data.getActiveRating(this.usuario._id).then((data: any) => {
      if (data.ok) {
        this.openRatingModal(data);
      }
    });
  }

  getPedido() {
    this._data.getPedidoActivo(this.usuario._id).then((data: any) => {

      if (!data.hayPedido) {
        return;
      }

      this.pedido = data.pedido;
      this.rider = data.pedido.rider;
      const origen = data.pedido.origen;
      const destino = data.pedido.destino;
      this.texto_origen = data.pedido.origen.direccion;
      this.texto_destino = data.pedido.destino.direccion;
      this.pedidoActivo = true;

      // rastrear rider coors
      this.graficarRuta(origen, destino);
      this.riderSubCoors();
    });
  }


  iniciarPedido() {

    if (this.texto_origen == '¿Dónde retiramos?' || this.texto_destino == '¿Dónde entregamos?') {
      return;
    }

    if (this.isBicicleta && this.distancia_excedida_bici) {
      return;
    }

    if (this.isMoto && this.distancia_excedida_moto) {
      this.presentAlert('Distancia execida', 'La distancia supera nuestro limite')
      return;
    }

    if (this.isBicicleta) {
      this.vehiculo = 'bicicleta';
      this.precio = this.precioBici;
    } else {
      this.vehiculo = 'moto';
      this.precio = this.precioMoto;
    }

    this._control.estaBuscandoRider = true;
    this.buscarRider();
  }

  buscarRider() {

    this.loadingRider = true;

    const vehiculo = this.vehiculo;
    const lat = this._control.origen.lat;
    const lng = this._control.origen.lng;

    this._fire.getRiderMasCercano(vehiculo, lat, lng).then((resp: any) => {

      if (resp.hayRiders) {

        this.riderSub$ = this._fire.rider$.subscribe(riderFireArr => {
          const riderFire = riderFireArr[0];
          this.riderActivoEnBusqueda = riderFire.rider;

          if (riderFire.rechazadoId == this.usuario._id) {

            this._fire.updateRider(riderFire.rider, 'rider', { rechazadoId: '' });
            clearInterval(this.timer);
            this.sendRiderSolicitude(resp.riders, true);

          } else if (riderFire.aceptadoId == this.usuario._id) {

            this.riderSub$.unsubscribe();

            clearInterval(this.timer);

            this.loadingRider = false;

            this._data.getOneRider(riderFire.rider).then(rider => {

              this.rider = rider;

              const data = {
                monto: this.precio,
                rider: this.rider,
                usuario: this.usuario,
                pedido: {
                  origen: this._control.origen,
                  destino: this._control.destino,
                  distancia: this.distancia
                }
              }

              this.openPayModal(data);
            });

          } else {

            // Ver si rider aun está libre
            if (riderFire.actividad == 'disponible' && riderFire.isOnline &&
              !riderFire.pagoPendiente) {

              // Enviar solicitud
              this._fire.updateRider(riderFire.rider, 'rider', {
                nuevaSolicitud: true,
                pagoPendiente: true,
                created: new Date().getTime(),
                dataPedido: {
                  cliente: {
                    _id: this.usuario._id,
                    nombre: this.usuario.nombre,
                    img: this.usuario.img.url,
                    role: this.usuario.role
                  },
                  pedido: {
                    distancia: this.distancia,
                    origen: this._control.origen.direccion,
                    destino: this._control.destino.direccion,
                    costo: this.precio
                  }
                }
              });

              this._fire.updateRider(riderFire.rider, 'coors', {
                pagoPendiente: true
              });


              this._fcm.sendPushNotification(riderFire.rider, 'nuevo-pedido');

            }

            // Agregar cancelacion del pedido por parte del rider/cliente

          }
        });

        this.sendRiderSolicitude(resp.riders, false);

      } else {
        this.loadingRider = false;
        clearInterval(this.timer);
        this.presentAlert('No hay Riders disponibles', ' Intenta más tarde :)')
      }

    });
  }

  cancelarBusqueda() {
    this.riderSub$.unsubscribe();
    this._fire.updateRider(this.riderActivoEnBusqueda, 'rider', { nuevaSolicitud: false, pagoPendiente: false });
    this._fire.updateRider(this.riderActivoEnBusqueda, 'coors', { pagoPendiente: false });

    clearInterval(this.timer);
    this.loadingRider = false;
    this.resetMapaFromBusquedaCancelada();
  }

  sendRiderSolicitude(riders, next) {

    if (this.riderIndex == 0) {

      let id_init = riders[this.riderIndex];
      this._fire.rider_query$.next(id_init);
    }

    if (this.riderIndex == riders.length - 1) {

      let id_init = riders[this.riderIndex];
      this._fire.rider_query$.next(id_init);
    }

    if (next) {

      let id_next = riders[this.riderIndex];
      this._fire.rider_query$.next(id_next);
    }

    this.riderIndex++;

    this.timer = setTimeout(() => {
      if (this.riderIndex <= 4) {

        let id_previo = riders[this.riderIndex - 1];

        this.riderPrevio = id_previo;


        if (this.riderIndex < riders.length) {

          this._fire.updateRider(id_previo, 'rider', {
            pagoPendiente: false,
            nuevaSolicitud: false
          });

          this._fire.updateRider(id_previo, 'coors', {
            pagoPendiente: false
          });

          let id_actual = riders[this.riderIndex];
          this._fire.rider_query$.next(id_actual);

          this.sendRiderSolicitude(riders, false);

        } else {

          this.riderSub$.unsubscribe();

          this._fire.updateRider(id_previo, 'rider', {
            pagoPendiente: false,
            nuevaSolicitud: false
          });

          this._fire.updateRider(id_previo, 'coors', {
            pagoPendiente: false
          });

          clearInterval(this.timer);
          this.loadingRider = false;
          this.presentAlert_NoHayRiders();
        }

      } else {
        this.loadingRider = false;
        clearInterval(this.timer);
        this.presentAlert_NoHayRiders();
      }
    }, 25000);
  }

  openMapaPage(tipo) {

    if (this.pedidoActivo) {
      return;
    }

    this._control.coorsTipo = tipo;
    this.router.navigateByUrl('mapa');
  }


  async openMapaModal(tipo) {

    if (this.pedidoActivo) {
      return;
    }

    this._control.coorsTipo = tipo;
    const modal = await this.modalController.create({
      component: MapaComponent
    });

    await modal.present();
  }

  async openRatingModal(data) {
    const modal = await this.modalController.create({
      component: RatingComponent,
      componentProps: { data }
    });

    await modal.present();
  }

  async openPayModal(pago) {
    const modal = await this.modalController.create({
      component: PayComponent,
      componentProps: { pago }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data.pagoExitoso) {

      this.directionsDisplay.setMap(null);

      this.service = new google.maps.DistanceMatrixService();
      this.directionsDisplay = new google.maps.DirectionsRenderer();
      this.directionsService = new google.maps.DirectionsService();

      this.cargarMapa();

      this.graciasPorComprar = true;

      setTimeout(() => {
        this.graciasPorComprar = false;
        this.getPedido();
      }, 2000);

      this._fcm.sendPushNotification(data.riderID, 'confirmacion-pedido');

    } else {
      this.presentAlert_OrdenCancelada();
    }
  }

  vehiculoToggle(tipo) {
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
            self.rutaReady = true;
          });
      }

      if (data.accion == 'actualizar-origen') {
        this.rutaReady = false;
        this.texto_origen = data.origen.direccion;
      }

      if (data.accion == 'actualizar-destino') {
        this.rutaReady = false;
        this.texto_destino = data.destino.direccion;
      }
    });
  }

  cargarMapa() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: -33.444600, lng: -70.655585 },
      zoom: 14,
      disableDefaultUI: true
      // zoomControl: true
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
        icon: this.image,
        animation: google.maps.Animation.DROP
      });
      this.markerReady = true;
    } else {
      this.marker.setPosition(coors);
    }
  }

  calcularPrecio(distancia, transporte) {

    const bici = this._global.tarifas.bici;
    const moto = this._global.tarifas.moto;

    if (transporte == 'bicicleta' && distancia > bici.maxLimite) {
      this.distancia_excedida_bici = true;
    } else if (transporte == 'bicicleta') {
      this.distancia_excedida_bici = false;
      if (distancia < bici.limite) {
        this.precioBici = bici.minima;
      } else {
        const costo = bici.distancia * distancia / 1000 + bici.base;
        this.precioBici = Math.ceil(costo / 10) * 10;
      }
    }

    if (transporte == 'moto' && distancia > moto.maxLimite) {
      this.distancia_excedida_moto = true;
    } else if (transporte == 'moto') {
      this.distancia_excedida_moto = false;
      if (distancia < moto.limite) {
        this.precioMoto = moto.minima;
      } else {
        const costo = moto.distancia * distancia / 1000 + moto.base;
        this.precioMoto = Math.ceil(costo / 10) * 10;
      }
    }

  }

  async presentAlert(titulo, mensaje) {
    const alert = await this.alertController.create({
      header: titulo,
      subHeader: mensaje,
      buttons: ['Aceptar']
    });

    await alert.present();
  }

  async presentAlert_OrdenCancelada() {
    const alert = await this.alertController.create({
      header: 'Pedido cancelado',
      message: 'Defina un nuevo trayecto!',
      buttons: [
        {
          text: 'Ok',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            this.resetMapaAndRider();
          }
        }
      ]
    });

    await alert.present();
  }

  async presentAlert_NoHayRiders() {
    const alert = await this.alertController.create({
      header: 'No hay Riders disponibles',
      message: 'Intenta más tarde :)',
      buttons: [
        {
          text: 'Ok',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            this.resetMapa();
          }
        }
      ]
    });

    await alert.present();
  }

  resetMapaFromBusquedaCancelada() {
    this.directionsDisplay.setMap(null);
    this.pedidoActivo = false;
    this.rider = null;
    this.riderIndex = 0;
    this.rutaReady = false;
    this.texto_origen = '¿Dónde retiramos?';
    this.texto_destino = '¿Dónde entregamos?';
    this._control.origen = null;
    this._control.destino = null;
    this._control.origenReady = false;
    this._control.destinoReady = false;
    this._control.rutaReady = false;
  }

  resetMapa() {
    this.pedidoActivo = false;
    this.directionsDisplay.setMap(null);
    // this.marker.setMap(null);
    this.rider = null;
    this.riderIndex = 0;
    this.rutaReady = false;
    this.texto_origen = '¿Dónde retiramos?';
    this.texto_destino = '¿Dónde entregamos?';
    this._control.origen = null;
    this._control.destino = null;
    this._control.origenReady = false;
    this._control.destinoReady = false;
    this._control.rutaReady = false;
  }

  resetMapaAndRider() {
    this.pedidoActivo = false;
    this.directionsDisplay.setMap(null);
    this.riderSub$.unsubscribe();
    this._fire.updateRider(this.rider._id, 'rider', { pagoPendiente: false, aceptadoId: '' });
    this._fire.updateRider(this.rider._id, 'coors', { pagoPendiente: false });
    this.rider = null;
    this.riderIndex = 0;
    this.rutaReady = false;
    this.texto_origen = '¿Dónde retiramos?';
    this.texto_destino = '¿Dónde entregamos?';
    this._control.origen = null;
    this._control.destino = null;
    this._control.origenReady = false;
    this._control.destinoReady = false;
    this._control.rutaReady = false;
  }

  presentCompraExitosa() {
    this.graciasPorComprar = true;
    setTimeout(() => {
      this.graciasPorComprar = false;
    }, 2000);
  }

  openMenu() {
    this.menu.enable(true, 'first');
    this.menu.open('first');
  }

  callPhone(telefono) {
    this.callNumber.callNumber("9" + telefono, true)
      .then(res => console.log('Launched dialer!', res))
      .catch(err => console.log('Error launching dialer', err));
  }
}
