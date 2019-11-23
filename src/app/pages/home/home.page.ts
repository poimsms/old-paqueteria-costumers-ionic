import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuController, ModalController, LoadingController, PopoverController } from '@ionic/angular';
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
import { UbicacionComponent } from 'src/app/components/ubicacion/ubicacion.component';

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

  distancia: number;
  precioBici = 0;
  precioMoto = 0;

  riderPrevio = '';

  transporte = 'moto';
  texto_origen = 'Punto de recogida';
  texto_origen_default = 'Punto de recogida';
  texto_destino = 'Punto de entrega';
  texto_destino_default = 'Punto de entrega';

  distancia_excedida_moto = false;
  distancia_excedida_bici = false;

  isBicicleta = false;
  isMoto = false;
  tiempoMoto = '';
  tiempoBici = '';

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

  imageURL = 'https://res.cloudinary.com/ddon9fx1n/image/upload/v1555014076/tools/bike-parking.svg';
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

  showMoto: boolean;
  showBici: boolean;

  no_riders_area = false;

  hola = 'HOOLA MUNDO'

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
    public popoverController: PopoverController
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
    this.cargarMapa();
    this.mapaSubscription();
    this.getRating();
    this.getCupon();
    this._otros.pedido$.subscribe(data => {
      this.pedidoActivo = false;
      this.pedidosHandler(data);
    });

    this._otros.getPedido('buscar_pedido_activo_mas_reciente');

    this._control.gpsState.subscribe(() => {
     this.graficarMarcador(this._control.gpsCoors, 'gps');
     this.map.setCenter(this._control.gpsCoors);
    });
  }

  ngOnDestroy() {
    this.riderCoorsSub$ ? this.riderCoorsSub$.unsubscribe() : console.log();
    this.riderSub$ ? this.riderSub$.unsubscribe() : console.log();
    clearTimeout(this.timer);
    this._otros.pedido$.unsubscribe();
  }

  async presentRating(rating) {

    const modal = await this.popoverController.create({
      component: RatingComponent,
      componentProps: { rating }
    });

    await modal.present();
  }

  riderSubCoors() {
    this.riderCoorsSub$ = this._fire.getRiderCoors(this.rider._id).subscribe((res: any) => {

      if (res[0].cliente == this.usuario._id) {

        const coors = { lat: res[0].lat, lng: res[0].lng };
        this.graficarMarcador(coors, 'rider');

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
        this.presentRating(data.rating);
      }
    });
  }

  getCupon() {
    this._data.cuponData.subscribe(data => this.cuponData = data)
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
    this.riderSubCoors();
  }

  crearNuevoPedido() {
    this.riderCoorsSub$.unsubscribe();
    this.resetMapa();
  }

  iniciarPedido() {

    if (this.texto_origen == this.texto_origen_default || this.texto_destino == this.texto_destino_default) {
      return;
    }

    if (this.isBicicleta && this.distancia_excedida_bici) {
      return;
    }

    if (this.isMoto && this.distancia_excedida_moto) {
      return this.limite_moto_excedido();
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

    if (this.no_riders_area) {
      return setTimeout(() => {
        this.loadingRider = false;
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

      this._fire.updateRider(id, 'rider', {
        cliente_activo: '',
        pagoPendiente: false,
        nuevaSolicitud: false
      });

      this._fire.updateRider(id, 'coors', {
        pagoPendiente: false
      });

    }, 25 * 1000);
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
        this.subscribeToRider(id);
      }
    });
  }

  subscribeToRider(id) {
    this.riderSub$ = this._fire.getRider(id).subscribe(data => {
      const riderFire: any = data[0];
      this.riderActivoEnBusqueda = riderFire.rider;

      if (riderFire.rechazadoId == this.usuario._id) {

        clearTimeout(this.timer);
        this.riderSub$.unsubscribe();
        this._fire.riders_consultados.push(id);

        this.getNeerestRider().then(() => {
          this._fire.updateRider(id, 'rider', { rechazadoId: '', cliente_activo: '' });
        });
      }

      if (riderFire.aceptadoId == this.usuario._id) {

        clearTimeout(this.timer);
        this.riderSub$.unsubscribe();
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
      }

    });

    this.sendRiderRequest(id);
  }

  sendRiderRequest(id) {
    this._fire.updateRider(id, 'rider', {
      nuevaSolicitud: true,
      pagoPendiente: true,
      created: new Date().getTime(),
      fase: 'esperando_confirmacion',
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

    this._fire.updateRider(id, 'coors', {
      pagoPendiente: true
    });

    this._fcm.sendPushNotification(id, 'nuevo-pedido');
  }

  cancelarBusqueda() {
    this.riderSub$.unsubscribe();
    clearTimeout(this.timer);

    this._fire.updateRider(this.riderActivoEnBusqueda, 'rider', { nuevaSolicitud: false, pagoPendiente: false, fase: '', cliente_activo: '' });
    this._fire.updateRider(this.riderActivoEnBusqueda, 'coors', { pagoPendiente: false });

    this.loadingRider = false;
    this.resetMapaFromBusquedaCancelada();
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
    // const modal = await this.modalController.create({
    //   component: UbicacionComponent
    // });

    // await modal.present();
  }

  async openPayModal(pago) {

    let tiempo = '';
    this.isMoto ? tiempo = this.tiempoMoto : tiempo = this.tiempoBici;

    const modal = await this.modalController.create({
      component: PayComponent,
      componentProps: { pago, cuponData: this.cuponData, tiempo }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data.pagoExitoso) {

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

      this.getCupon();

      this._fcm.sendPushNotification(data.riderID, 'confirmacion-pedido');

    } else {
      this.alert_pedido_cancelado();
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

  mapaSubscription() {

    this._control.mapState.subscribe((data: any) => {

      if (data.accion == 'calcular-ruta') {

        this.texto_origen = data.origen.direccion;
        this.texto_destino = data.destino.direccion;

        const origen = [data.origen.lat, data.destino.lng];

        const cobertura = this._fire.calcular_cobertura(origen);

        if (!cobertura.ok) {
          return this.alert_zona_no_cubierta();
        }

        this.isLoading = true;

        this.service.getDistanceMatrix(
          {
            origins: [data.origen.direccion],
            destinations: [data.destino.direccion],
            travelMode: 'DRIVING',
          }, async (response, status) => {

            const distancia = response.rows[0].elements[0].distance.value;
            const seconds = response.rows[0].elements[0].duration.value;

            this.distancia = distancia;

            this.ciudad = this._fire.calcular_ciudad(origen);

            const body = {
              ciudad: this.ciudad,
              lat: data.origen.lat,
              lng: data.origen.lng
            };

            const res: any = await this._fire.detectarRidersCercanos(body)

            if (!res.isMoto && !res.isBici) {
              this.no_riders_area = true;
            }

            this.showMoto = true;
            // this.showMoto = res.isMoto;
            this.showBici = res.isBici;

            if (distancia > 6000) {
              this.showBici = false
            }

            if (distancia > 70000) {
              this.distancia_excedida_moto = true;
            }

            this.tiempoMoto = `${Math.round(seconds / 60 / 1.15) + 3} min`;
            this.tiempoBici = `${Math.round(distancia / (13 * 1000) * 60) + 3} min`;

            const tarifasBody = {
              distancia: this.distancia,
              ciudad: this.ciudad
            };

            const precios: any = await this._global.calcularPrecios(tarifasBody);
            this.precioBici = precios.bici;
            this.precioMoto = precios.moto;

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

    // this.
    // this.graficarMarcador(this._control.gpsCoors, 'gps');
    // this.graficarMarcador({ lat: -33.444600, lng: -70.655585 }, 'default');
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
      let leg = response.routes[0].legs[0];

      self.graficarMarcador(leg.start_location, 'origen');
      self.graficarMarcador(leg.end_location, 'destino');
    });
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

  async limite_moto_excedido() {
    const alert = await this.alertController.create({
      header: 'Distancia execida',
      message: 'La distancia supera nuestro limite',
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
      message: 'Enviaremos nuevos riders en unos momentos.',
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
      message: 'No hay cobertura en esta zona.',
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
      message: 'Debido a una alta demanda no podemos procesar nuevos pedidos. Inténtalo de nuevo en unos minutos.',
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
    this.isMoto = false;
    this.isBicicleta = false;
    this.counter = 0;
    this.directionsDisplay.setMap(null);
    this.pedidoActivo = false;
    this.rider = null;
    this.riderIndex = 0;
    this.rutaReady = false;
    this.texto_origen = this.texto_origen_default;
    this.texto_destino = this.texto_destino_default;
    this._control.origen = null;
    this._control.destino = null;
    this._control.origenReady = false;
    this._control.destinoReady = false;
    this._control.rutaReady = false;
    this.borrarMarcadores();
  }

  resetMapa() {
    this.isMoto = false;
    this.isBicicleta = false;
    this.counter = 0;
    this.pedidoActivo = false;
    this.isEmpresa = false;
    this.directionsDisplay.setMap(null);
    this.rider = null;
    this.riderIndex = 0;
    this.rutaReady = false;
    this.texto_origen = this.texto_origen_default;
    this.texto_destino = this.texto_destino_default;
    this._control.origen = null;
    this._control.destino = null;
    this._control.origenReady = false;
    this._control.destinoReady = false;
    this._control.rutaReady = false;
    this.borrarMarcadores();
  }

  resetMapaAndRider() {
    this.pedidoActivo = false;
    this.directionsDisplay.setMap(null);
    this.riderSub$.unsubscribe();
    this._fire.updateRider(this.rider._id, 'rider', { pagoPendiente: false, aceptadoId: '', fase: '' });
    this._fire.updateRider(this.rider._id, 'coors', { pagoPendiente: false });
    this.rider = null;
    this.riderIndex = 0;
    this.rutaReady = false;
    this.texto_origen = this.texto_origen_default;
    this.texto_destino = this.texto_destino_default;
    this._control.origen = null;
    this._control.destino = null;
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
