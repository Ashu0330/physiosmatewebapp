import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authservice } from '../services/authservice';

export const clinicPractitionerRestrictedGuard: CanActivateFn = () => {
  const auth = inject(Authservice);
  const router = inject(Router);
  if (auth.isClinicPractitionerWorkspace()) {
    const fallback = auth.getRoleId() === 3
      ? '/clinic-dashboard/consultations'
      : '/doctor-dashboard/consultations';
    return router.createUrlTree([fallback]);
  }
  return true;
};
