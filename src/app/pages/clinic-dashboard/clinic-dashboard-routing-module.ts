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
import { clinicPractitionerRestrictedGuard } from '../../helper/clinic-practitioner.guard';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'branches', component: ClinicBranches, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'branches/new', component: BranchFormComponent, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'branches/edit/:id', component: BranchFormComponent, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'staff', component: ClinicStaff, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'staff/new', component: StaffFormComponent, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'staff/edit/:id', component: StaffFormComponent, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'team', component: ClinicStaff, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'appointments', component: Doctordashboard },
  { path: 'appointment-list', component: Appointmentlist },
  { path: 'patients', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'add-patient', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'treatment-plans', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'consultations', component: Doctordashboard },
  { path: 'consultancy-list', component: ConsultancyList },
  { path: 'schedule-treatment', component: ScheduleTreatment, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'practice-management', component: PracticeManagement, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'services', component: PracticeManagement, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'settings', component: Settings, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'gallery', component: Settings, canActivate: [clinicPractitionerRestrictedGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClinicDashboardRoutingModule { }
