import { Component } from '@angular/core';
import { Platform, MenuController, ModalController, AlertController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ForceUpgradeComponent } from './components/force-upgrade/force-upgrade.component';
import { BloqueadoComponent } from './components/bloqueado/bloqueado.component';
import { FcmService } from './services/fcm.service';
import { ConfigService } from './services/config.service';
import { Market } from '@ionic-native/market/ngx';
import { ControlService } from './services/control.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  usuario: any;
  token: string;
  isAuth: boolean;
  oktodo = true;
  entro = false;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private menu: MenuController,
    private router: Router,
    public _auth: AuthService,
    public modalController: ModalController,
    private _fcm: FcmService,
    private _config: ConfigService,
    public alertController: AlertController,
    private _control: ControlService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.statusBar.overlaysWebView(false);
      this.splashScreen.hide();


      this._config.checkUpdate().then((data: any) => {

        setTimeout(() => {
          this._auth.loadStorage();
        }, 500);

        if (data.forceUpgrade) {

          this.openForceModal();

        } else if (data.recommendUpgrade) {

          this.openForceModal();

        } else {

          this._auth.authState.subscribe((data: any) => {
            if (data.isAuth && data.readyState) {

              this.usuario = data.usuario;
              this.token = data.token;
              this.isAuth = true;

              console.log(data)

              this._fcm.getToken(this.usuario._id);
              this._fcm.onTokenRefresh(this.usuario._id);

              if (!data.usuario.isActive) {

                this.openBloqueadoModal();

              } else {

                this.router.navigateByUrl('home');
              }

            } else if (data.readyState) {
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

  async openBloqueadoModal() {
    const modal = await this.modalController.create({
      component: BloqueadoComponent
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
