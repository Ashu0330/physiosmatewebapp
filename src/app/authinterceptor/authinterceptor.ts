import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject, Injector, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { getStoredToken, isProtectedAppUrl } from '../helper/jwt.helper';
import { Authservice } from '../services/authservice';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const injector = inject(Injector);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const rawWs = localStorage.getItem('activeWorkspace');
    if (rawWs) {
      const ws = JSON.parse(rawWs);
      if (
        ws?.workspaceType === 'Clinic' &&
        Number(ws?.clinicId) > 0 &&
        (ws?.accessLevel || '').toLowerCase() !== 'practitioner'
      ) {
        headers['X-Clinic-Id'] = String(ws.clinicId);
      }
    }
  } catch {
    // Ignore malformed workspace storage
  }

  const requestToSend = Object.keys(headers).length > 0
    ? req.clone({ setHeaders: headers })
    : req;

  return next(requestToSend).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        const isAuthEndpoint = /\/api\/Auth\//i.test(req.url);
        if (!isAuthEndpoint) {
          try {
            const authService = injector.get(Authservice);
            authService.logout();
          } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }

          if (isProtectedAppUrl(router.url)) {
            router.navigate(['/']);
          }
        }
      }
      return throwError(() => error);
    })
  );
};
