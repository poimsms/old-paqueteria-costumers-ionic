import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ConfigService } from './config.service';
import { AngularFirestore } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class DataService {

  apiURL: string;

  pedidosInactivos = [];
  pedidosActivos = [];
  pedidos = [];

  constructor(
    public http: HttpClient,
    private _config: ConfigService,
    private db: AngularFirestore
  ) {
    this.apiURL = this._config.apiURL;
  }

  buscarRider(vehiculo, lat, lng) {
    const url = `${this.apiURL}/riders/riders-buscar?vehiculo=${vehiculo}&lat=${lat}&lng=${lng}`;
    return this.http.get(url).toPromise();
  }

  crearPedido(body) {
    const url = `${this.apiURL}/riders/pedidos-crear`;
    return this.http.post(url, body).toPromise();
  }

  getPedidos(id) {
    const url = `${this.apiURL}/riders/pedidos-by-id?id=${id}`;
    return this.http.get(url).toPromise();
  }

  getPedidoActivo(id) {
    return new Promise((resolve, reject) => {
      if (this.pedidos.length > 0) {

        let pedidoActivo = {};

        this.pedidosActivos.forEach(pedido => {
          if (pedido.isTracking) {
            pedidoActivo = pedido;
          }
        });

        resolve(pedidoActivo);

      } else {
        this.getPedidos(id).then((pedidos: any) => {

          pedidos.forEach(pedido => {
            this.pedidos.push({
              isTracking: false,
              ...pedido
            });
          });

          this.pedidos[0].isTracking = true;
          resolve(this.pedidos[0]);
        });
      }
    })
  }

  selectPedidoActivo(index) {

    this.pedidos.forEach(pedido => {
      pedido.isTracking = false;
    });

    this.pedidos[index].isTracking = true;
  }


  obtener_pedido(id) {
    const url = `${this.apiURL}/riders/pedidos-get-ultimo-pedido-activo?id=${id}`;
    return this.http.get(url).toPromise();
  }

  getRiderCoorsFirebase(id) {
    return this.db.collection('riders', ref =>
      ref.where('rider', '==', id)).valueChanges();
  }

  updateRiderFirebase(id, newData) {
    this.db.doc('riders/' + id).update(newData);
  }

  updatePedidoFirebase(id, newData) {
    this.db.doc('pedidos_riders/' + id).update(newData);
  }



}

