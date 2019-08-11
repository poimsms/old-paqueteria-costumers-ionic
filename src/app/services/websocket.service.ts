import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  socketStatus = false;

  constructor() { }

  
  // checkStatus() {

  //   this.socket.on('connect', () => {
  //     console.log('Conectado al servidor');
  //     this.socketStatus = true;
  //   });

  //   this.socket.on('disconnect', () => {
  //     console.log('Desconectado del servidor');
  //     this.socketStatus = false;
  //   });
  // }

  // emit( evento: string, payload?: any, callback?: Function ) {

  //   console.log('Emitiendo', evento);
  //   this.socket.emit( evento, payload, callback );

  // }

  // buscarRider(payload) {
  //   this.socket.emit( 'buscando-rider', payload);
  // }

  // listen( evento: string ) {
  //   return this.socket.fromEvent( evento );
  // }

}
