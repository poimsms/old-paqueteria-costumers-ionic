import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cupones',
  templateUrl: './cupones.page.html',
  styleUrls: ['./cupones.page.scss'],
})
export class CuponesPage implements OnInit {
  list = [1,2,3];
  constructor() { }

  ngOnInit() {
  }

}
