import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { ControlService } from 'src/app/services/control.service';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit {

  pedidos = [];

  constructor(
    private _auth: AuthService,
    private _data: DataService,
    private _control: ControlService
  ) { }

  ngOnInit() {
    this._data.getPedidos(this._auth.usuario._id).then((pedidos: any) => {
      console.log(pedidos)
      this.pedidos = pedidos;
    });
  }


}

