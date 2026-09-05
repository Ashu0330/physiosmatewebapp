import { Routes } from '@angular/router';
import { Layoutwithheaderfooter } from './pages/layout/layoutwithheaderfooter/layoutwithheaderfooter';
import { Home } from './pages/home/home';
import { Doctors } from './pages/doctors/doctors';
import { Doctordetail } from './pages/doctordetail/doctordetail';
import { AuthPageComponent } from './auth/auth-page/auth-page.component';
import { BookingAuthComponent } from './booking/booking-auth/booking-auth.component';

export const routes: Routes = [
  // ─── Main Layout Routes (With Header & Footer) ───────────────────────────
  {
    path: '',
    component: Layoutwithheaderfooter,
    children: [
      { path: '',              component: Home },
      { path: 'find-doctors',  component: Doctors },
      { path: 'doctors',       component: Doctors },
      { path: 'doctors/:specialty', component: Doctors },
      { path: 'doctor-detail',      component: Doctordetail },
      { path: 'doctor-detail/:id',  component: Doctordetail },
      { path: 'doctor/:id',         component: Doctordetail },
      { path: 'providers/:id',      component: Doctordetail },

      // ─── Patient Dashboard — single entry, routes handled inside UserdashboardRoutingModule
      { path: 'user-dashboard',   loadChildren: () => import('./pages/userdashboard/userdashboard-routing-module').then(m => m.UserdashboardRoutingModule) },

      // ─── Doctor Dashboard — single entry, routes handled inside DoctorDashboardRoutingModule
      { path: 'doctor-dashboard', loadChildren: () => import('./pages/doctor-dashboard/doctor-dashboard-routing-module').then(m => m.DoctorDashboardRoutingModule) },
    ],
  },

  // ─── Standalone Authentication Routes ────────────────────────────────────
  { path: 'login',  component: AuthPageComponent },
  { path: 'signup', component: AuthPageComponent },

  // ─── Booking Route ────────────────────────────────────────────────────────
  { path: 'booking/consultancy/:providerId', component: BookingAuthComponent },

  // ─── Fallback ────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
