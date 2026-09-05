import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Doctordashboard } from './doctordashboard/doctordashboard';

const routes: Routes = [
  { path: '',                component: Doctordashboard },
  { path: 'dashboard',       component: Doctordashboard },
  { path: 'add-patient',     component: Doctordashboard },
  { path: 'patients',        component: Doctordashboard },
  { path: 'treatment-plans', component: Doctordashboard },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoctorDashboardRoutingModule { }
