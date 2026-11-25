import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClinicBranches } from './branches/clinic-branches';
import { BranchFormComponent } from './branch-form/branch-form';
import { ClinicStaff } from './staff/clinic-staff';
import { StaffFormComponent } from './staff-form/staff-form';
import { Doctordashboard } from '../doctor-dashboard/doctordashboard/doctordashboard';
import { Appointmentlist } from '../doctor-dashboard/appointmentlist/appointmentlist';
import { PracticeManagement } from '../doctor-dashboard/practice-management/practice-management';
import { ScheduleTreatment } from '../doctor-dashboard/schedule-treatment/schedule-treatment';
import { ConsultancyList } from '../doctor-dashboard/consultancy-list/consultancy-list';
import { Settings } from '../settings/settings';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Doctordashboard },
  { path: 'branches', component: ClinicBranches },
  { path: 'branches/new', component: BranchFormComponent },
  { path: 'branches/edit/:id', component: BranchFormComponent },
  { path: 'staff', component: ClinicStaff },
  { path: 'staff/new', component: StaffFormComponent },
  { path: 'staff/edit/:id', component: StaffFormComponent },
  { path: 'team', component: ClinicStaff },
  { path: 'appointments', component: Doctordashboard },
  { path: 'appointment-list', component: Appointmentlist },
  { path: 'patients', component: Doctordashboard },
  { path: 'add-patient', component: Doctordashboard },
  { path: 'treatment-plans', component: Doctordashboard },
  { path: 'consultations', component: Doctordashboard },
  { path: 'consultancy-list', component: ConsultancyList },
  { path: 'schedule-treatment', component: ScheduleTreatment },
  { path: 'practice-management', component: PracticeManagement },
  { path: 'services', component: PracticeManagement },
  { path: 'settings', component: Settings },
  { path: 'gallery', component: Settings },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClinicDashboardRoutingModule { }
