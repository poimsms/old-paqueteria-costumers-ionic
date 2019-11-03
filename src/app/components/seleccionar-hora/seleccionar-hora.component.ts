import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ModalController, NavParams, AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-seleccionar-hora',
  templateUrl: './seleccionar-hora.component.html',
  styleUrls: ['./seleccionar-hora.component.scss'],
})
export class SeleccionarHoraComponent implements OnInit {

  isLoading = false;

  horas: any = [
    {
      value: 'Lo Antes Posible',
      start: 'Now',
      end: 'Now',
      index: 0,
      isActive: true,
      selected: true
    },
    {
      value: 'Entre 10:00 y 11:00 hs',
      start: '10',
      end: '11',
      index: 1,
      isActive: true,
      selected: false
    },
    {
      value: 'Entre 11:00 y 12:00 hs',
      start: '10',
      end: '11',
      index: 2,
      isActive: true,
      selected: false
    },
    {
      value: 'Entre 12:00 y 13:00 hs',
      start: '10',
      end: '11',
      index: 3,
      isActive: true,
      selected: false
    },
    {
      value: 'Entre 13:00 y 14:00 hs',
      start: '10',
      end: '11',
      index: 4,
      isActive: true,
      selected: false
    },
    {
      value: 'Entre 14:00 y 15:00 hs',
      start: '10',
      end: '11',
      index: 5,
      isActive: true,
      selected: false
    },
    {
      value: 'Entre 15:00 y 16:00 hs',
      start: '10',
      end: '11',
      index: 6,
      isActive: true,
      selected: false
    },
    {
      value: 'Entre 16:00 y 17:00 hs',
      start: '10',
      end: '11',
      index: 7,
      isActive: true,
      selected: false
    },
    {
      value: 'Entre 17:00 y 18:00 hs',
      start: '10',
      end: '11',
      index: 8,
      isActive: true,
      selected: false
    },
    {
      value: 'Entre 18:00 y 19:00 hs',
      start: '10',
      end: '11',
      index: 9,
      isActive: true,
      selected: false
    },
    {
      value: 'Entre 19:00 y 20:00 hs',
      start: '10',
      end: '11',
      index: 10,
      isActive: true,
      selected: false
    },
    {
      value: 'Entre 20:00 y 21:00 hs',
      start: '10',
      end: '11',
      index: 11,
      isActive: true,
      selected: false
    }
  ];
  constructor(
    public modalCtrl: ModalController,
    private _data: DataService,
    private _auth: AuthService,
    private navParams: NavParams,
    public alertController: AlertController
  ) {
    const hora = new Date().getHours();
    const horario = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const index = horario.indexOf(hora + 1);
    this.generarHoras(index);
    this.seleccionar(this.navParams.get('index'));
  }

  ngOnInit() { }

  generarHoras(index) {
    for (let i = 1; i <= index; i++) {
      this.horas[i].isActive = false;
    }
  }

  seleccionar(i) {
    this.horas.forEach(hora => {
      hora.selected = false;
    });

    this.horas[i].selected = true;
  }

  closeModal(tipo) {

    if (tipo == 'hora_no_seleccionada') {
      return this.modalCtrl.dismiss({ ok: false });
    }

    let seleccion: any;

    this.horas.forEach(hora => {
      if (hora.selected) {
        seleccion = hora;
      }
    });

    if (seleccion.start == 'Now') {
      seleccion.programado = false;
      this.modalCtrl.dismiss({ ok: true, seleccion });
    }

    seleccion.programado = true;
    this.isLoading = true;

    // Verificar que un cliente no tenga mas de 20 pedidos en la franja horaria seleccionada
    this._data.cuotaPedidosProgramado(this._auth.usuario._id, { seleccion }).then((res: any) => {

      if (!res.ok) {
        this.isLoading = false;
        return this.presentAlert(res.message);
      }

      this.modalCtrl.dismiss({ ok: true, seleccion });

    });

    

  }

  async presentAlert(message) {
    const alert = await this.alertController.create({
      header: 'Algo salio mal..',
      subHeader: message,
      buttons: ['OK']
    });

    await alert.present();
  }

}
