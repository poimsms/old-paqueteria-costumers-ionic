import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { ModalController } from '@ionic/angular';
import { SeleccionarHoraComponent } from 'src/app/components/seleccionar-hora/seleccionar-hora.component';
import { LugaresComponent } from 'src/app/components/lugares/lugares.component';
@Component({
  selector: 'app-mis-lugares',
  templateUrl: './mis-lugares.page.html',
  styleUrls: ['./mis-lugares.page.scss'],
})
export class MisLugaresPage implements OnInit {

  casa_direccion = 'Agregar dirección';
  oficina_direccion = 'Agregar dirección';

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
      }

      if (data.ubicacion.oficina.configurado) {
        this.oficina_direccion = data.ubicacion.oficina.direccion;
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
      component: LugaresComponent,
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