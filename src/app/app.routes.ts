import { Routes } from '@angular/router';
import { Layoutwithheaderfooter } from './pages/layout/layoutwithheaderfooter/layoutwithheaderfooter';
import { Home } from './pages/home/home';
import { Doctors } from './pages/doctors/doctors';
import { Doctordetail } from './pages/doctordetail/doctordetail';
import { AuthPageComponent } from './auth/auth-page/auth-page.component';
import { BookingAuthComponent } from './booking/booking-auth/booking-auth.component';

import { UserDashboard } from './pages/user-dashboard/user-dashboard';

export const routes: Routes = [
  // ─── Main Layout Routes (With Header & Footer) ───────────────────────────
  {
    path: '',
    component: Layoutwithheaderfooter,
    children: [
      {
        path: '',
        component: Home,
      },
      {
        path: 'find-doctors',
        component: Doctors,
      },
      {
        path: 'doctors',
        component: Doctors,
      },
      {
        path: 'doctors/:specialty',
        component: Doctors,
      },
      {
        path: 'doctor-detail',
        component: Doctordetail,
      },
      {
        path: 'doctor-detail/:id',
        component: Doctordetail,
      },
      {
        path: 'doctor/:id',
        component: Doctordetail,
      },
      {
        path: 'providers/:id',
        component: Doctordetail,
      },
      {
        path: 'appointments',
        component: UserDashboard,
      },
      {
        path: 'dashboard',
        component: UserDashboard,
      },
      {
        path: 'medical-records',
        component: UserDashboard,
      },
      {
        path: 'online-consultations',
        component: UserDashboard,
      },
    ],
  },

  // ─── Standalone Authentication Routes ────────────────────────────────────
  {
    path: 'login',
    component: AuthPageComponent,
  },
  {
    path: 'signup',
    component: AuthPageComponent,
  },

  // ─── Booking Authentication Route ────────────────────────────────────────
  {
    path: 'booking/consultancy/:providerId',
    component: BookingAuthComponent,
  },

  // ─── Fallback ────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: '',
  },
];
