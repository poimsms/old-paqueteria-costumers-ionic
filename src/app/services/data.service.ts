import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  
  constructor(
    public http: HttpClient,
    private _config: ConfigService
  ) { }

  rateRider(rateId, riderId, body) {
    const url = `${this._config.apiURL}/core/rating-update?rate=${rateId}&rider=${riderId}`;
    return this.http.put(url, body).toPromise();
  }

  getActiveRating(id) {
    const url = `${this._config.apiURL}/core/rating-get-active-one?id=${id}`;
    return this.http.get(url).toPromise();
  }

  getOneRider(id) {
    const url = `${this._config.apiURL}/core/usuario-get-one?id=${id}`;
    return this.http.get(url).toPromise();
  }

  crearPedido(body) {
    const url = `${this._config.apiURL}/core/pedidos-create`;
    return this.http.post(url, body).toPromise();
  }

  getPedidos(id) {
    const url = `${this._config.apiURL}/core/pedidos-get-by-client-id?id=${id}`;
    return this.http.get(url).toPromise();
  }

  getPedidoActivo(id) {
    const url = `${this._config.apiURL}/core/pedidos-get-active-one?id=${id}`;
    return this.http.get(url).toPromise();
  }

  getOnePedido(id) {
    const url = `${this._config.apiURL}/core/pedidos-get-one?id=${id}`;
    return this.http.get(url).toPromise();
  }

}

