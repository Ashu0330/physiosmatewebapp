import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserDashboard } from './user-dashboard/user-dashboard';

const routes: Routes = [
  { path: '',                     component: UserDashboard },  // /user-dashboard
  { path: 'appointments',         component: UserDashboard },  // /user-dashboard/appointments
  { path: 'medical-records',      component: UserDashboard },  // /user-dashboard/medical-records
  { path: 'consultations',        component: UserDashboard },  // /user-dashboard/consultations
  { path: 'online-consultations', component: UserDashboard },  // /user-dashboard/online-consultations
  { path: 'subscriptions',        component: UserDashboard },  // /user-dashboard/subscriptions
  { path: 'payments',             component: UserDashboard },  // /user-dashboard/payments
  { path: 'weekly-plan',          component: UserDashboard },  // /user-dashboard/weekly-plan
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserdashboardRoutingModule { }
