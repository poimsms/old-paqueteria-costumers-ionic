import { Component } from '@angular/core';

import { Platform, MenuController, ModalController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { GlobalService } from './services/global.service';
import { ForceUpgradeComponent } from './components/force-upgrade/force-upgrade.component';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  usuario: any;
  token: string;
  isAuth: boolean;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private menu: MenuController,
    private router: Router,
    private _auth: AuthService,
    private _global: GlobalService,
    public modalController: ModalController
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

    
      this._global.checkAppVersion().then((data: any) => {

        if (data.forceUpgrade) {

          this.openForceModal();

        } else if (data.recommendUpgrade) {
          
          this.openForceModal();

        } else {
          this._auth.authState.subscribe((data: any) => {
            console.log(data, 'authhhh')
            if (data.isAuth) {
              this.usuario = data.usuario;
              this.token = data.token;
              this.isAuth = true;
              this.router.navigateByUrl('home');
            } else {
              this.router.navigateByUrl('login');
            }        
          });
              
        }
      });     
    });
  }

  async openForceModal() {
    const modal = await this.modalController.create({
      component: ForceUpgradeComponent
    });   
    await modal.present();
  }

  openFirst() {
    this.menu.enable(true, 'first');
    this.menu.open('first');
  }

  openPage(page) {
    this.router.navigateByUrl(page);
    this.menu.toggle();
  }

  logout() {
    this._auth.logout();
    this.menu.toggle();
    this.router.navigateByUrl('login');
  }
}
