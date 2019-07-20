import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class PagarService {

  apiURL: string;

  constructor(
    public http: HttpClient,
    private _config: ConfigService
  ) {
    this.apiURL = this._config.apiURL;
   }

  iniciarPago(body) {
    const url = `${this.apiURL}/riders/buscar-rider`;
    return this.http.post(url, body).toPromise();
  }
}
