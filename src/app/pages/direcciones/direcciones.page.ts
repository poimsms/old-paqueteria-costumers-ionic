import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { UbicacionComponent } from 'src/app/components/ubicacion/ubicacion.component';
import { AuthService } from 'src/app/services/auth.service';
import { ModalController } from '@ionic/angular';
import { SeleccionarHoraComponent } from 'src/app/components/seleccionar-hora/seleccionar-hora.component';

@Component({
  selector: 'app-direcciones',
  templateUrl: './direcciones.page.html',
  styleUrls: ['./direcciones.page.scss'],
})
export class DireccionesPage implements OnInit {

  casa_direccion = 'Agregar dirección';
  casa_puerta = '';

  oficina_direccion = 'Agregar dirección';
  oficina_puerta = '';

  constructor(
    private _data: DataService,
    private _auth: AuthService,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    this.getUbicaciones();
  }

  getUbicaciones() {
    this._data.getUbicaciones(this._auth.usuario._id).then((data: any) => {

      if (!data.ok) {
        return;
      }

      if (data.ubicacion.casa.configurado) {
        this.casa_direccion = data.ubicacion.casa.direccion;
        this.casa_puerta = data.ubicacion.casa.puerta;
      }

      if (data.ubicacion.oficina.configurado) {
        this.oficina_direccion = data.ubicacion.oficina.direccion;
        this.oficina_puerta = data.ubicacion.oficina.puerta;
      }
    });
  }

  ubicacionHandler(tipo) {

    this._data.getUbicaciones(this._auth.usuario._id).then((data: any) => {

      if (!data.ok) {
        return this.openUbicacionModal(tipo, 'crear');
      }

      this.openUbicacionModal(tipo, 'editar', data.ubicacion._id);
    });
  }

  async openUbicacionModal(tipo, accion, id?) {

    const modal = await this.modalCtrl.create({
      component: UbicacionComponent,
      componentProps: { tipo, accion, id }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data.ok) {
      this.getUbicaciones();
    }
  }

  async openMaketa(tipo, accion, id?) {

    const modal = await this.modalCtrl.create({
      component: SeleccionarHoraComponent
    });

    await modal.present();
  }


}
