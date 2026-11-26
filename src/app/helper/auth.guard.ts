import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { Authservice } from '../services/authservice';

async function verifyAuthenticatedAccess(): Promise<boolean | UrlTree> {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(Authservice);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (!authService.hasValidToken()) {
    authService.logout();
    return router.createUrlTree(['/']);
  }

  const isAuthorized = await authService.verifyAuthorizedToken();
  if (!isAuthorized) {
    return router.createUrlTree(['/']);
  }

  return true;
}

/**
 * Route guard enforcing that users possess a valid, server-authorized JWT token
 * before viewing dashboards or authenticated pages; otherwise redirects to Home ('/').
 */
export const authGuard: CanActivateFn = () => verifyAuthenticatedAccess();

/**
 * Child-route guard mirroring `authGuard` so nested dashboard tab transitions also
 * enforce active token authorization.
 */
export const authChildGuard: CanActivateChildFn = () => verifyAuthenticatedAccess();
