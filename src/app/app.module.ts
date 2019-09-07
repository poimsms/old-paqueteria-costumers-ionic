import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { HttpClientModule } from "@angular/common/http";
import { FormsModule } from '@angular/forms';
import { IonicStorageModule } from '@ionic/storage';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { FCM } from '@ionic-native/fcm/ngx';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { Camera } from '@ionic-native/camera/ngx';
import { FileTransfer } from '@ionic-native/file-transfer/ngx';

export const firebaseConfig = {
  apiKey: "AIzaSyAmlXBSsNgsocMZ15dN8bc1D3ZD0gMAetQ",
  authDomain: "mapa-334c3.firebaseapp.com",
  databaseURL: "https://mapa-334c3.firebaseio.com",
  projectId: "mapa-334c3",
  storageBucket: "",
  messagingSenderId: "905180881415",
  appId: "1:905180881415:web:3d4928246302074a"
};

import { AppVersion } from '@ionic-native/app-version/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

import { ForceUpgradeComponent } from './components/force-upgrade/force-upgrade.component';
import { RatingComponent } from './components/rating/rating.component';
import { PayComponent } from './components/pay/pay.component';
import { BloqueadoComponent } from './components/bloqueado/bloqueado.component';
import { EditarCamposComponent } from './components/editar-campos/editar-campos.component';
import { PoliticasComponent } from './components/politicas/politicas.component';
import { MapaComponent } from './components/mapa/mapa.component';

@NgModule({
  declarations: [
    AppComponent,
    ForceUpgradeComponent,
    RatingComponent,
    PayComponent,
    BloqueadoComponent,
    EditarCamposComponent,
    PoliticasComponent,
    MapaComponent
  ],
  entryComponents: [
    ForceUpgradeComponent,
    RatingComponent,
    PayComponent,
    BloqueadoComponent,
    EditarCamposComponent,
    PoliticasComponent,
    MapaComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule,
    IonicStorageModule.forRoot(),
    IonicModule.forRoot(),
    AppRoutingModule
  ],
  providers: [
    StatusBar,
    SplashScreen,
    FCM,
    CallNumber,
    Camera,
    FileTransfer,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    AppVersion,
    InAppBrowser
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
