import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MapaService {

  constructor(private db: AngularFirestore) { }

  pedido = {
    id: 'dasd',
    isActive: true
  }

  addPedido(data) {
    return this.db.collection('Pedidos').add(data);
  }

  getPedidos(id) {
    return this.db.collection('Pedidos', ref =>
      ref.where('cliente', '==', id).where('isActive', '==', true))
      .snapshotChanges().pipe(map(docArray => {
        return docArray.map(doc => {
          return {
            id: doc.payload.doc.id,
            ...doc.payload.doc.data()
          };
        })
      })
      );
  }

  updatePedido(id, newData) {
    this.db.doc('pedidos_riders/' + id).update(newData);
  }

  updateRider(id, newData) {
    this.db.doc('riders/' + id).update(newData);
  }

  getRiderCoors2(id) {
    return this.db.collection('riders', ref =>
      ref.where('id', '==', id).where('isActive', '==', true))
      .snapshotChanges().pipe(map(docArray => {
        return docArray.map(doc => {
          return {
            id: doc.payload.doc.id,
            ...doc.payload.doc.data()
          };
        })
      })
      );
  }


  getRiderCoors(id) {
    return this.db.collection('riders', ref =>
      ref.where('rider', '==', id)).valueChanges();
  }

  
  getRiderMasCercano(vehiculo, lat, lng) {
    return new Promise((resolve, reject) => {
      this.db.collection('riders', ref =>
      ref.where('isAccountActive', '==', true).where('isPay', '==', false).where('actividad', '==', 'inactivo').where('vehiculo', '==', vehiculo))
      .valueChanges().pipe(take(1)).subscribe((riders: any) => {
        
        if (riders.lenght > 0) {

          const distanceMatrix = [];

          riders.forEach(rider => {
              const distance = Math.sqrt((rider.lat - lat) * (rider.lat - lat) + (rider.lng - lng) * (rider.lng - lng));
              distanceMatrix.push({
                  distance,
                  riderId: rider
              });
          });

          let a = 0;
          let b = distanceMatrix[0].distance;
          let id = distanceMatrix[0].riderId;

          distanceMatrix.forEach(data => {
              a = data.distance;
              if (a < b) {
                  b = a;
                  id = data.riderId;
              }
          });

          let riderMasCercano = {};

          riders.forEach(rider => {
              if (id == rider.rider) {
                  riderMasCercano = rider;
              }
          });

          resolve({ok: false, rider: riderMasCercano});

        } else {
          resolve({ok: false});
        }


      });
    });

    
  }









}
