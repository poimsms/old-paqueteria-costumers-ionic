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
    this.getRating();
  }

  ngOnDestroy() {
    this.riderCoorsSub$ ? this.riderCoorsSub$.unsubscribe() : console.log();
    this.riderSub$ ? this.riderSub$.unsubscribe() : console.log();
    clearInterval(this.timer);
  }

  riderSub() {
    this.riderCoorsSub$ = this._fire.getRiderCoors(this.rider._id).subscribe((res: any) => {
  
      if (res[0].cliente == this.usuario._id) {
        const coors = { lat: res[0].lat, lng: res[0].lng };
        this.graficarMarcador(coors);
      } else {
        this.riderCoorsSub$.unsubscribe();
        setTimeout(() => {
          this.getRating();
          this.resetMapa();
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

      this.rider = data.pedido.rider;
      const origen = data.pedido.origen;
      const destino = data.pedido.destino;
      this.texto_origen = data.pedido.origen.direccion;
      this.texto_destino = data.pedido.destino.direccion;
      this.pedidoActivo = true;

      // rastrear rider coors
      this.graficarRuta(origen, destino);
      this.riderSub();
    });
  }


  iniciarPedido() {

    if (this.texto_origen == '¿Dónde retirar?' || this.texto_destino == '¿Dónde lo entregamos?') {
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
              !riderFire.pagoPendiente && this.riderPrevio != riderFire.rider) {

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
                    rol: this.usuario.rol
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

  sendRiderSolicitude(riders, next) {

    if (this.riderIndex == 0) {

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

        this._fire.updateRider(id_previo, 'rider', {
          pagoPendiente: false,
          nuevaSolicitud: false
        });

        this._fire.updateRider(id_previo, 'coors', {
          pagoPendiente: false
        });

        if (this.riderIndex < riders.length) {

          let id_actual = riders[this.riderIndex];
          this._fire.rider_query$.next(id_actual);

          this.sendRiderSolicitude(riders, false);

        } else {
          clearInterval(this.timer);
          this.loadingRider = false;
          this.presentAlert_NoHayRiders();
        }

      } else {
        this.loadingRider = false;
        clearInterval(this.timer);
        this.presentAlert_NoHayRiders();
      }
    }, 45000);
  }

  openMapaPage(tipo) {

    if (this.pedidoActivo) {
      return;
    }

    this._control.coorsTipo = tipo;
    this.router.navigateByUrl('mapa');
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
      this.presentCompraExitosa();
      this.getPedido();
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
        this.texto_origen = data.origen.direccion;
      }

      if (data.accion == 'actualizar-destino') {
        this.texto_destino = data.destino.direccion;
      }
    });
  }

  cargarMapa() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: -33.444600, lng: -70.655585 },
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
        map: this.map
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
      header: 'Órden cancelada',
      message: 'Defina un nuevo trayecto!',
      buttons: [
        {
          text: 'Aceptar',
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
          text: 'Aceptar',
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

  resetMapa() {
    this.pedidoActivo = false;
    this.directionsDisplay.setMap(null);
    this.riderSub$.unsubscribe();
    this.rider = null;
    this.riderIndex = 0;
    this.rutaReady = false;
    this.texto_origen = '¿Dónde retirar?';
    this.texto_destino = '¿Dónde lo entregamos?';
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
    this.texto_origen = '¿Dónde retirar?';
    this.texto_destino = '¿Dónde lo entregamos?';
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
}
