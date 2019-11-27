import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { take, switchMap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class FireService {

  rider_query$ = new Subject();
  rider$: Observable<any>;

  distanceMatrix = [];
  ids = [];
  riders_consultados = [];

  constructor(
    private db: AngularFirestore,
    public toastController: ToastController
  ) { }

  getRider(id) {
    return this.db.collection('riders', ref => ref.where('rider', '==', id)).valueChanges();
  }

  getRiderCoors(id) {
    return this.db.collection('riders_coors', ref => ref.where('rider', '==', id)).valueChanges();
  }

  updateRider(id, tipo, data) {
    if (tipo == 'coors') {
      return this.db.doc('riders_coors/' + id).update(data);
    } else {
      return this.db.doc('riders/' + id).update(data);
    }
  }

  async cancelarServicio(id) {
    const rider: any = await this.getRiderPromise(id);
    if (rider.fase == 'navegando_al_origen') {

      const data_rider = {
        actividad: 'disponible',
        cliente_activo: '',
        pedido: '',
        servicio_cancelado: true
      }

      const data_coors = {
        actividad: 'disponible',
        cliente: ''
      }

      this.updateRider(id, 'rider', data_rider);
      this.updateRider(id, 'coors', data_coors);
    }

    if (rider.fase != 'navegando_al_origen') {

      const data_rider = {
        bloqueado: true,
        servicio_cancelado: true
      };

      this.updateRider(id, 'rider', data_rider);
      this.toast_devolucion_paquete();
    }
  }

  getRiderPromise(id) {
    return new Promise((resolve, reject) => {
      this.db.collection('riders', ref =>
        ref.where('rider', '==', id))
        .valueChanges().pipe(take(1)).subscribe(riders => {
          resolve(riders[0]);
        });
    });
  }


  detectarRidersCercanos(body) {

    const { ciudad, lat, lng } = body;

    return new Promise((resolve, reject) => {
      this.db.collection('riders_coors', ref =>
        ref.where('isOnline', '==', true)
          .where('isActive', '==', true)
          .where('ciudad', '==', ciudad)
          .where('pagoPendiente', '==', false)
          .where('actividad', '==', 'disponible'))
        .valueChanges().pipe(take(1)).subscribe((riders: any) => {

          if (riders.length == 0) {
            return resolve({ isMoto: false, isBici: false });
          }

          const data = this.filtro_dos(riders, lat, lng);

          resolve({ isMoto: data.isMoto, isBici: data.isBici });
        });
    });
  }

  getNeerestRider(body) {

    const { vehiculo, ciudad, lat, lng } = body;

    console.log(body, 'body neer')

    console.log(this.riders_consultados, 'consultadooos')
    return new Promise((resolve, reject) => {
      this.db.collection('riders_coors', ref =>
        ref.where('isOnline', '==', true)
          .where('ciudad', '==', ciudad)
          .where('isActive', '==', true)
          .where('pagoPendiente', '==', false)
          .where('actividad', '==', 'disponible')
          .where('vehiculo', '==', vehiculo))
        .valueChanges().pipe(take(1)).subscribe((riders: any) => {
          console.log(riders, 'resp riderss fire')
          if (riders.length == 0) {
            return resolve({ isMoto: false, isBici: false });
          }

          console.log('keep')
          const riders_zero = this.filtro_zero(riders);
          console.log(riders_zero, 'zero')

          const data = this.filtro_uno(riders_zero, lat, lng, vehiculo);
          console.log(data, 'uno')

          if (!data.ok) {
            return resolve({ ok: false });
          }

          const id = this.riders_loop(data.riders, lat, lng);
          console.log(id, 'id')

          resolve({ ok: true, id });
        });
    });
  }

  filtro_zero(riders_db) {

    const riders_disponibles = [];

    if (this.riders_consultados.length == 0) {
      return riders_db;
    }

    riders_db.forEach(rider => {
      let flag = true;

      this.riders_consultados.forEach(id => {
        if (rider.rider == id) {
          flag = false;
        }
      });

      if (flag) {
        riders_disponibles.push(rider);
      }
    });

    return riders_disponibles;
  }


  filtro_uno(riders, lat, lng, vehiculo) {

    if (riders.length == 0) {
      return { ok: false };
    }

    const riders_moto = [];
    const riders_bici = [];

    riders.forEach(rider => {

      const riderCoors = [rider.lat, rider.lng];
      const destinoCoors = [lat, lng];

      const distance = this.haversineDistance(riderCoors, destinoCoors);

      if (distance < 6000 && rider.vehiculo == 'moto') {
        riders_moto.push(rider);
      }
      if (distance < 1500 && rider.vehiculo == 'bicicleta') {
        riders_bici.push(rider);
      }
    });

    let ok = false;
    let riders_filtrados = [];

    if (vehiculo == 'moto' && riders_moto.length > 0) {
      ok = true;
      riders_filtrados = riders_moto;
    }

    if (vehiculo == 'bicicleta' && riders_bici.length > 0) {
      ok = true;
      riders_filtrados = riders_moto;
    }

    return { ok, riders: riders_filtrados };
  }

  filtro_dos(riders, lat, lng) {

    const riders_moto = [];
    const riders_bici = [];

    let isMoto = false;
    let isBici = false;

    riders.forEach(rider => {
      const riderCoors = [rider.lat, rider.lng];
      const destinoCoors = [lat, lng];

      const distance = this.haversineDistance(riderCoors, destinoCoors);
      if (distance < 6000 && rider.vehiculo == 'moto') {
        riders_moto.push(rider);
      }
      if (distance < 1500 && rider.vehiculo == 'bicicleta') {
        riders_bici.push(rider);
      }
    });

    if (riders_moto.length > 0) {
      isMoto = true;
    }

    if (riders_bici.length > 0) {
      isBici = true;
    }

    return { isMoto, isBici };
  }

  riders_loop(riders, lat, lng) {
    const distanceMatrix = [];

    riders.forEach(rider => {
      const distance = Math.sqrt((rider.lat - lat) * (rider.lat - lat) + (rider.lng - lng) * (rider.lng - lng));
      distanceMatrix.push({
        distance,
        id: rider.rider
      });
    });

    let a = distanceMatrix[0].distance;
    let id = distanceMatrix[0].id;
    let b = 0;

    distanceMatrix.forEach(item => {
      b = item.distance;
      if (b < a) {
        a = b;
        id = item.id;
      }
    });

    return id;
  }

  haversineDistance(coords1, coords2) {

    function toRad(x) {
      return x * Math.PI / 180;
    }

    var lat1 = coords1[0];
    var lon1 = coords1[1];

    var lat2 = coords2[0];
    var lon2 = coords2[1];

    var R = 6371; // km

    var x1 = lat2 - lat1;
    var dLat = toRad(x1);
    var x2 = lon2 - lon1;
    var dLon = toRad(x2)
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    d = d * 1000;

    return d;
  }

  calcular_cobertura(coors) {

    const radio_santiago = 70000;
    const radio_la_serena_coquimbo = 15000;

    const santiago = [-33.444012, -70.653651];
    const la_serena_coquimbo = [-29.948767, -71.292337];

    const delta_santiago = this.haversineDistance(coors, santiago);
    const delta_la_serena_coquimbo = this.haversineDistance(coors, la_serena_coquimbo);

    let flag_santiago = false;
    let flag_la_serena_coquimbo = false;

    if (delta_santiago < radio_santiago) {
      flag_santiago = true;
    }

    if (delta_la_serena_coquimbo < radio_la_serena_coquimbo) {
      flag_la_serena_coquimbo = true;
    }

    if (flag_santiago || flag_la_serena_coquimbo) {
      return { ok: true }
    } else {
      return { ok: false };
    }
  }


  calcular_ciudad(coors) {

    const santiago = [-33.444012, -70.653651];
    const la_serena_coquimbo = [-29.948767, -71.292337];

    const delta_santiago = this.haversineDistance(coors, santiago);
    const delta_la_serena_coquimbo = this.haversineDistance(coors, la_serena_coquimbo);

    const ciudades = [
      {
        value: 'santiago',
        delta: delta_santiago
      },
      {
        value: 'la_serena_coquimbo',
        delta: delta_la_serena_coquimbo
      }
    ];

    let a = ciudades[0].delta;
    let b = 0;
    let id = ciudades[0].value;

    ciudades.forEach(ciudad => {
      b = ciudad.delta;
      if (b < a) {
        a = b;
        id = ciudad.value
      }
    });


    return id;
  }

  async toast_devolucion_paquete() {
    const toast = await this.toastController.create({
      header: 'Te devolveremos el paquete en el punto de inicio',
      position: 'middle',
      duration: 15000,
      mode: 'md',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });

    toast.present();
  }


}