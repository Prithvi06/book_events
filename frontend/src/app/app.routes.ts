import { Routes } from '@angular/router';

import { AdminComponent } from './features/admin/admin.component';
import { CalendarComponent } from './features/calendar/calendar.component';
import { PreferencesComponent } from './features/preferences/preferences.component';
import { LoginComponent } from './features/auth/login.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'preferences', component: PreferencesComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: 'login' },
];

