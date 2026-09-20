import { Routes } from '@angular/router';
import { Layoutwithheaderfooter } from './pages/layout/layoutwithheaderfooter/layoutwithheaderfooter';
import { Home } from './pages/home/home';
import { Doctors } from './pages/doctors/doctors';
import { Doctordetail } from './pages/doctordetail/doctordetail';
import { Findphysiotherapist } from './pages/findphysiotherapist/findphysiotherapist';
import { AuthPageComponent } from './auth/auth-page/auth-page.component';
import { RegisterComponent } from './auth/register-component/register-component';
import { BookingAuthComponent } from './pages/booking/booking-auth/booking-auth.component';
import { Condition } from './pages/specilization-condition/condition/condition';
import { ConditionDetail } from './pages/specilization-condition/condition-detail/condition-detail';
import { Articles } from './pages/articles/articles';
import { ArticleDetail } from './pages/articles/article-detail/article-detail';
import { Settings } from './pages/settings/settings';

export const routes: Routes = [
  // ─── Main Layout Routes (With Header & Footer) ───────────────────────────
  {
    path: '',
    component: Layoutwithheaderfooter,
    children: [
      { path: '', component: Home },
      { path: 'articles', component: Articles },
      { path: 'health-articles', component: Articles },
      { path: 'article', component: ArticleDetail },
      { path: 'article-detail', component: ArticleDetail },
      { path: 'article/:id', component: ArticleDetail },
      { path: 'article-detail/:id', component: ArticleDetail },
      { path: 'articles/:id', component: ArticleDetail },
      { path: 'find-physiotherapist', component: Findphysiotherapist },
      { path: 'findphysiotherapy', component: Findphysiotherapist },
      { path: 'find-physiotherapy', component: Findphysiotherapist },
      { path: 'conditions', component: Condition },
      { path: 'condition', component: ConditionDetail },
      { path: 'condition-detail', component: ConditionDetail },
      { path: 'condition-detail/:id', component: ConditionDetail },
      { path: 'condition/:id', component: ConditionDetail },
      { path: 'find-doctors', component: Doctors, data: { isClinic: false } },
      { path: 'doctors', component: Doctors, data: { isClinic: false } },
      { path: 'doctors/:specialty', component: Doctors, data: { isClinic: false } },
      { path: 'find-clinics', component: Doctors, data: { isClinic: true } },
      { path: 'clinics', component: Doctors, data: { isClinic: true } },
      { path: 'clinics-near-you', component: Doctors, data: { isClinic: true } },
      { path: 'clinic-detail/:id', component: Doctordetail, data: { isClinic: true } },
      { path: 'clinic-detail', component: Doctordetail, data: { isClinic: true } },
      { path: 'clinic/:id', component: Doctordetail, data: { isClinic: true } },
      { path: 'doctor-detail', component: Doctordetail, data: { isClinic: false } },
      { path: 'doctor-detail/:id', component: Doctordetail, data: { isClinic: false } },
      { path: 'doctor/:id', component: Doctordetail, data: { isClinic: false } },
      { path: 'providers/:id', component: Doctordetail, data: { isClinic: false } },

      // ─── Patient Dashboard — single entry, routes handled inside UserdashboardRoutingModule
      { path: 'user-dashboard', loadChildren: () => import('./pages/userdashboard/userdashboard-routing-module').then(m => m.UserdashboardRoutingModule) },

      // ─── Doctor Dashboard — single entry, routes handled inside DoctorDashboardRoutingModule
      { path: 'doctor-dashboard', loadChildren: () => import('./pages/doctor-dashboard/doctor-dashboard-routing-module').then(m => m.DoctorDashboardRoutingModule) },

      // ─── Global Settings Page ───────────────────────────────────────────────
      { path: 'settings', component: Settings },
    ],
  },

  // ─── Standalone Authentication Routes ────────────────────────────────────
  { path: 'login', component: AuthPageComponent },
  { path: 'signup', component: AuthPageComponent },
  { path: 'register', component: AuthPageComponent },

  // ─── Booking Route ────────────────────────────────────────────────────────
  { path: 'booking/consultancy/:providerId', component: BookingAuthComponent },

  // ─── Fallback ────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
