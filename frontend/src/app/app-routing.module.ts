import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminComponent } from './features/admin/admin.component';
import { CalendarComponent } from './features/calendar/calendar.component';
import { PreferencesComponent } from './features/preferences/preferences.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'calendar' },
  { path: 'calendar', component: CalendarComponent },
  { path: 'preferences', component: PreferencesComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: 'calendar' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

