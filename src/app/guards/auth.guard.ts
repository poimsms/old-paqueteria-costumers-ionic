import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  isAuth: boolean;

  constructor(private _auth:AuthService) {
    this._auth.authState.subscribe(data => {
      this.isAuth = data.isAuth;      
    });
  }
  canActivate() {
    return this.isAuth;
  }
  
}
