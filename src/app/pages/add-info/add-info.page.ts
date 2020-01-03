import { Component, OnInit } from '@angular/core';
import { FireService } from 'src/app/services/fire.service';
import { ControlService } from 'src/app/services/control.service';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';

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

  constructor(
    private _fire: FireService,
    private _data: DataService,
    public _control: ControlService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  async onGuardar() {

    this.isLoading = true;

    const body = {
      nombre_destino: this.nombre_entrega,
      telefono_destino: this.telefono_entrega,
      instrucciones: this.instrucciones
    };

    console.log('pasooo')

    await this._data.updatePedido(this._control.pedidoID, body);
    await this._fire.updateRider(this._control.riderID, 'rider', { updatePedido: true })

    console.log(this._control.riderID, 'rider')
    console.log(this._control.pedidoID, 'pedidoID')

    this.isLoading = false;

    this.router.navigateByUrl('home');
  }
}
