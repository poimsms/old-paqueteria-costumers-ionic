import { Component, OnInit } from '@angular/core';
import { Market } from '@ionic-native/market/ngx';

@Component({
  selector: 'app-force-upgrade',
  templateUrl: './force-upgrade.component.html',
  styleUrls: ['./force-upgrade.component.scss'],
})
export class ForceUpgradeComponent implements OnInit {

  constructor(private market: Market) { }

  ngOnInit() { }

  onActualizar() {
    this.market.open('cl.joopiter.paqueteria01');
  }

}
