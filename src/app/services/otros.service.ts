import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { DataService } from './data.service';
import { AuthService } from './auth.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OtrosService {

  pedido$ = new Subject();

  pedido_seleccionado = false;
  buscar_pedido_reciente = true;

  constructor(
    public alertController: AlertController,
    private _data: DataService,
    private _auth: AuthService
  ) { }


  getPedido(tipo, pedidoID?) {

    return new Promise((resolve, reject) => {

      if (this._auth.usuario.role == 'USUARIO_ROLE') {
        this._data.getPedidoActivo(this._auth.usuario._id).then((data: any) => {
          this.pedido$.next(data);
          resolve();
        });
      }

      if (this._auth.usuario.role == 'EMPRESA_ROLE') {

        if (tipo == 'buscar_pedido_activo_mas_reciente') {
          this._data.getPedidoActivo(this._auth.usuario._id).then((data: any) => {
            this.pedido$.next(data);
            resolve();
          });
        }

        if (tipo == 'buscar_pedido_seleccionado') {
          this._data.getOnePedido(pedidoID).then((data: any) => {
            this.pedido$.next(data);
            resolve();
          });
        }

      }
    });
  }

  async presentAlert(message) {
    const alert = await this.alertController.create({
      header: 'Algo salio mal..',
      subHeader: message,
      buttons: ['OK']
    });

    await alert.present();
  }

}
