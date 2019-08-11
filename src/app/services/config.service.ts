import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  apiURL: string;
  version: string;

  constructor() {
    this.apiURL = 'http://localhost:3000';
    this.version = '1.0.0';
   }
}
