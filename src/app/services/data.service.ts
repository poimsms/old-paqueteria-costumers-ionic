import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  apiURL: string;

  constructor(
    public http: HttpClient,
    private _config: ConfigService
  ) {
    this.apiURL = this._config.apiURL;
  }

  rateRider(rateId, riderId, body) {
    const url = `${this.apiURL}/riders/riders-pending-ratings?rate=${rateId}&rider=${riderId}`;
    return this.http.put(url, body).toPromise();
  }

  getActiveRating(id) {
    const url = `${this.apiURL}/riders/rating-get-active-one?id=${id}`;
    return this.http.get(url).toPromise();
  }

  getOneRider(id) {
    const url = `${this.apiURL}/riders/usuario-get-one?id=${id}`;
    return this.http.get(url).toPromise();
  }

  crearPedido(body) {
    const url = `${this.apiURL}/riders/pedidos-create`;
    return this.http.post(url, body).toPromise();
  }

  getPedidos(id) {
    const url = `${this.apiURL}/riders/pedidos-get-by-client-id?id=${id}`;
    return this.http.get(url).toPromise();
  }

  getPedidoActivo(id) {
    const url = `${this.apiURL}/riders/pedidos-get-active-one?id=${id}`;
    return this.http.get(url).toPromise();
  }

  getOnePedido(id) {
    const url = `${this.apiURL}/riders/pedidos-get-one?id=${id}`;
    return this.http.get(url).toPromise();
  }

}

