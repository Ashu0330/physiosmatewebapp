import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthFormComponent } from '../auth-form/auth-form.component';
import { RegisterComponent } from '../register-component/register-component';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, RouterLink, AuthFormComponent, RegisterComponent],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.css'
})
export class AuthPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  authMode: 'login' | 'signup' = 'login';
  returnUrl: string = '/';

  isOtpVerified = false;
  verifiedEmail = '';

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/signup')) {
      this.authMode = 'signup';
    } else {
      this.authMode = 'login';
    }
    const paramReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (paramReturnUrl) {
      this.returnUrl = paramReturnUrl;
    }
  }

  onModeChange(mode: 'login' | 'signup'): void {
    this.authMode = mode;
    this.isOtpVerified = false;
  }

  onOtpVerified(data: { email: string }): void {
    this.verifiedEmail = data.email;
    this.isOtpVerified = true;
  }

  onBackToAuth(): void {
    this.isOtpVerified = false;
  }

  onAuthSuccess(): void {
    this.router.navigateByUrl(this.returnUrl);
  }
}
