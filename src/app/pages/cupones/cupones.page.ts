import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-cupones',
  templateUrl: './cupones.page.html',
  styleUrls: ['./cupones.page.scss'],
})
export class CuponesPage implements OnInit {
  list = [1, 2, 3];
  cupones = [];

  constructor(
    private _auth: AuthService,
    private _data: DataService
  ) { }

  ngOnInit() {
    this.getCupones();
  }

  getCupones() {
    this._data.getCupones(this._auth.usuario._id).then((data: any) => {
      console.log(data);
      this.cupones = data.cupones
    });
  }

}
