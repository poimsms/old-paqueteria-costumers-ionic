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
        console.log('entroo...')
        this._data.getPedidoActivo(this._auth.usuario._id).then((data: any) => {
          this.pedido$.next(data);
          resolve();
        });
      }

      if (this._auth.usuario.role == 'EMPRESA_ROLE') {
        console.log('aca vaa...')

        if (tipo == 'buscar_pedido_activo_mas_reciente') {

          this._data.getPedidoActivo(this._auth.usuario._id).then((data: any) => {
            this.pedido$.next(data);
            resolve();
          });
        }

        if (tipo == 'buscar_pedido_seleccionado') {
          console.log('okkk')
          this._data.getOnePedido(pedidoID).then((data: any) => {
            this.pedido$.next(data);
            resolve();
          });
        }
      }

    });
  }



  verificarPedidosProgramados(seleccion) {

    // Verificar que un cliente no tenga mas de 20 pedidos en la franja horaria seleccionada
    return new Promise((resolve, reject) => {
      this._data.cuotaPedidosProgramado(this._auth.usuario._id, { seleccion }).then((res: any) => {

        if (!res.ok) {
          this.presentAlert(res.message)
          return resolve({ ok: false });
        }

        resolve({ ok: true });

      });
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
