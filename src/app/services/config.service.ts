import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  apiURL: string;

  constructor() {
    this.apiURL = 'http://localhost:3000';
   }
}
