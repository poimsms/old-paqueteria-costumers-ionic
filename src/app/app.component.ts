import { Component } from '@angular/core';
import { Platform, MenuController, ModalController, AlertController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { GlobalService } from './services/global.service';
import { ForceUpgradeComponent } from './components/force-upgrade/force-upgrade.component';
import { BloqueadoComponent } from './components/bloqueado/bloqueado.component';
import { FcmService } from './services/fcm.service';
import { ConfigService } from './services/config.service';

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
    private _auth: AuthService,
    private _global: GlobalService,
    public modalController: ModalController,
    private _fcm: FcmService,
    private _config: ConfigService,
    public alertController: AlertController
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.statusBar.overlaysWebView(false);
      this.splashScreen.hide();


      this._global.checkAppVersion().then((data: any) => {

        this._config.setApi(data.apiVersion);
        this._auth.loadStorage();

        if (data.forceUpgrade) {

          // this.openForceModal();
          this.nuevaVersionAlert();


        } else if (data.recommendUpgrade) {

          // this.openForceModal();
          this.nuevaVersionAlert();

        } else {
          this._auth.authState.subscribe((data: any) => {
            if (data.isAuth && data.readyState) {

              this.usuario = data.usuario;
              this.token = data.token;
              this.isAuth = true;

              this._fcm.getToken(this.usuario._id);
              this._fcm.onTokenRefresh(this.usuario._id);
              this._global.getTarifas();

              if (!data.usuario.isActive) {
                
                this.openBloqueadoModal();

              } else {

                this.router.navigateByUrl('home');                
              }

            } else if(data.readyState) {
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

  async nuevaVersionAlert() {
    const alert = await this.alertController.create({
      header: 'Nueva versión disponible',
      subHeader: 'Por favor actualiza la app para poder seguir usandola',
      buttons: ['Actualizar']
    });

    await alert.present();
  }


  
}
