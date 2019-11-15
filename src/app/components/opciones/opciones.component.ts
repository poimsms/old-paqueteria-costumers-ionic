import { Component, OnInit } from '@angular/core';
import { NavParams, PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-opciones',
  templateUrl: './opciones.component.html',
  styleUrls: ['./opciones.component.scss'],
})
export class OpcionesComponent implements OnInit {

  horas: any = [
    {
      value: 'Lo antes posible',
      start: 'Now',
      end: 'Now',
      index: 0,
      isActive: true,
      selected: true
    },
    {
      value: 'Entre 10:30 y 11:30 hs',
      start: '10',
      end: '11',
      index: 1,
      isActive: true,
      selected: false
    },
    {
      value: 'Entre 11:30 y 12:30 hs',
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
      value: 'Entre 18:30 y 19:30 hs',
      start: '10',
      end: '11',
      index: 9,
      isActive: true,
      selected: false
    },
    {
      value: 'Entre 19:30 y 20:30 hs',
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

  tipo: string;

  metodos = [
    {
      value: 'Efectivo',
      index: 0,
      isActive: true,
      selected: true
    },
    {
      value: 'Tarjeta',
      index: 1,
      isActive: true,
      selected: false
    }
  ];

  constructor(
    private navParams: NavParams,
    public popoverController: PopoverController
  ) {

    this.tipo = this.navParams.get('tipo');

    if (this.tipo == 'metodo_pago') {
      this.seleccionarMetodo(this.navParams.get('index'));
    }

    if (this.tipo == 'horario') {
      const hora = new Date().getHours();
      const horario = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      const index = horario.indexOf(hora + 1);
      this.generarHoras(index);
      this.seleccionarHora(this.navParams.get('index'));
    }

  }

  ngOnInit() { }

  generarHoras(index) {
    for (let i = 1; i <= index; i++) {
      this.horas[i].isActive = false;
    }
  }

  seleccionarHora(i) {
    this.horas.forEach(hora => {
      hora.selected = false;
    });

    this.horas[i].selected = true;
  }

  horarioHandler() {

    let seleccion: any;

    this.horas.forEach(hora => {
      if (hora.selected) {
        seleccion = hora;
      }
    });

    if (seleccion.start == 'Now') {
      seleccion.programado = false;
      this.popoverController.dismiss({ seleccion });
    }

    seleccion.programado = true;
    this.popoverController.dismiss({ seleccion });
  }

  seleccionarMetodo(i) {
    this.metodos.forEach(metodo => {
      metodo.selected = false;
    });
    console.log(i, 'iiiiii')
    this.metodos[i].selected = true;
  }

  metodoPagoHandler() {
    let seleccion: any;

    this.metodos.forEach(metodo => {
      if (metodo.selected) {
        seleccion = metodo;
      }
    });

    this.popoverController.dismiss({ seleccion });

  }




}
