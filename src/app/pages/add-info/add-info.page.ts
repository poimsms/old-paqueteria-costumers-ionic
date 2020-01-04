import { Component, OnInit } from '@angular/core';
import { FireService } from 'src/app/services/fire.service';
import { ControlService } from 'src/app/services/control.service';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-add-info',
  templateUrl: './add-info.page.html',
  styleUrls: ['./add-info.page.scss'],
})
export class AddInfoPage implements OnInit {

  nombre_entrega: string;
  telefono_entrega: string;
  instrucciones: string;

  isLoading = false;
  isCargando = false;

  constructor(
    private _fire: FireService,
    private _data: DataService,
    public _control: ControlService,
    private router: Router,
    public _auth: AuthService
  ) { }

  ngOnInit() {
    this.setInfo();
  }  

  setInfo() {
    this.isCargando = true,

    this._data.getOnePedido(this._control.pedidoID).then((data: any) => {
      this.isCargando = false;
      const pedido = data.pedido;
      this.nombre_entrega = pedido.nombre_destino;
      this.telefono_entrega = pedido.telefono_destino;
      this.instrucciones = pedido.instrucciones;
    }).catch(() => this.isCargando = false);   
  }

  async onGuardar() {

    this.isLoading = true;

    const body = {
      nombre_destino: this.nombre_entrega,
      telefono_destino: this.telefono_entrega,
      instrucciones: this.instrucciones
    };

    await this._data.updatePedido(this._control.pedido._id, body);
    await this._fire.updateRider(this._control.riderID, 'rider', { updatePedido: true })

    this.isLoading = false;

    this.router.navigateByUrl('home');
  }
}
