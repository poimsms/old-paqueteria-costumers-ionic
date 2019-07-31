import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

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
    this.db.doc('Pedidos/' + id).update(newData);
  }

  getRiderCoors(id) {
    return this.db.collection('Riders', ref =>
      ref.where('rider', '==', id).where('isActive', '==', true))
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

  
  



}
