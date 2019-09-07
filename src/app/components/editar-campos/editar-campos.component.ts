import { Component, OnInit } from '@angular/core';
import { NavParams, ModalController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-editar-campos',
  templateUrl: './editar-campos.component.html',
  styleUrls: ['./editar-campos.component.scss'],
})
export class EditarCamposComponent implements OnInit {

  tipo: string;
  input: string;

  oldPassword: string;
  newPassword: string;
  nombre: string;
  email: string;

  isLoading = false;

  error_password = false;

  constructor(
    private navParams: NavParams,
    public modalCtrl: ModalController,
    private _auth: AuthService
  ) {
    this.tipo = navParams.get('tipo');
    this.input = navParams.get('input');
  }

  closeModal() {
    this.modalCtrl.dismiss({ ok: false });
  }

  guardarCambios() {

    if (this.tipo == 'Nombre') {

      if (!this.nombre) {
        return;
      }

      this.isLoading = true;
      this._auth.updateUser({ nombre: this.nombre }).then(() => {
        this.isLoading = false;
        this.modalCtrl.dismiss({ ok: true });
      });
    }

    // -------------------

    if (this.tipo == 'Email') {

      if (!this.email) {
        return;
      }

      this.isLoading = true;

      this._auth.updateUser({ email: this.email }).then(() => {
        this.isLoading = false;
        this.modalCtrl.dismiss({ ok: true });
      });
    }

    // -------------------

    if (this.tipo == 'Contraseña') {

      if (!this.oldPassword && !this.newPassword) {
        return;
      }

      const data = {
        oldPassword: this.oldPassword,
        newPassword: this.newPassword
      };

      this.error_password = false;

      this.isLoading = true;


      this._auth.updatePassword(data).then((res: any) => {
        
        if (res.ok) {
          this.modalCtrl.dismiss({ ok: true });
        } else {
          this.error_password = false;
          this.oldPassword = undefined;
          this.newPassword = undefined;
        }

        this.isLoading = false;
      });
    }
  }

  ngOnInit() { }

}
