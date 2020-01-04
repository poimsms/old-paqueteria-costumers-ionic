import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuController, ModalController, LoadingController, PopoverController, ToastController } from '@ionic/angular';
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
import { OtrosService } from 'src/app/services/otros.service';

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
  riderMarker: any;
  origenMarker: any;
  destinoMarker: any;
  gpsMarker: any;

  showTrip = false;

  distancia: number;

  riderPrevio = '';

  transporte = 'moto';
  texto_origen = 'Punto de recogida';
  texto_destino = 'Punto de entrega';

  distancia_excedida = false;

  isBicicleta = false;
  isMoto = false;
  isAuto = false;

  tiempoMoto: number;
  tiempoBici: number;
  tiempoAuto: number;
  tiempo: number;

  precioBici = 0;
  precioMoto = 0;
  precioAuto = 0;

  precioBici_promo = 0;
  precioMoto_promo = 0;
  precioAuto_promo = 0;

  showMoto: boolean;
  showBici: boolean;
  showAuto: boolean;

  pedidoActivo = false;

  pedido: any;
  rider: any;
  riders = [];

  usuario: any;
  isAuth: boolean;

  riderCoorsSub$: Subscription;
  mapaSub$: Subscription;
  riderSub$: Subscription;
  cuponSub$: Subscription;


  solicitudAceptada = false;

  vehiculo: string;
  precio: number;
  precio_promo: number;


  rutaReady = false;
  isEmpresa = false;
  loadingRider = false;

  timer: any;
  riderIndex = 0;

  graciasPorComprar = false;
  estaBuscandoRider = false;
  riderActivoEnBusqueda: string;
  ciudad: string;

  cuponData: any;

  isLoading = false;

  bodyNeerRider: any;
  counter = 0;

  imageURL = 'https://res.cloudinary.com/ddon9fx1n/image/upload/v1578060689/tools/ninja.svg';
  origenImg = 'https://res.cloudinary.com/ddon9fx1n/image/upload/v1570429346/tools/pin_origen.png';
  destinoImg = 'https://res.cloudinary.com/ddon9fx1n/image/upload/v1571242743/tools/pin_destino.png';
  gpsImg = 'https://res.cloudinary.com/ddon9fx1n/image/upload/v1574420400/tools/current.png';

  gpsIcon = {
    url: this.gpsImg,
    scaledSize: new google.maps.Size(60, 60),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(30, 30)
  };

  riderIcon = {
    url: this.imageURL,
    scaledSize: new google.maps.Size(40, 40),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 32)
  };

  origenIcon = {
    url: this.origenImg,
    scaledSize: new google.maps.Size(34, 34),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(16, 34)
  };

  destinoIcon = {
    url: this.destinoImg,
    scaledSize: new google.maps.Size(36, 36),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(4, 36)
  };

  no_riders_area = false;

  metodo_pago = '';

  evento = 0;
  tiempoLlegada = 0;

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
    private callNumber: CallNumber,
    private _otros: OtrosService,
    public popoverController: PopoverController,
    public toastController: ToastController
  ) {
    this.usuario = _auth.usuario;
    this.service = new google.maps.DistanceMatrixService();
    this.directionsDisplay = new google.maps.DirectionsRenderer({
      suppressMarkers: true, polylineOptions: {
        strokeColor: '#404042'
      }
    });
    this.directionsService = new google.maps.DirectionsService();
  }

  ngOnInit() {
    this._control.grand_GPS_permission().then((isGPS: any) => {

      this.cargarMapa();
      this.mapaSubscription();

      this.getRating();
      this.subToCodigoPromo();

      if (isGPS) {
        this.graficarMarcador(this._control.gpsCoors, 'gps');
      }

      this._otros.pedido$.subscribe(data => {
        this.pedidoActivo = false;
        this.pedidosHandler(data);
      });

      this._otros.getPedido('buscar_pedido_activo_mas_reciente');
    });
  }

  ngOnDestroy() {
    this.riderCoorsSub$ ? this.riderCoorsSub$.unsubscribe() : console.log();
    this.riderSub$ ? this.riderSub$.unsubscribe() : console.log();
    clearTimeout(this.timer);
    this._otros.pedido$.unsubscribe();
    this.mapaSub$.unsubscribe();
    this.cuponSub$.unsubscribe();
  }

  async presentRating(rating) {

    const modal = await this.popoverController.create({
      component: RatingComponent,
      componentProps: { rating }
    });

    await modal.present();
  }

  riderSubCoors(origen, destino) {
    this.riderCoorsSub$ = this._fire.getRiderCoors(this.rider._id).subscribe((riders: any) => {

      let rider = riders[0];
      this.evento = rider.evento;

      this.tiempoLlegada = rider.tiempoLlegada;

      if (rider.cliente == this.usuario._id) {

        const coors = { lat: rider.lat, lng: rider.lng };
        this.graficarMarcador(coors, 'rider');

        let bounds = new google.maps.LatLngBounds();

        bounds.extend(new google.maps.LatLng(rider.lat, rider.lng));
        bounds.extend(new google.maps.LatLng(origen.lat, origen.lng));
        bounds.extend(new google.maps.LatLng(destino.lat, destino.lng));

        this.map.fitBounds(bounds);
      }

      if (rider.cliente != this.usuario._id) {
        this.riderCoorsSub$.unsubscribe();

        // setTimeout(() => {
        //   this.resetMapa();
        //   this.toast_pedido_completado();
        // }, 2000);

        setTimeout(() => {
          this.resetMapa();
          this.getRating();
        }, 6000);
      }

    });
  }

  getRating() {
    this._data.getActiveRating(this.usuario._id).then((data: any) => {
      if (data.ok) {
        this.presentRating(data.rating);
      }
    });
  }

  subToCodigoPromo() {
    this.cuponSub$ = this._data.cuponData.subscribe(data => this.cuponData = data)
    this._data.getCuponActivo(this._auth.usuario._id);
  }

  pedidosHandler(data) {
    if (!data.ok) {
      return;
    }

    this.resetMapa();

    this.pedido = data.pedido;
    this.rider = data.pedido.rider;
    const origen = data.pedido.origen;
    const destino = data.pedido.destino;
    this.texto_origen = data.pedido.origen.direccion;
    this.texto_destino = data.pedido.destino.direccion;


    this.pedidoActivo = true;

    if (this._auth.usuario.role == 'EMPRESA_ROLE') {
      this.isEmpresa = true;
    }

    this.graficarRuta(origen, destino, data.pedido.vehiculo);
    this.riderSubCoors(origen, destino);
  }

  crearNuevoPedido() {
    this.riderCoorsSub$.unsubscribe();
    this.resetMapa();

    this.graficarMarcador(this._control.gpsCoors, 'gps');
    this.map.setCenter(this._control.gpsCoors);
  }

  iniciarPedido() {

    if (this.distancia_excedida) {
      return this.limite_excedido();
    }

    if (this.isBicicleta) {
      this.vehiculo = 'bicicleta';
      this.precio = this.precioBici;
      this.precio_promo = this.precioBici_promo;
    }

    if (this.isMoto) {
      this.vehiculo = 'moto';
      this.precio = this.precioMoto;
      this.precio_promo = this.precioMoto_promo;
    }

    if (this.isAuto) {
      this.vehiculo = 'auto';
      this.precio = this.precioAuto;
      this.precio_promo = this.precioAuto_promo;
    }

    this._control.estaBuscandoRider = true;
    this.buscarRider();
  }

  buscarRider() {

    this.loadingRider = true;

    if (this.no_riders_area) {
      return setTimeout(() => {
        this.loadingRider = false;
        this.no_riders_area = false;
        this.alert_area_sin_riders();
      }, 5 * 1000);
    }

    this._fire.riders_consultados = [];

    this.bodyNeerRider = {
      ciudad: this.ciudad,
      vehiculo: this.vehiculo,
      lat: this._control.origen.lat,
      lng: this._control.origen.lng
    };

    this.getNeerestRider();
  }

  getNeerestRider() {

    return new Promise((resolve, reject) => {

      this.counter++;

      if (this.counter == 4) {
        this.loadingRider = false;
        this.counter = 0;
        return this.alert_alta_demanda();
      }

      this._fire.getNeerestRider(this.bodyNeerRider).then((res: any) => {

        if (!res.ok) {
          return setTimeout(() => {
            this.loadingRider = false;
            this.alert_alta_demanda();
          }, 5 * 1000);
        }

        this.handShake(res.id);
        this.sleepRider(res.id);

        resolve();
      });
    });
  }

  sleepRider(id) {
    this.timer = setTimeout(async () => {

      this._fire.riders_consultados.push(id);

      this.getNeerestRider();

      this._fire.getRiderPromise(id).then((rider: any) => {
        // let rider = data[0];
        console.log(rider, 'riderr')
        if (rider.pedidos_perdidos >= 2) {

          this._fire.updateRider(id, 'rider', {
            cliente_activo: '',
            pagoPendiente: false,
            nuevaSolicitud: false,
            isOnline: false,
            pedidos_perdidos: 0
          });

          this._fire.updateRider(id, 'coors', {
            pagoPendiente: false,
            isOnline: false
          });
        } else {

          this._fire.updateRider(id, 'rider', {
            cliente_activo: '',
            pagoPendiente: false,
            nuevaSolicitud: false,
            pedidos_perdidos: rider.pedidos_perdidos + 1
          });

          this._fire.updateRider(id, 'coors', {
            pagoPendiente: false
          });

        }
      });

    }, 45 * 1000);
  }

  handShake(id) {
    this._fire.getRiderPromise(id).then((rider: any) => {

      if (rider.cliente_activo == '') {
        this._fire.updateRider(id, 'rider', { cliente_activo: this.usuario._id })
          .then(() => this.handShake(id));
      }

      if (rider.cliente_activo != this.usuario._id && rider.cliente_activo != '') {
        this.getNeerestRider();
      }

      if (rider.cliente_activo == this.usuario._id && rider.cliente_activo != '') {
        this.sendRiderRequest(id);
      }
    });
  }

  async sendRiderRequest(id) {

    this._fire.riders_consultados.push(id);

    await this._fire.updateRider(id, 'rider', {
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
          tiempo: this.tiempo,
          origen: this._control.origen,
          destino: this._control.destino,
          costo: this.precio
        }
      }
    });

    await this._fire.updateRider(id, 'coors', {
      pagoPendiente: true
    });

    this.subscribeToRider(id);
    this._fcm.sendPushNotification(id, 'nuevo-pedido');
  }

  subscribeToRider(id) {
    this.riderSub$ = this._fire.getRider(id).subscribe(data => {
      const riderFire: any = data[0];
      this.riderActivoEnBusqueda = riderFire.rider;

      if (riderFire.rechazadoId == this.usuario._id) {
        clearTimeout(this.timer);
        this.riderSub$.unsubscribe();
        this._fire.updateRider(id, 'rider', { rechazadoId: '', cliente_activo: '' })
        this.getNeerestRider();
      }

      if (riderFire.aceptadoId == this.usuario._id) {

        this.tiempoLlegada = riderFire.tiempoLlegada;

        console.log(this.tiempoLlegada, 'tiempoLlegada')


        clearTimeout(this.timer);
        this.riderSub$.unsubscribe();
        this.loadingRider = false;

        this._data.getOneRider(riderFire.rider).then(rider => {

          this.rider = rider;

          const data = {
            monto: this.precio,
            monto_promo: this.precio_promo,
            rider: this.rider,
            usuario: this.usuario,
            pedido: {
              origen: this._control.origen,
              destino: this._control.destino,
              distancia: this.distancia,
              tiempo: this.tiempo + this.tiempoLlegada
            }
          }

          this.openPayModal(data);
        });
      }

    });
  }

  async confirmar(payData) {

    const modal = await this.modalController.create({
      component: PayComponent,
      componentProps: { data: payData, cuponData: this.cuponData }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (!data) {
      return this.resetMapa();
    }

    if (data.state == 'PAGO_EXITOSO') {

      this.directionsDisplay.setMap(null);

      this.service = new google.maps.DistanceMatrixService();
      this.directionsDisplay = new google.maps.DirectionsRenderer({
        suppressMarkers: true, polylineOptions: {
          strokeColor: '#404042'
        }
      });
      this.directionsService = new google.maps.DirectionsService();

      this.cargarMapa();

      this.graciasPorComprar = true;

      setTimeout(() => {
        this.graciasPorComprar = false;
        this._otros.getPedido('buscar_pedido_activo_mas_reciente');
      }, 2000);

      this._data.getCuponActivo(this._auth.usuario._id);

      this._fcm.sendPushNotification(data.riderID, 'confirmacion-pedido');

    }

    if (data.state == 'PAGO_NO_REALIZADO') {
      this.alert_pedido_cancelado();
    }

    if (data.state == 'TIEMPO_EXPIRADO') {
      this.resetMapa();
    }
  }

  async openPayModal(payData) {

    const modal = await this.modalController.create({
      component: PayComponent,
      componentProps: { data: payData, cuponData: this.cuponData }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (!data) {
      return this.resetMapa();
    }

    if (data.state == 'PAGO_EXITOSO') {

      this.directionsDisplay.setMap(null);

      this.service = new google.maps.DistanceMatrixService();
      this.directionsDisplay = new google.maps.DirectionsRenderer({
        suppressMarkers: true, polylineOptions: {
          strokeColor: '#404042'
        }
      });
      this.directionsService = new google.maps.DirectionsService();

      this.cargarMapa();

      this.graciasPorComprar = true;

      setTimeout(() => {
        this.graciasPorComprar = false;
        this._otros.getPedido('buscar_pedido_activo_mas_reciente');
      }, 2000);

      this._data.getCuponActivo(this._auth.usuario._id);

      this._fcm.sendPushNotification(data.riderID, 'confirmacion-pedido');

    }

    if (data.state == 'PAGO_NO_REALIZADO') {
      this.alert_pedido_cancelado();
    }

    if (data.state == 'TIEMPO_EXPIRADO') {
      this.resetMapa();
    }
  }


  cancelarBusqueda() {

    this.riderSub$ ? this.riderSub$.unsubscribe() : console.log();

    clearTimeout(this.timer);

    this._fire.updateRider(this.riderActivoEnBusqueda, 'rider', { nuevaSolicitud: false, pagoPendiente: false, cliente_activo: '' });
    this._fire.updateRider(this.riderActivoEnBusqueda, 'coors', { pagoPendiente: false });

    this.loadingRider = false;
    this.resetMapaFromBusquedaCancelada();

    this.graficarMarcador(this._control.gpsCoors, 'gps');
    this.map.setCenter(this._control.gpsCoors);
  }

  cancelarViaje() {
    this.riderCoorsSub$.unsubscribe();
    this._fire.cancelarServicio(this.rider._id, this.pedido);
    this._fcm.sendPushNotification(this.rider._id, 'servicio-cancelado');
    this.resetMapa();
    this.graficarMarcador(this._control.gpsCoors, 'gps');
    this.map.setCenter(this._control.gpsCoors);
  }

  openMetodoPago() {
    this.router.navigateByUrl('metodo-pago');
  }

  openMapaPage(tipo) {

    if (this.pedidoActivo) {
      return;
    }

    this._control.tipo = tipo;
    this.router.navigateByUrl('mapa');
  }

  async openUbicaciones() {
    this.router.navigateByUrl('direcciones');
  }

  vehiculoToggle(tipo) {
    this.transporte = tipo;
    if (tipo == 'bicicleta') {
      this.isBicicleta = true;
      this.isMoto = false;
      this.isAuto = false;
    }
    if (tipo == 'moto') {
      this.isBicicleta = false;
      this.isMoto = true;
      this.isAuto = false;

    }
    if (tipo == 'auto') {
      this.isBicicleta = false;
      this.isMoto = false;
      this.isAuto = true;
    }
  }

  mapaSubscription() {

    this.mapaSub$ = this._control.mapState.subscribe((data: any) => {

      if (data.accion == 'calcular-ruta') {

        this.texto_origen = data.origen.direccion;
        this.texto_destino = data.destino.direccion;

        const origen = [data.origen.lat, data.destino.lng];

        const cobertura = this._fire.calcular_cobertura(origen);

        if (!cobertura.ok) {
          return this.alert_zona_no_cubierta();
        }

        this.isLoading = true;

        const origin1 = new google.maps.LatLng(data.origen.lat, data.origen.lng);
        const origin2 = new google.maps.LatLng(data.destino.lat, data.destino.lng);

        this.service.getDistanceMatrix(
          {
            origins: [origin1],
            destinations: [origin2],
            travelMode: 'DRIVING',
          }, async (response, status) => {

            const distancia = response.rows[0].elements[0].distance.value;
            const seconds = response.rows[0].elements[0].duration.value;

            this.distancia = distancia;

            this.ciudad = this._fire.calcular_ciudad(origen);
            this._control.ciudad = this.ciudad;

            const body = {
              ciudad: this.ciudad,
              lat: data.origen.lat,
              lng: data.origen.lng
            };

            const res: any = await this._fire.detectarRidersCercanos(body);

            if (!res.isMoto && !res.isBici && !res.isAuto) {
              this.no_riders_area = true;

              this.showBici = false;
              this.showMoto = true;
              this.showAuto = false;

              this.isMoto = true;
            }

            if (res.isMoto || res.isBici || res.isAuto) {
              this.no_riders_area = false;

              if (res.isBici) {
                this.isBicicleta = true;
              } else if (res.isMoto) {
                this.isMoto = true;
              } else {
                if (res.isAuto) {
                  this.isAuto = true;
                }
              }

              this.showMoto = res.isMoto;
              this.showBici = res.isBici;
              this.showAuto = res.isAuto;
            }

            if (distancia > 6000) {
              this.showBici = false
            }

            if (distancia > 40000 && this.ciudad != 'santiago') {
              this.distancia_excedida = true;
            }

            if (distancia > 70000 && this.ciudad == 'santiago' && this.isMoto) {
              this.distancia_excedida = true;
            }

            this.tiempoMoto = Math.round(seconds / 60 / 1.15);
            this.tiempoBici = Math.round(distancia / (13 * 1000) * 60);
            this.tiempoAuto = Math.round(seconds / 60 / 1.15);

            if (this.isMoto) {
              this.tiempo = this.tiempoMoto;
            }

            if (this.isBicicleta) {
              this.tiempo = this.tiempoBici;
            }

            if (this.isAuto) {
              this.tiempo = this.tiempoAuto;
            }

            // this.tiempo += this.tiempoLlegada;

            // console.log(this.tiempoLlegada, 'tiempoLlegada')

            // console.log(this.tiempo, 'tiempo')

            const tarifasBody = {
              distancia: this.distancia,
              ciudad: this.ciudad
            };

            const precios: any = await this._global.calcularPrecios(tarifasBody);

            this.precioMoto = precios.moto;
            this.precioBici = precios.bici;
            this.precioAuto = precios.auto;

            this.precioMoto_promo = precios.moto;
            this.precioBici_promo = precios.bici;
            this.precioAuto_promo = precios.auto;

            if (this.cuponData.ok) {
              this.precioMoto_promo = this._global.aplicar_codigo(this.cuponData, precios.moto);
              this.precioBici_promo = this._global.aplicar_codigo(this.cuponData, precios.bici);
              this.precioAuto_promo = this._global.aplicar_codigo(this.cuponData, precios.auto);
            }

            this.graficarRuta(data.origen, data.destino, 'Moto');



          });
      }
    });
  }

  cargarMapa() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: this._control.gpsCoors,
      zoom: 16,
      disableDefaultUI: true
    });

    this.directionsDisplay.setMap(this.map);
  }

  graficarRuta(origen, destino, vehiculo) {
    var self = this;
    this.rutaReady = true;
    this.isLoading = false;

    this.directionsDisplay.setMap(this.map);
    const origenLatLng = new google.maps.LatLng(origen.lat, origen.lng);
    const destinoLatLng = new google.maps.LatLng(destino.lat, destino.lng);

    let modo = '';

    vehiculo == 'Bicicleta' ? modo = 'WALKING' : modo = 'DRIVING';

    this.directionsService.route({
      origin: origenLatLng,
      destination: destinoLatLng,
      travelMode: modo,
    }, function (response, status) {
      self.directionsDisplay.setDirections(response);
    });

    if (this.gpsMarker) {
      this.gpsMarker.setMap(null);
    }

    this.graficarMarcador({ lat: origen.lat, lng: origen.lng }, 'origen');
    this.graficarMarcador({ lat: destino.lat, lng: destino.lng }, 'destino');




  }

  graficarMarcador(coors, tipo) {
    let data: any = {};
    data.position = coors;
    data.map = this.map;

    if (tipo == 'rider') {
      if (!this.markerReady) {

        data.animation = google.maps.Animation.DROP;
        data.icon = this.riderIcon;
        this.riderMarker = new google.maps.Marker(data);

        this.markerReady = true;
      } else {
        this.riderMarker.setPosition(coors);
      }
    }

    if (tipo == 'default') {
      new google.maps.Marker(data);
    }

    if (tipo == 'gps') {
      data.icon = this.gpsIcon;
      this.gpsMarker = new google.maps.Marker(data);
    }

    if (tipo == 'origen') {
      data.animation = google.maps.Animation.DROP;
      data.icon = this.origenIcon;
      this.origenMarker = new google.maps.Marker(data);
    }

    if (tipo == 'destino') {
      data.animation = google.maps.Animation.DROP;
      data.icon = this.destinoIcon;
      this.destinoMarker = new google.maps.Marker(data);
    }
  }

  borrarMarcadores() {

    if (this.riderMarker) {
      this.markerReady = false;
      this.riderMarker.setMap(null);
    }

    if (this.gpsMarker) {
      this.gpsMarker.setMap(null);
    }

    if (this.origenMarker) {
      this.origenMarker.setMap(null);
    }

    if (this.destinoMarker) {
      this.destinoMarker.setMap(null);
    }
  }

  async limite_excedido() {
    const alert = await this.alertController.create({
      header: 'Lo sentimos mucho!',
      message: 'Es mucha distancia para nuestros Riders',
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

  async limite_auto_excedido() {
    const alert = await this.alertController.create({
      header: 'Lo sentimos mucho!',
      message: 'Es mucha distancia para nuestros automóviles',
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

  async alert_pedido_cancelado() {
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

  async alert_area_sin_riders() {
    const alert = await this.alertController.create({
      header: 'No hay riders en el área',
      message: 'Enviaremos nuevos riders en unos momentos',
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

  async alert_zona_no_cubierta() {
    const alert = await this.alertController.create({
      header: 'Atención!',
      message: 'No hay cobertura en esta zona',
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

  async alert_alta_demanda() {
    const alert = await this.alertController.create({
      header: 'Lo sentimos mucho!',
      message: 'Debido a una alta demanda no podemos procesar nuevos pedidos. Inténtalo en unos minutos.',
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

  async alert_cancelacion() {
    const alert = await this.alertController.create({
      header: 'Cancelar viaje',
      message: '¿Quieres cancelar el viaje?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
          }
        },
        {
          text: 'Ok',
          handler: () => {
            this.cancelarViaje();
          }
        }
      ]
    });

    await alert.present();
  }

  async toast_pedido_completado() {
    const toast = await this.toastController.create({
      message: 'Pedido completado!',
      duration: 2500,
      position: 'middle'
    });
    toast.present();
  }

  openPage(page) {
    this._control.riderID = this.rider._id;
    this._control.pedido = this.pedido;
    this._control.pedidoID = this.pedido._id;

    this.router.navigateByUrl(page);
  }

  resetMapaFromBusquedaCancelada() {
    this.showTrip = false;
    this.isMoto = false;
    this.isBicicleta = false;
    this.isAuto = false;
    this.counter = 0;
    this.directionsDisplay.setMap(null);
    this.pedidoActivo = false;
    this.rider = null;
    this.riderIndex = 0;
    this.rutaReady = false;
    this._control.origenReady = false;
    this._control.destinoReady = false;
    this._control.rutaReady = false;
    this.borrarMarcadores();
  }

  resetMapa() {
    this.showTrip = false;
    this.isMoto = false;
    this.isBicicleta = false;
    this.isAuto = false;
    this.counter = 0;
    this.pedidoActivo = false;
    this.isEmpresa = false;
    this.directionsDisplay.setMap(null);
    this.rider = null;
    this.riderIndex = 0;
    this.rutaReady = false;
    this._control.origenReady = false;
    this._control.destinoReady = false;
    this._control.rutaReady = false;
    this.borrarMarcadores();
  }

  resetMapaAndRider() {
    this.distancia_excedida = false;
    this.showTrip = false;
    this.pedidoActivo = false;
    this.directionsDisplay.setMap(null);
    this.riderSub$.unsubscribe();
    this._fire.updateRider(this.rider._id, 'rider', { pagoPendiente: false, aceptadoId: '', cliente_activo: '' });
    this._fire.updateRider(this.rider._id, 'coors', { pagoPendiente: false });
    this.rider = null;
    this.riderIndex = 0;
    this.rutaReady = false;
    this._control.origenReady = false;
    this._control.destinoReady = false;
    this._control.rutaReady = false;
    this.borrarMarcadores();
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
    this.callNumber.callNumber(telefono, true)
      .then(res => console.log('Launched dialer!', res))
      .catch(err => console.log('Error launching dialer', err));
  }
}
