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

  iniciarPagoUsuario(id, body) {
    const url = `${this.apiURL}/pago/pagar-con-flow?${id}`;
    return this.http.post(url, body).toPromise();
  }

  registrarPagoEmpresa(body) {
    const url = `${this.apiURL}/pago/registrar-pago-empresa`;
    return this.http.post(url, body).toPromise();
  }

  actualizarRegistroEmpresa(id, body) {
    const url = `${this.apiURL}/pago/actualizar-pago-empresa?${id}`;
    return this.http.post(url, body).toPromise();
  }
}
