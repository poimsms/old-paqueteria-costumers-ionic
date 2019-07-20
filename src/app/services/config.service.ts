import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  apiURL: string;

  constructor() {
    this.apiURL = 'https://localhost:3000';
   }
}
