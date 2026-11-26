import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Doctordashboard } from './doctordashboard/doctordashboard';
import { Settings } from '../settings/settings';
import { PracticeManagement } from './practice-management/practice-management';
import { ScheduleTreatment } from './schedule-treatment/schedule-treatment';
import { ConsultancyList } from './consultancy-list/consultancy-list';
import { Appointmentlist } from './appointmentlist/appointmentlist';
import { ClinicBranches } from '../clinic-dashboard/branches/clinic-branches';
import { BranchFormComponent } from '../clinic-dashboard/branch-form/branch-form';
import { clinicPractitionerRestrictedGuard, receptionistRestrictedGuard } from '../../helper/clinic-practitioner.guard';

const routes: Routes = [
  { path: '', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'dashboard', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'add-patient', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'patients', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'treatment-plans', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard, receptionistRestrictedGuard] },
  { path: 'consultations', component: Doctordashboard, canActivate: [receptionistRestrictedGuard] },
  { path: 'Consultations', component: Doctordashboard, canActivate: [receptionistRestrictedGuard] },
  { path: 'appointments', component: Doctordashboard, canActivate: [receptionistRestrictedGuard] },
  { path: 'Appointments', component: Doctordashboard, canActivate: [receptionistRestrictedGuard] },
  { path: 'consultancy-list', component: ConsultancyList, canActivate: [receptionistRestrictedGuard] },
  { path: 'Consultancy-List', component: ConsultancyList, canActivate: [receptionistRestrictedGuard] },
  { path: 'appointment-list', component: Appointmentlist, canActivate: [receptionistRestrictedGuard] },
  { path: 'Appointment-List', component: Appointmentlist, canActivate: [receptionistRestrictedGuard] },
  { path: 'appointmentlist', component: Appointmentlist, canActivate: [receptionistRestrictedGuard] },
  { path: 'settings', component: Settings, canActivate: [clinicPractitionerRestrictedGuard, receptionistRestrictedGuard] },
  { path: 'practice-management', component: PracticeManagement, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'Practice-Management', component: PracticeManagement, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'schedule-treatment', component: ScheduleTreatment, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'branches', component: ClinicBranches, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'branches/new', component: BranchFormComponent, canActivate: [clinicPractitionerRestrictedGuard, receptionistRestrictedGuard] },
  { path: 'branches/edit/:id', component: BranchFormComponent, canActivate: [clinicPractitionerRestrictedGuard, receptionistRestrictedGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoctorDashboardRoutingModule { }
