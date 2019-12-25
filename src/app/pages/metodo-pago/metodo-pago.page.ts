import { Component, OnInit } from '@angular/core';
import { ControlService } from 'src/app/services/control.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-metodo-pago',
  templateUrl: './metodo-pago.page.html',
  styleUrls: ['./metodo-pago.page.scss'],
})
export class MetodoPagoPage implements OnInit {

  metodo_pago = 'Efectivo';

  constructor(
    public _control: ControlService,
    private router: Router
  ) { }

  ngOnInit() { }

  toggleMetodoPago(tipo) {
    this._control.metodo_pago = tipo;
    this.router.navigateByUrl('home');
  }

  openCodigo() {
    this.router.navigateByUrl('codigo');
  }
}
