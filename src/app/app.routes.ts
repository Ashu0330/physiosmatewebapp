import { Routes } from '@angular/router';
import { Layoutwithheaderfooter } from './pages/layout/layoutwithheaderfooter/layoutwithheaderfooter';
import { Home } from './pages/home/home';
import { Doctors } from './pages/doctors/doctors';
import { Doctordetail } from './pages/doctordetail/doctordetail';

export const routes: Routes = [
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
    ],
  },
];
