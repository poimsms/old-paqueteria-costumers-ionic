import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-politicas',
  templateUrl: './politicas.component.html',
  styleUrls: ['./politicas.component.scss'],
})
export class PoliticasComponent implements OnInit {

  tipo: 'Políticas'

  constructor(public modalCtrl: ModalController) { }

  ngOnInit() { }

  closeModal() {
    this.modalCtrl.dismiss({ ok: false });
  }

}
