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

  buscarRider(lat, lng) {
    const url = `${this.apiURL}/riders/buscar-rider?lat=${lat}&lng=${lng}`;
    return this.http.get(url).toPromise();
  }

  crearPedido(body) {
    const url = `${this.apiURL}/riders/crear-pedido`;
    return this.http.post(url, body).toPromise();
  }
}

