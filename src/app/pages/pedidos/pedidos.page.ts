import { Component, OnInit } from '@angular/core';
import { ControlService } from 'src/app/services/control.service';
import { ModalController, AlertController, PickerController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
})
export class PedidosPage implements OnInit {


  isRecogida = false;
  isEntrega = true;

  tipos = [
    {
      tipo: 'foodtruck',
      isActive: false
    },
    {
      tipo: 'restaurante',
      isActive: false
    }
  ];


  monto_compartido: number;  

  constructor(
    public _control: ControlService,
    public modalCtrl: ModalController,
    public alertController: AlertController,
    private router: Router,
    private _data: DataService,
    public _auth: AuthService,
    public pickerCtrl: PickerController
  ) { }

  async openPicker() {
    const picker = await this.pickerCtrl.create({
      buttons: [
        {
          text: 'Cancelar',
          handler: (data) => this.monto_compartido = null
        },
        {
        text: 'Aceptar',
        handler: (data) => this.monto_compartido = data.dividir.value
      }
    ],
      columns: [
        {
          name: 'dividir',
          options: [
            {
              text: '$300',
              value: 300
            },
            {
              text: '$500',
              value: 500
            },
            {
              text: '$1000',
              value: 1000
            },
          ]
        }
      ]
    });

    await picker.present();
  }

  tipoToggle(i) {

    if (i == 0) {
      this.tipos[0].isActive = !this.tipos[0].isActive;
      this.tipos[1].isActive = false;
    }

    if (i == 1) {
      this.tipos[1].isActive = !this.tipos[1].isActive;
      this.tipos[0].isActive = false;
    }
  }


  ngOnInit() {

    // this.tipos.forEach(tipo => {
    //   if (tipo.isActive) {

    //   }
    // });
  }

  ngOnDestroy() {
  }

}




