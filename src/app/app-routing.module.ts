import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'mapa', loadChildren: './pages/mapa/mapa.module#MapaPageModule', canActivate: [AuthGuard] },
  { path: 'usuario', loadChildren: './pages/usuario/usuario.module#UsuarioPageModule', canActivate: [AuthGuard] },
  { path: 'home', loadChildren: './pages/home/home.module#HomePageModule', canActivate: [AuthGuard] },
  { path: 'pedidos', loadChildren: './pages/pedidos/pedidos.module#PedidosPageModule', canActivate: [AuthGuard] },
  { path: 'historial', loadChildren: './pages/historial/historial.module#HistorialPageModule', canActivate: [AuthGuard] },
  { path: 'codigo', loadChildren: './pages/codigo/codigo.module#CodigoPageModule', canActivate: [AuthGuard] },
  { path: 'cupones', loadChildren: './pages/cupones/cupones.module#CuponesPageModule', canActivate: [AuthGuard] },

  { path: 'login', loadChildren: './pages/login/login.module#LoginPageModule' },
  { path: 'login-account', loadChildren: './pages/login-account/login-account.module#LoginAccountPageModule' },
  { path: 'login-verify', loadChildren: './pages/login-verify/login-verify.module#LoginVerifyPageModule' },
  { path: 'historial', loadChildren: './pages/historial/historial.module#HistorialPageModule' },
  { path: 'codigo', loadChildren: './pages/codigo/codigo.module#CodigoPageModule' },
  { path: 'cupones', loadChildren: './pages/cupones/cupones.module#CuponesPageModule' },  { path: 'ayuda', loadChildren: './pages/ayuda/ayuda.module#AyudaPageModule' },
  { path: 'direcciones', loadChildren: './pages/direcciones/direcciones.module#DireccionesPageModule' },
  { path: 'buscar', loadChildren: './pages/buscar/buscar.module#BuscarPageModule' },
  { path: 'mis-lugares', loadChildren: './pages/mis-lugares/mis-lugares.module#MisLugaresPageModule' }




];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
