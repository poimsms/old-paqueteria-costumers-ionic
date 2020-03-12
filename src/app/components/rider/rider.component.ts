import { Component, OnInit } from '@angular/core';
import { NavParams, PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-rider',
  templateUrl: './rider.component.html',
  styleUrls: ['./rider.component.scss'],
})
export class RiderComponent implements OnInit {

  vehiculo: string;
  alternativo: string;

  constructor(
    private navParams: NavParams,
    public popoverController: PopoverController


  ) { 
    this.vehiculo = navParams.get('vehiculo');
    this.alternativo = navParams.get('alternativo');
  }

  ngOnInit() {}

  onAceptar() {
    this.popoverController.dismiss({ok: true});
  }

  onCancelar() {
    this.popoverController.dismiss({ok: false});
  }
}
