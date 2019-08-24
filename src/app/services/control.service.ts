import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ControlService {

  coorsTipo: string;

  origen: any;
  destino: any;

  origenReady = false;
  destinoReady = false;
  rutaReady = false;
  estaBuscandoRider = false;

  mapState = new Subject();


  constructor() { }

  actualizarOrigen(posicion) {
    this.origen = posicion;
    this.origenReady = true;
    const data = {
      accion: 'actualizar-origen',
      origen: posicion
    }
    this.mapState.next(data);
  }

  actualizarDestino(posicion) {
    this.destino = posicion;
    this.destinoReady = true;
    const data = {
      accion: 'actualizar-destino',
      destino: posicion
    }
    this.mapState.next(data);
  }

  calcularRuta() {
    this.rutaReady = true;
    const data = {
      accion: 'calcular-ruta',
      origen: this.origen,
      destino: this.destino
    }
    this.mapState.next(data);
  }





}
