import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, signal, input, output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Authservice } from '../../services/authservice';
import { ApiEndPoints } from '../../helper/api-endpoints';
import { AppMessage } from '../../helper/app-message';
import { SharedModule } from '../../shared/shared-module';
import { BaseComponent } from '../../helper/base-component';

@Component({
  selector: 'app-auth-form',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './auth-form.component.html',
  styleUrl: './auth-form.component.css'
})
export class AuthFormComponent extends BaseComponent implements OnInit, OnDestroy {
  @Input() mode: 'login' | 'signup' = 'signup';
  @Input() bookingContext: boolean = false;
  @Input() providerName?: string;

  @Output() authSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'login' | 'signup'>();
  @Output() otpVerified = new EventEmitter<{ email: string }>();

  protected override authService = inject(Authservice);

  signupForm!: FormGroup;

  // ── Signals for zoneless change detection ──────────────────────────────────
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly isSignupOtpSending = signal(false);
  readonly signupOtpSent = signal(false);
  readonly signupOtpCountdown = signal(0);

  private signupOtpTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.initForms();
  }

  ngOnDestroy(): void {
    if (this.signupOtpTimer) clearInterval(this.signupOtpTimer);
  }

  initForms(): void {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      terms: [true, [Validators.requiredTrue]]
    });
  }

  // ── Send OTP ────────────────────────────────────────────────────────────────

  async sendSignupOtp(): Promise<void> {
    const emailCtrl = this.signupForm.get('email');
    if (!emailCtrl || emailCtrl.invalid) {
      emailCtrl?.markAsTouched();
      this.alert.toastError('Please enter a valid email address.');
      return;
    }

    this.isSignupOtpSending.set(true);
    this.errorMessage.set('');

    try {
      const email = emailCtrl.value.trim();

      const formData = new FormData();
      formData.append('Email', email);
      formData.append('IsLogin', 'true');
      formData.append('IsSignIn', 'true');

      const res = await this.apiService.PostForm<any>(ApiEndPoints.Register, formData);

      if (!res.isSuccess) {
        this.alert.toastError(res.message || 'Unable to send OTP. Please try again.');
        return;
      }

      this.signupOtpSent.set(true);

      if (res.data?.id) {
        this.authService.setPendingUserId(res.data.id);
      }

      this.alert.toastSuccess(AppMessage.OtpSent);
      this.startSignupOtpCountdown();

    } finally {
      this.isSignupOtpSending.set(false);
    }
  }

  // ── Verify OTP ─────────────────────────────────────────────────────────────

  async verifyOtp(): Promise<void> {
    const otpCtrl = this.signupForm.get('otp');
    if (!otpCtrl || otpCtrl.invalid) {
      otpCtrl?.markAsTouched();
      this.alert.toastError('Please enter the 6-digit OTP sent to your email.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const model = {
        otpCode: this.signupForm.value.otp,
        oTPType: 'Email',
        email: this.signupForm.value.email,
        userid: this.authService.getPendingUserId() ?? this.authService.getuserid()
      };

      const res = await this.apiService.Post<any>(ApiEndPoints.VerifyOtp, model);

      if (!res.isSuccess) {
        this.alert.toastError(res.message || 'OTP verification failed. Please try again.');
        return;
      }

      this.authService.clearPendingUserId();
      this.alert.toastSuccess(AppMessage.OtpVerified);

      if (res.data?.isProfileCompleted) {
        this.authService.saveUserSession(res.data, res.data.token);
        this.authService.clearPendingVerification();
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('physios_register_draft');
        }

        if (this.bookingContext) {
          this.authSuccess.emit();
        } else {
          const roleId = res.data?.roleId ?? this.authService.getRoleId();
          if (roleId === 2) {
            this.router.navigate(['/doctor-dashboard']);
          } else if (roleId === 3) {
            this.router.navigate(['/clinics']);
          } else {
            this.router.navigate(['/user-dashboard']);
          }
        }
        return;
      }

      // Profile is NOT completed -> save pending state and proceed to registration
      const email = this.signupForm.value.email;
      this.authService.setPendingVerification({
        email: email,
        isOtpVerified: true,
        isProfileCompleted: false,
        user: res.data
      });
      if (res.data?.token) {
        this.authService.saveUserSession(res.data, res.data.token);
      }

      this.otpVerified.emit({ email: email });

    } finally {
      this.isLoading.set(false);
    }
  }

  // ── OTP countdown timer ────────────────────────────────────────────────────

  startSignupOtpCountdown(): void {
    this.signupOtpCountdown.set(30);
    if (this.signupOtpTimer) clearInterval(this.signupOtpTimer);
    this.signupOtpTimer = setInterval(() => {
      this.signupOtpCountdown.update(v => v - 1);
      if (this.signupOtpCountdown() <= 0) {
        clearInterval(this.signupOtpTimer!);
        this.signupOtpTimer = null;
        this.signupOtpCountdown.set(0);
      }
    }, 1000);
  }
}
