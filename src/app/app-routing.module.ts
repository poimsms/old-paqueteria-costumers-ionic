import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'mapa', loadChildren: './pages/mapa/mapa.module#MapaPageModule' },
  { path: 'login', loadChildren: './pages/login/login.module#LoginPageModule' },
  { path: 'usuario', loadChildren: './pages/usuario/usuario.module#UsuarioPageModule' },
  { path: 'popup', loadChildren: './pages/popup/popup.module#PopupPageModule' },
  { path: 'home', loadChildren: './pages/home/home.module#HomePageModule' },
  { path: 'pedidos', loadChildren: './pages/pedidos/pedidos.module#PedidosPageModule' },
  { path: 'login-account', loadChildren: './pages/login-account/login-account.module#LoginAccountPageModule' },
  { path: 'login-verify', loadChildren: './pages/login-verify/login-verify.module#LoginVerifyPageModule' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
