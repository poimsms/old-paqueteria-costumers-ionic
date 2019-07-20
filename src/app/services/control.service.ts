import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ControlService {

  coorsTipo: string;

  origen: any;
  destino: any;

  mapState = new Subject();


  constructor() { }

  cargarCordenadas(tipo, posicion) {
    let data = {};
    if (tipo == 'destino-origen-definidos') {
      data = {
        lugar: 'todo',
        origen: this.origen,
        destino: this.destino
      }
    }
    if (tipo == 'origen') {
      this.origen = posicion;
      data = {
        lugar: tipo,
        origen: posicion
      }
    }
    if (tipo == 'destino') {
      this.destino = posicion;
      data = {
        lugar: tipo,
        destino: posicion
      }
    }
    this.mapState.next(data);
  }





}
