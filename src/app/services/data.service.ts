import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    public http: HttpClient,
    private _config: ConfigService,
    private _auth: AuthService
  ) { }

  rateRider(rateId, riderId, body) {
    const url = `${this._config.apiURL}/core/rating-update?rate=${rateId}&rider=${riderId}`;
    const headers = new HttpHeaders({ token: this._auth.token, version: this._config.version });
    return this.http.put(url, body, { headers }).toPromise();
  }

  getActiveRating(id) {
    const url = `${this._config.apiURL}/core/rating-get-active-one?id=${id}`;
    const headers = new HttpHeaders({ token: this._auth.token, version: this._config.version });
    return this.http.get(url, { headers }).toPromise();
  }

  getOneRider(id) {
    const url = `${this._config.apiURL}/core/usuario-get-one?id=${id}`;
    const headers = new HttpHeaders({ token: this._auth.token, version: this._config.version });
    return this.http.get(url, { headers }).toPromise();
  }

  crearPedido(body) {
    const url = `${this._config.apiURL}/core/pedidos-create`;
    const headers = new HttpHeaders({ token: this._auth.token, version: this._config.version });
    return this.http.post(url, body, { headers }).toPromise();
  }

  getPedidos(id) {
    const url = `${this._config.apiURL}/core/pedidos-get-by-client-id?id=${id}`;
    const headers = new HttpHeaders({ token: this._auth.token, version: this._config.version });
    return this.http.get(url, { headers }).toPromise();
  }

  getPedidoActivo(id) {
    const url = `${this._config.apiURL}/core/pedidos-get-active-one?id=${id}`;
    const headers = new HttpHeaders({ token: this._auth.token, version: this._config.version });
    return this.http.get(url, { headers }).toPromise();
  }

  getOnePedido(id) {
    const url = `${this._config.apiURL}/core/pedidos-get-one?id=${id}`;
    const headers = new HttpHeaders({ token: this._auth.token, version: this._config.version });
    return this.http.get(url, { headers }).toPromise();
  }

}

