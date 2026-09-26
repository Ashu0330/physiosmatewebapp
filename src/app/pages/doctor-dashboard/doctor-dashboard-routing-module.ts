import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Doctordashboard } from './doctordashboard/doctordashboard';
import { Settings } from '../settings/settings';
import { PracticeManagement } from '../practice-management/practice-management';

const routes: Routes = [
  { path: '',                component: Doctordashboard },
  { path: 'dashboard',       component: Doctordashboard },
  { path: 'add-patient',     component: Doctordashboard },
  { path: 'patients',        component: Doctordashboard },
  { path: 'treatment-plans', component: Doctordashboard },
  { path: 'consultations',   component: Doctordashboard },
  { path: 'Consultations',   component: Doctordashboard },
  { path: 'appointments',    component: Doctordashboard },
  { path: 'Appointments',    component: Doctordashboard },
  { path: 'settings',        component: Settings },
  { path: 'practice-management', component: PracticeManagement },
  { path: 'Practice-Management', component: PracticeManagement },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoctorDashboardRoutingModule { }
