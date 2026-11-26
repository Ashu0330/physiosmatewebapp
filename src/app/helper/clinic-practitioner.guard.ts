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

/**
 * Blocks Receptionist workspace users from routes outside their allowed set
 * (Dashboard, Assigned Branch, Add Patient, Patients, Practice Management, Schedule Treatment).
 */
export const receptionistRestrictedGuard: CanActivateFn = () => {
  const auth = inject(Authservice);
  const router = inject(Router);
  if (auth.isReceptionistWorkspace()) {
    const fallback = auth.getWorkspaceNavigationRoute(
      auth.getActiveWorkspace(),
      auth.getRoleId()
    );
    return router.createUrlTree([fallback]);
  }
  return true;
};
