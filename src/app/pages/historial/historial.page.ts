import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { OtrosService } from 'src/app/services/otros.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit {

  pedidos = [];
  list = [1, 2, 3];
  isLoading = false;
  tipo = 'completados';

  constructor(
    private _auth: AuthService,
    private _data: DataService,
    private _otros: OtrosService,
    private router: Router
  ) { }

  ngOnInit() {
    this.getHistorial('completados');
  }

  getHistorial(tipo) {
    this._data.getPedidos(this._auth.usuario._id, tipo).then((pedidos: any) => {
      this.tipo = tipo;
      this.pedidos = [];
      this.pedidos = pedidos;
    });
  }

  segmentChanged(e) {
    this.getHistorial(e.detail.value);
  }

  openPedido(id) {
    this.isLoading = true;
    this._otros.getPedido('buscar_pedido_seleccionado', id).then(() => {
      this.isLoading = false;
      this.router.navigateByUrl('home');
    });
  }
}

