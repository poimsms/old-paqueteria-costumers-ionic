import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { EditarCamposComponent } from 'src/app/components/editar-campos/editar-campos.component';
import { AuthService } from 'src/app/services/auth.service';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { ImageService } from 'src/app/services/image.service';

@Component({
  selector: 'app-usuario',
  templateUrl: './usuario.page.html',
  styleUrls: ['./usuario.page.scss'],
})
export class UsuarioPage implements OnInit {

  usuario: any;
  isLoading = false;

  constructor(
    private _auth: AuthService,
    public modalController: ModalController,
    private camera: Camera,
    private _img: ImageService
  ) {
    this.usuario = _auth.usuario;
  }

  ngOnInit() {
  }

  getUsuario() {

    const token = this._auth.token;
    const id = this._auth.usuario._id;

    this._auth.getUser(token, id).then(usuario => {
      this.usuario = null;
      this.usuario = usuario;
      this._auth.usuario = usuario;
      this.isLoading = false;
    });
  }

  takePicture() {

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    const options: CameraOptions = {
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY
    }

    this.camera.getPicture(options).then((imageData) => {

      this._img.uploadImage(imageData)
        .then((res: any) => {

          const data = JSON.parse(res.response);

          if (data.ok) {
            this._auth.updateUser({ img: data.image }).then(() => {
              this.getUsuario();
            });
          } else {
            this.isLoading = false;
          }

        });

    }, (err) => {
      // Handle error
    });
  }

  async openCampoModal(tipo) {

    let input = '';

    if (tipo == 'Email') {
      input = this.usuario.email;
    }

    if (tipo == 'Nombre') {
      input = this.usuario.nombre;
    }

    const modal = await this.modalController.create({
      component: EditarCamposComponent,
      componentProps: { tipo, input }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data.ok) {
      this.getUsuario();
    }
  }

  logout() {
    this._auth.logout();
  }

}
