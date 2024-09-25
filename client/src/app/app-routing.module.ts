import { NgModule } from '@angular/core';
import {
  RouterModule,
  Routes
} from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./chart/chart.module')
      .then(m => m.ChartModule)
  },

  {
    path: 'settings',
    loadChildren: () => import('./picker/settings.module')
      .then(m => m.SettingsModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
