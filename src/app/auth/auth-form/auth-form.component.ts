import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Authservice } from '../../services/authservice';
import { SweetAlertService } from '../../services/sweet-alert.service';

@Component({
  selector: 'app-auth-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-form.component.html',
  styleUrl: './auth-form.component.css'
})
export class AuthFormComponent implements OnInit {
  @Input() mode: 'login' | 'signup' = 'login';
  @Input() bookingContext: boolean = false;
  @Input() providerName?: string;

  @Output() authSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'login' | 'signup'>();

  private fb = inject(FormBuilder);
  private authService = inject(Authservice);
  private alert = inject(SweetAlertService);

  loginForm!: FormGroup;
  signupForm!: FormGroup;

  showPassword = false;
  showSignupPassword = false;
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.initForms();
  }

  initForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      rememberMe: [true]
    });

    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      terms: [true, [Validators.requiredTrue]]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleSignupPassword(): void {
    this.showSignupPassword = !this.showSignupPassword;
  }

  switchMode(newMode: 'login' | 'signup'): void {
    this.mode = newMode;
    this.errorMessage = '';
    this.modeChange.emit(newMode);
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    debugger;
    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      email: this.loginForm.value.email.trim(),
      password: this.loginForm.value.password
    };

    console.log('Calling login API:', payload);

    this.authService.login(payload).subscribe({
      next: (res: any) => {
        console.log('SUCCESS:', res);

        this.isLoading = false;

        if (res && (res.isSuccess || res.token || res.data)) {
          const user = res.data || res;
          const token = user.token || res.token;

          this.authService.saveUserSession(user, token);
          this.alert.toastSuccess('Welcome back to PhysiosMate!');
          this.authSuccess.emit();
        } else {
          this.errorMessage =
            res.message || 'Login failed. Please verify your credentials.';

          this.alert.toastError(this.errorMessage);
        }
      },

      error: (err: any) => {
        console.error('LOGIN ERROR:', err);

        this.isLoading = false;

        const msg =
          err.error?.message ||
          err.message ||
          'Unable to connect to server. Please try again.';

        this.errorMessage = msg;
        this.alert.toastError(msg);
      }
    });
  }

  onSignup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const val = this.signupForm.value;
    const payload = {
      fullName: val.fullName.trim(),
      email: val.email.trim(),
      mobile: val.mobile.trim(),
      password: val.password,
      roleId: 3 // Patient / User
    };

    this.authService.register(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && (res.isSuccess || res.data || res.token)) {
          const user = res.data || res;
          const token = user.token || res.token || 'demo-jwt-token';
          this.authService.saveUserSession(user, token);
          this.alert.toastSuccess('Account created successfully!');
          this.authSuccess.emit();
        } else {
          this.errorMessage = res.message || 'Registration failed. Please try again.';
          this.alert.toastError(this.errorMessage);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err.error?.message || err.message || 'Registration failed. Please check your details.';
        this.errorMessage = msg;
        this.alert.toastError(msg);
      }
    });
  }

  // Quick Demo Login helper for convenience during review/testing
  fillDemoCredentials(): void {
    this.loginForm.patchValue({
      email: 'patient@physiosmate.com',
      password: 'password123'
    });
  }
}
