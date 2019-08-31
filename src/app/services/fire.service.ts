import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { take, switchMap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FireService {

  rider_query$ = new Subject();
  rider$: Observable<any>;

  distanceMatrix = [];
  ids = [];

  constructor(private db: AngularFirestore) {

    this.rider$ = this.rider_query$.pipe(
      switchMap(id => {
        return this.db.collection('riders', ref => ref.where('rider', '==', id)).valueChanges()
      })
    );

  }

  getRiderCoors(id) {
    return this.db.collection('riders_coors', ref =>
      ref.where('rider', '==', id)).valueChanges();
  }

  updateRider(id, tipo, data) {
    if (tipo == 'coors') {
      this.db.doc('riders_coors/' + id).update(data);
    } else {
      this.db.doc('riders/' + id).update(data);
    }
  }

  getRiderMasCercano(vehiculo, lat, lng) {
    return new Promise((resolve, reject) => {
      this.db.collection('riders_coors', ref =>
        ref.where('isOnline', '==', true)
          .where('isActive', '==', true)
          .where('pagoPendiente', '==', false)
          .where('actividad', '==', 'disponible')
          .where('vehiculo', '==', vehiculo))
        .valueChanges().pipe(take(1)).subscribe((riders: any) => {
          if (riders.length > 0) {
            const ridersOrdenados = this.ordenarRiders(riders, lat, lng);
            resolve({ hayRiders: true, riders: ridersOrdenados });
          } else {
            resolve({ hayRiders: false });
          }
        });
    });
  }

  ordenarRiders(riders, lat, lng) {
    this.distanceMatrix = [];

    riders.forEach(rider => {
      const distance = Math.sqrt((rider.lat - lat) * (rider.lat - lat) + (rider.lng - lng) * (rider.lng - lng));
      this.distanceMatrix.push({
        distance,
        id: rider.rider
      });
    });

    const ridersOrdenados = [];
    let matrix_temp = [];
    matrix_temp = JSON.parse(JSON.stringify(this.distanceMatrix));

    riders.forEach(rider => {

      const data: any = this.iterar(matrix_temp);

      const id = data.id;

      ridersOrdenados.push(id);

      matrix_temp = JSON.parse(JSON.stringify(data.matrix));

    });

    return ridersOrdenados;
  }

  iterar(riders) {

    if (riders.length != 0) {
      let a = 0;
      let b = riders[0].distance;
      let id = riders[0].id;

      if (riders.length != 1) {
        riders.forEach(data => {
          a = data.distance;
          if (a < b) {
            b = a;
            id = data.id;
          }
        });

        this.ids.push(id);

        let riders_restantes = [];

        this.distanceMatrix.forEach(item => {
          this.ids.forEach(id => {
            if (id != item.id) {
              riders_restantes.push(item);
            }
          });
        });

        return { id, matrix: riders_restantes };

      } else {

        return { id: riders[0].id, matrix: [] };
      }

    }
  }


}