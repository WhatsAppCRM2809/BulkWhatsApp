import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DataCleansingComponent } from './pages/data-cleansing/data-cleansing.component';
import { LogsComponent } from './pages/logs/logs.component';
import { SettingsComponent } from './pages/settings/settings.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent, pathMatch: 'full' },
  { path: 'data-cleansing', component: DataCleansingComponent },
  { path: 'logs', component: LogsComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '' }
];
