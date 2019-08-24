import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-bloqueado',
  templateUrl: './bloqueado.component.html',
  styleUrls: ['./bloqueado.component.scss'],
})
export class BloqueadoComponent implements OnInit {

  constructor(private _auth: AuthService, private modalCtrl: ModalController) { }

  ngOnInit() {}

  logout() {
    this.modalCtrl.dismiss();
    this._auth.logout();
  }

}
