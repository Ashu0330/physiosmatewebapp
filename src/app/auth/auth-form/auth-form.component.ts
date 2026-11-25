import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Authservice } from '../../services/authservice';
import { ClinicRelationshipService } from '../../services/clinic-relationship.service';
import { UserWorkspaceItemDto } from '../../models/clinic.model';
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
  private relationshipService = inject(ClinicRelationshipService);

  signupForm!: FormGroup;

  // ── Signals for zoneless change detection ──────────────────────────────────
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly isSignupOtpSending = signal(false);
  readonly signupOtpSent = signal(false);
  readonly signupOtpCountdown = signal(0);

  // ── Workspace / Profile Selection State (post-OTP) ─────────────────────────
  readonly showWorkspaceSelector = signal(false);
  readonly workspaceChoices = signal<UserWorkspaceItemDto[]>([]);
  readonly selectedWorkspaceIndex = signal<number>(0);
  readonly pendingAuthUser = signal<any>(null);

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
    if (this.isSignupOtpSending() || this.signupOtpCountdown() > 0) return;
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

      const userData: any = { ...(res.data ?? {}) };
      if (userData?.token) {
        this.authService.saveUserSession(userData, userData.token);
      }

      // Mid-booking context preserves instant redirect back to the booking flow
      if (this.bookingContext) {
        if (userData?.isProfileCompleted) {
          this.authService.clearPendingVerification();
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('physios_register_draft');
          }
          this.authSuccess.emit();
          return;
        }
        const email = this.signupForm.value.email;
        this.authService.setPendingVerification({
          email,
          isOtpVerified: true,
          isProfileCompleted: false,
          user: userData
        });
        this.otpVerified.emit({ email });
        return;
      }

      // Discover all authorized workspaces (Solo Practice, Clinic Practitioner, Owner/Manager/Staff/Branches)
      const profileOptions = await this.resolveLoginProfiles(userData);

      if (profileOptions.length > 1) {
        const primaryIdx = profileOptions.findIndex(w => w.isPrimary);
        this.selectedWorkspaceIndex.set(primaryIdx >= 0 ? primaryIdx : 0);
        this.workspaceChoices.set(profileOptions);
        this.pendingAuthUser.set(userData);
        this.showWorkspaceSelector.set(true);
        return;
      }

      if (profileOptions.length === 1) {
        this.completeLoginWithWorkspace(profileOptions[0], userData);
        return;
      }

      if (userData?.isProfileCompleted) {
        this.completeLoginWithWorkspace(null, userData);
        return;
      }

      // Brand-new account with no profile and no clinic/solo workspace -> proceed to registration
      const email = this.signupForm.value.email;
      this.authService.setPendingVerification({
        email: email,
        isOtpVerified: true,
        isProfileCompleted: false,
        user: userData
      });
      this.otpVerified.emit({ email: email });

    } finally {
      this.isLoading.set(false);
    }
  }

  private async resolveLoginProfiles(userData: any): Promise<UserWorkspaceItemDto[]> {
    try {
      const wsRes = await this.relationshipService.resolveWorkspaces();
      if (!wsRes.isSuccess || !wsRes.data) {
        return [];
      }

      const resolution = wsRes.data;
      if (resolution.practitionerId && resolution.practitionerId > 0) {
        userData.practitionerId = resolution.practitionerId;
      }
      return this.authService.buildProfileOptions(resolution, userData);
    } catch {
      return [];
    }
  }

  selectWorkspace(index: number): void {
    this.selectedWorkspaceIndex.set(index);
  }

  confirmWorkspaceSelection(): void {
    const choices = this.workspaceChoices();
    const chosen = choices[this.selectedWorkspaceIndex()] ?? choices[0] ?? null;
    this.completeLoginWithWorkspace(chosen, this.pendingAuthUser());
  }

  backToEmailLogin(): void {
    this.authService.logout();
    this.showWorkspaceSelector.set(false);
    this.workspaceChoices.set([]);
    this.pendingAuthUser.set(null);
    this.signupOtpSent.set(false);
    this.signupForm.patchValue({ otp: '' });
  }

  getWorkspaceTitle(ws: UserWorkspaceItemDto): string {
    if (ws.workspaceType === 'Solo') {
      return 'Solo Practitioner';
    }
    if (ws.workspaceType === 'Patient') {
      return 'Patient Account';
    }
    return ws.clinicName || 'Clinic Workspace';
  }

  getWorkspaceSubtitle(ws: UserWorkspaceItemDto): string {
    if (ws.workspaceType === 'Solo') {
      return 'Independent practice, personal schedule & patients';
    }
    if (ws.workspaceType === 'Patient') {
      return 'Personal health records, bookings & therapy plans';
    }
    const parts = [
      ws.branchName ? `${ws.branchName}${ws.branchCode ? ` (${ws.branchCode})` : ''}` : 'All Branches',
      ws.city,
    ].filter(Boolean);
    return parts.join(' • ');
  }

  getWorkspaceBadgeLabel(ws: UserWorkspaceItemDto): string {
    if (ws.workspaceType === 'Solo') return 'Solo Practice';
    if (ws.workspaceType === 'Patient') return 'Patient';
    return `Clinic ${ws.accessLevel || 'Member'}`;
  }

  private completeLoginWithWorkspace(workspace: UserWorkspaceItemDto | null, userData: any): void {
    this.authService.setActiveWorkspace(workspace, userData);
    this.authService.clearPendingVerification();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('physios_register_draft');
    }

    const targetRoute = this.authService.getWorkspaceNavigationRoute(workspace, userData?.roleId);
    this.router.navigate([targetRoute]);
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
