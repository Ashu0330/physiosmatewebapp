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
import { clinicPractitionerRestrictedGuard } from '../../helper/clinic-practitioner.guard';

const routes: Routes = [
  { path: '', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'dashboard', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'add-patient', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'patients', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'treatment-plans', component: Doctordashboard, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'consultations', component: Doctordashboard },
  { path: 'Consultations', component: Doctordashboard },
  { path: 'appointments', component: Doctordashboard },
  { path: 'Appointments', component: Doctordashboard },
  { path: 'consultancy-list', component: ConsultancyList },
  { path: 'Consultancy-List', component: ConsultancyList },
  { path: 'appointment-list', component: Appointmentlist },
  { path: 'Appointment-List', component: Appointmentlist },
  { path: 'appointmentlist', component: Appointmentlist },
  { path: 'settings', component: Settings, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'practice-management', component: PracticeManagement, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'Practice-Management', component: PracticeManagement, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'schedule-treatment', component: ScheduleTreatment, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'branches', component: ClinicBranches, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'branches/new', component: BranchFormComponent, canActivate: [clinicPractitionerRestrictedGuard] },
  { path: 'branches/edit/:id', component: BranchFormComponent, canActivate: [clinicPractitionerRestrictedGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoctorDashboardRoutingModule { }
