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
import { clinicPractitionerRestrictedGuard, receptionistRestrictedGuard } from '../../helper/clinic-practitioner.guard';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'branches', component: ClinicBranches, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'branches/new', component: BranchFormComponent, canActivate: [clinicPractitionerRestrictedGuard, receptionistRestrictedGuard] },
  { path: 'branches/edit/:id', component: BranchFormComponent, canActivate: [clinicPractitionerRestrictedGuard, receptionistRestrictedGuard] },
  { path: 'staff', component: ClinicStaff, canActivate: [clinicPractitionerRestrictedGuard, receptionistRestrictedGuard] },
  { path: 'staff/new', component: StaffFormComponent, canActivate: [clinicPractitionerRestrictedGuard, receptionistRestrictedGuard] },
  { path: 'staff/edit/:id', component: StaffFormComponent, canActivate: [clinicPractitionerRestrictedGuard, receptionistRestrictedGuard] },
  { path: 'team', component: ClinicStaff, canActivate: [clinicPractitionerRestrictedGuard, receptionistRestrictedGuard] },
  { path: 'appointments', component: Doctordashboard, canActivate: [receptionistRestrictedGuard] },
  { path: 'appointment-list', component: Appointmentlist, canActivate: [receptionistRestrictedGuard] },
  { path: 'patients', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'add-patient', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'treatment-plans', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard, receptionistRestrictedGuard] },
  { path: 'consultations', component: Doctordashboard, canActivate: [receptionistRestrictedGuard] },
  { path: 'consultancy-list', component: ConsultancyList, canActivate: [receptionistRestrictedGuard] },
  { path: 'schedule-treatment', component: ScheduleTreatment, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'practice-management', component: PracticeManagement, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'services', component: PracticeManagement, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'settings', component: Settings, canActivate: [clinicPractitionerRestrictedGuard, receptionistRestrictedGuard] },
  { path: 'gallery', component: Settings, canActivate: [clinicPractitionerRestrictedGuard, receptionistRestrictedGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClinicDashboardRoutingModule { }
