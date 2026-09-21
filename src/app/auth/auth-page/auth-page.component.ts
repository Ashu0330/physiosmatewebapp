import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthFormComponent } from '../auth-form/auth-form.component';
import { RegisterComponent } from '../register-component/register-component';
import { BaseComponent } from '../../helper/base-component';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, RouterLink, AuthFormComponent, RegisterComponent],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.css'
})
export class AuthPageComponent extends BaseComponent implements OnInit {
  private route = inject(ActivatedRoute);

  authMode: 'login' | 'signup' = 'login';
  returnUrl: string = '/';

  isOtpVerified = false;
  verifiedEmail = '';

  ngOnInit(): void {
    const isBrowser = typeof window !== 'undefined';
    const currentPath = isBrowser ? window.location.pathname : this.router.url;
    const isRegisterRoute = currentPath.includes('/register') || this.route.snapshot.routeConfig?.path === 'register';
    const pending = this.authService.getPendingVerification();

    if (pending?.isOtpVerified && pending?.email) {
      this.isOtpVerified = true;
      this.verifiedEmail = pending.email;
      if (!isRegisterRoute) {
        this.router.navigate(['/register'], { replaceUrl: true });
      }
    } else {
      if (isRegisterRoute) {
        // Direct access to /register without verified OTP -> redirect to login
        this.router.navigate(['/login'], { replaceUrl: true });
        return;
      }
      if (currentPath.includes('/signup') || this.router.url.includes('/signup')) {
        this.authMode = 'signup';
      } else {
        this.authMode = 'login';
      }
    }

    const paramReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (paramReturnUrl) {
      this.returnUrl = paramReturnUrl;
    }
  }

  onModeChange(mode: 'login' | 'signup'): void {
    this.authMode = mode;
    this.isOtpVerified = false;
    this.authService.clearPendingVerification();
  }

  onOtpVerified(data: { email: string }): void {
    this.verifiedEmail = data.email;
    this.isOtpVerified = true;
    this.authService.setPendingVerification({ email: data.email, isOtpVerified: true });
    const isBrowser = typeof window !== 'undefined';
    const currentPath = isBrowser ? window.location.pathname : this.router.url;
    if (!currentPath.includes('/register')) {
      this.router.navigate(['/register'], { replaceUrl: true });
    }
  }

  onBackToAuth(): void {
    this.isOtpVerified = false;
    this.verifiedEmail = '';
    this.authService.clearPendingVerification();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  onAuthSuccess(): void {
    this.authService.clearPendingVerification();
    if (this.returnUrl && this.returnUrl !== '/') {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    this.router.navigate(['/']);

  }
}

