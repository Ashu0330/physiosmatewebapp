import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { SharedModule } from '../../shared/shared-module';

@Component({
  selector: 'app-auth-form',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './auth-form.component.html',
  styleUrl: './auth-form.component.css'
})
export class AuthFormComponent implements OnInit, OnDestroy {
  @Input() mode: 'login' | 'signup' = 'signup';
  @Input() bookingContext: boolean = false;
  @Input() providerName?: string;

  @Output() authSuccess = new EventEmitter<void>();
  @Output() modeChange = new EventEmitter<'login' | 'signup'>();
  @Output() otpVerified = new EventEmitter<{ email: string }>();

  private fb = inject(FormBuilder);
  private authService = inject(Authservice);
  private alert = inject(SweetAlertService);
  private router = inject(Router);


  signupForm!: FormGroup;
  showSignupPassword = false;
  isLoading = false;
  errorMessage = '';

  isSignupOtpSending = false;
  signupOtpSent = false;
  signupOtpCountdown = 0;
  signupOtpTimer: any = null;

  ngOnInit(): void {
    this.initForms();
  }

  ngOnDestroy(): void {

    if (this.signupOtpTimer) {
      clearInterval(this.signupOtpTimer);
    }
  }

  initForms(): void {

    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6)]],
      terms: [true, [Validators.requiredTrue]]
    });


  }



  toggleSignupPassword(): void {
    this.showSignupPassword = !this.showSignupPassword;
  }



  sendSignupOtp(): void {
    const emailCtrl = this.signupForm.get('email');
    if (!emailCtrl || emailCtrl.invalid) {
      emailCtrl?.markAsTouched();
      this.alert.toastError('Please enter a valid email address');
      return;
    }

    const email = emailCtrl.value.trim();
    this.isSignupOtpSending = true;
    this.errorMessage = '';
    const formData = new FormData();
    formData.append('Email', email);
    formData.append('IsLogin', 'true');
    formData.append('IsSignIn', 'true');

    this.authService.register(formData).subscribe({
      next: (res: any) => {
        if (res.isSuccess == true) {
          this.isSignupOtpSending = false;
          this.signupOtpSent = true;
          localStorage.setItem('userid', res.data.id)
          this.alert.toastSuccess('Verification OTP sent to ' + email);
          this.startSignupOtpCountdown();
        }
        else {
          this.isSignupOtpSending = false;
          this.alert.toastError(res.message);
        }
      },
      error: (err: any) => {
        this.isSignupOtpSending = false;
        console.warn('sendSignupOtp fallback or error:', err);
        this.signupOtpSent = true;
        this.alert.toastSuccess('Verification OTP sent to ' + email);
        this.startSignupOtpCountdown();
      }
    });
  }

  startSignupOtpCountdown(): void {
    this.signupOtpCountdown = 30;
    if (this.signupOtpTimer) {
      clearInterval(this.signupOtpTimer);
    }
    this.signupOtpTimer = setInterval(() => {
      this.signupOtpCountdown--;
      if (this.signupOtpCountdown <= 0) {
        clearInterval(this.signupOtpTimer);
        this.signupOtpTimer = null;
      }
    }, 1000);
  }

  verifyOtp(): void {
    this.isLoading = true;
    const model = {
      otpCode: this.signupForm.value.otp,
      oTPType: 'Email',
      email: this.signupForm.value.email,
      userid: localStorage.getItem('userid')
    };

    this.authService.verifyOtp(model).subscribe({
      next: (res: any) => {
        if (res.isSuccess == true) {
          this.isLoading = false;
          this.alert.toastSuccess('OTP verified! Proceeding to registration.');
          if (res.data.isProfileCompleted == true) {
            this.authService.saveUserSession(res.data, res.data.token);
            this.router.navigate(['/'])
          }
          this.otpVerified.emit({ email: this.signupForm.value.email });
        } else {
          this.isLoading = false;
          this.alert.toastError(res?.message || 'OTP verification failed. Please try again.');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.alert.toastError(err?.error?.message || 'OTP verification failed. Please try again.');
      }
    });
  }
}
