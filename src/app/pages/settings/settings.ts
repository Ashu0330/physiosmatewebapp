import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from '../../helper/base-component';
import { SharedModule } from '../../shared/shared-module';
import { ApiEndPoints } from '../../helper/api-endpoints';
import {
  UserProfileModel,
  PractitionerProfileModel,
  ClinicProfileModel,

} from '../../models/usermode';
import { ServiceItem } from '../../models/mastermodel';


export type SettingsTab =
  | 'profile'
  | 'notifications'
  | 'security'
  | 'helpcenter'
  | 'preferences'
  | 'delete-account';

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
  category: string;
  isOpen?: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings extends BaseComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  form: FormGroup;

  activeTab: SettingsTab = 'profile';
  doctorName = '';
  isSaving = false;

  // ── Photo Upload State ───────────────────────────────────────────────────
  photoPreview: string | null = null;
  photoFile: File | null = null;

  // ── Services Multi-Select (role 2 & 3) ───────────────────────────────────
  serviceList: ServiceItem[] = [];
  selectedServiceIds = new Set<number>();

  toggleService(id: number): void {
    if (this.selectedServiceIds.has(id)) {
      this.selectedServiceIds.delete(id);
    } else {
      this.selectedServiceIds.add(id);
    }
  }

  isServiceSelected(id: number): boolean {
    return this.selectedServiceIds.has(id);
  }

  /** Current user's role id: 1=Patient, 2=Practitioner, 3=Clinic */
  get roleId(): number | null {
    return this.authService.getRoleId();
  }



  // ── Tab 2: Notification Settings ─────────────────────────────────────────
  notifications = {
    // Clinical Alerts
    newBookings: true,
    cancellations: true,
    patientMessages: true,
    sessionReminders: true,
    urgentAlerts: true,

    // Communication Channels
    browserPush: true,
    emailNotifs: true,
    smsAlerts: true,
    whatsappNotifs: true,

    // Digest & Reports
    digestTime: '07:00 AM',
    weeklyReport: 'Every Monday',
    alertSound: 'Subtle Tone',
  };

  // ── Tab 3: Security & Credentials ─────────────────────────────────────────
  security = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    twoFactorEnabled: true,
  };

  activeSessions: ActiveSession[] = [
    {
      id: 'sess-01',
      device: 'Windows 11 PC',
      browser: 'Google Chrome 128.0',
      ipAddress: '152.58.112.45',
      location: 'Jaipur, Rajasthan, India',
      lastActive: 'Active Now',
      isCurrent: true,
    },
    {
      id: 'sess-02',
      device: 'iPhone 15 Pro',
      browser: 'Safari Mobile 18.1',
      ipAddress: '152.58.112.98',
      location: 'Jaipur, Rajasthan, India',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
    {
      id: 'sess-03',
      device: 'iPad Pro 11"',
      browser: 'Mobile Safari 17.5',
      ipAddress: '106.215.89.14',
      location: 'Delhi, India',
      lastActive: '3 days ago',
      isCurrent: false,
    },
  ];

  // ── Tab 4: Help Center & Support ─────────────────────────────────────────
  faqSearchQuery = '';
  ticketForm = {
    subject: '',
    category: 'Clinical & Patient Records',
    urgency: 'Normal',
    message: '',
  };

  faqs: FaqItem[] = [
    {
      question: 'How do I add and register a new patient in the Doctor Console?',
      answer:
        'Navigate to the "Add Patient" tab in the left sidebar or clinical console. Fill in the demographic information (Name, Mobile, Email, DOB, Address) and upload a photo if available. Once submitted, a permanent patient code (e.g. PT-1041) is created, and you can immediately initiate a consultation or assign a customized rehabilitation plan.',
      category: 'Patient Management',
      isOpen: true,
    },
    {
      question: 'How do video consultations work with remote patients?',
      answer:
        'When an online appointment is scheduled, a secure HIPAA-compliant video session room is automatically generated. Both doctor and patient receive SMS and email reminders 15 minutes prior with a direct join link. During the call, you can access the patient\'s past health records, make live assessment notes, and prescribe exercises.',
      category: 'Video Consultation',
      isOpen: false,
    },
    {
      question: 'How are treatment plans structured and monitored?',
      answer:
        'Treatment plans allow you to prescribe daily exercise protocols, repetition counts, and target recovery milestones. As patients log completed exercises or visit for in-clinic sessions, their recovery completion rate (%) dynamically increments in your dashboard overview.',
      category: 'Rehabilitation Plans',
      isOpen: false,
    },
    {
      question: 'When and how are consultation fees disbursed to my bank account?',
      answer:
        'Online consultation payments are reconciled automatically. Payouts are transferred via NEFT/IMPS to your registered bank account on a bi-weekly cycle (1st and 16th of every month) along with automated GST-compliant invoice summaries available in the Billing tab.',
      category: 'Billing & Payouts',
      isOpen: false,
    },
    {
      question: 'How does PhysiosMate protect sensitive patient health data?',
      answer:
        'All patient health records, diagnostic scans, and clinical notes are encrypted using AES-256 at rest and TLS 1.3 in transit. Our infrastructure adheres strictly to ISO 27001 and clinical data privacy standards with role-based access controls.',
      category: 'Data Security',
      isOpen: false,
    },
  ];

  // ── Tab 5: Practice & Clinic Preferences ─────────────────────────────────
  preferences = {
    defaultSessionDuration: '45',
    bufferTime: '10',
    defaultMode: 'In-Clinic & Video (Hybrid)',
    startTime: '09:00 AM',
    endTime: '07:00 PM',
    currency: 'INR (₹)',
    language: 'English (US/UK)',
    timezone: 'Asia/Kolkata (IST +05:30)',
    dateFormat: 'DD/MM/YYYY',
    calendarStartDay: 'Monday',
    autoConfirmBookings: true,
  };

  // ── Tab 6: Delete Account Safeguards ──────────────────────────────────────
  deleteAccountForm = {
    reason: '',
    feedback: '',
    confirmText: '',
    currentPassword: '',
    agreeConsequences: false,
  };

  ngOnInit(): void {
    this.CreateForm();
    this.GetProfile();
    this.LoadServices();

    // Seed photo preview from cached user session
    const user = this.currentUser;
    if (user?.profilePictureUrl) {
      this.photoPreview = user.profilePictureUrl;
    }

    // Check query params for initial tab selection (e.g. ?tab=notifications)
    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'] as SettingsTab;
      if (
        tab &&
        [
          'profile',
          'notifications',
          'security',
          'helpcenter',
          'preferences',
          'delete-account',
        ].includes(tab)
      ) {
        this.activeTab = tab;
      }
    });
  }

  // ── Tab Navigation ───────────────────────────────────────────────────────
  selectTab(tab: SettingsTab): void {
    this.activeTab = tab;
    // Update query params cleanly without full page refresh
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  goBack(): void {
    // Return to doctor dashboard or previous page
    if (this.currentUser?.roleId === 2 || this.currentUser?.practitionerId) {
      this.router.navigate(['/doctor-dashboard']);
    } else {
      this.router.navigate(['/user-dashboard']);
    }
  }

  // ── Profile Photo Upload & Management ────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      this.alert.toastWarning('Photo size must be under 5MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      this.alert.toastWarning('Supported image formats: JPG, PNG, WEBP.');
      return;
    }

    this.photoFile = file;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.photoPreview = e.target?.result as string;
      this.alert.toastSuccess('Profile photo uploaded. Click Save to apply.');
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.photoPreview = null;
    this.photoFile = null;
    this.alert.toastInfo('Photo removed.');
  }

  // ── Save Personal Info (all roles) ──────────────────────────────────────
  isSavingPersonal = false;

  async savePersonalInfo(): Promise<void> {
    this.isSavingPersonal = true;
    try {
      const form = new FormData();
      const data = this.form.value;
      debugger;
      form.append('fullName', data.fullName);
      form.append('email', data.email);
      form.append('mobile', data.mobile);
      form.append('gender', data.gender);
      form.append('dob', data.dob);
      form.append('city', data.city);
      form.append('state', data.state);
      if (this.photoFile) {
        form.append('file', this.photoFile);
      }

      const res = await this.apiService.Post<boolean>(ApiEndPoints.UpdateProfile, form);
      if (res.isSuccess) {
        const name: string = data.fullName;
        this.doctorName = this.roleId === 2
          ? (name.startsWith('Dr.') ? name : `Dr. ${name}`)
          : name;
        this.alert.toastSuccess('Personal information updated successfully!');
      } else {
        this.alert.toastError(res.message || 'Failed to update personal info.');
      }
    } finally {
      this.isSavingPersonal = false;
    }
  }

  // ── Save Professional Info (role 2 & 3 only) ────────────────────────────
  isSavingProfessional = false;

  async saveProfessionalInfo(): Promise<void> {
    this.isSavingProfessional = true;
    // Build services array from selected IDs
    const services = [...this.selectedServiceIds].map(id => ({ serviceId: id }));

    try {
      if (this.roleId === 2) {
        const payload = {
          practitionerId: this.form.get('practitionerId')?.value || this.authService.getCurrentProfessionalId(),
          specialization: this.form.get('specialization')?.value,
          specializationId: this.form.get('specializationId')?.value,
          experienceYears: this.form.get('experienceYears')?.value,
          consultationFee: this.form.get('consultationFee')?.value,
          about: this.form.get('about')?.value,
          services,
        };
        const res = await this.apiService.Post<boolean>(ApiEndPoints.UpdatePractitioner, payload);
        if (res.isSuccess) {
          this.alert.toastSuccess('Professional details updated successfully!');
        } else {
          this.alert.toastError(res.message || 'Failed to update professional details.');
        }
      } else if (this.roleId === 3) {
        const payload = {
          clinicId: this.form.get('clinicId')?.value || this.authService.getCurrentProfessionalId(),
          clinicName: this.form.get('clinicName')?.value,
          about: this.form.get('about')?.value,
          phone: this.form.get('phone')?.value,
          address: this.form.get('address')?.value,
          services,
        };
        const res = await this.apiService.Post<boolean>(ApiEndPoints.UpdateClinic, payload);
        if (res.isSuccess) {
          this.doctorName = this.form.get('clinicName')?.value || this.doctorName;
          this.alert.toastSuccess('Clinic details updated successfully!');
        } else {
          this.alert.toastError(res.message || 'Failed to update clinic details.');
        }
      }
    } finally {
      this.isSavingProfessional = false;
    }
  }

  // Keep the old method name as a no-op alias so form (ngSubmit) doesn't break
  async saveProfile(): Promise<void> { /* handled by savePersonalInfo / saveProfessionalInfo */ }

  resetProfile(): void {
    // Re-fetch from the server to restore original values
    this.GetProfile();
    this.alert.toastInfo('Form reset to saved values.');
  }


  // ── Save Notification Settings ───────────────────────────────────────────
  saveNotifications(): void {
    this.alert.toastSuccess('Notification preferences saved!');
  }

  // ── Update Password ──────────────────────────────────────────────────────
  updatePassword(): void {
    if (!this.security.currentPassword) {
      this.alert.toastWarning('Please enter your current password.');
      return;
    }
    if (!this.security.newPassword || this.security.newPassword.length < 8) {
      this.alert.toastWarning('New password must be at least 8 characters long.');
      return;
    }
    if (this.security.newPassword !== this.security.confirmPassword) {
      this.alert.toastWarning('New passwords do not match. Please verify.');
      return;
    }

    this.security.currentPassword = '';
    this.security.newPassword = '';
    this.security.confirmPassword = '';
    this.alert.toastSuccess('Account password updated successfully!');
  }

  // ── 2FA Toggle ───────────────────────────────────────────────────────────
  async toggle2FA(): Promise<void> {
    if (this.security.twoFactorEnabled) {
      const confirm = await this.alert.confirm(
        'Disable Two-Factor Authentication?',
        'This reduces the security level of your medical account.',
        'Yes, disable',
        'Keep enabled'
      );
      if (confirm.isConfirmed) {
        this.security.twoFactorEnabled = false;
        this.alert.toastInfo('Two-factor authentication disabled.');
      }
    } else {
      this.security.twoFactorEnabled = true;
      this.alert.toastSuccess('Two-factor authentication enabled via SMS/Authenticator!');
    }
  }

  // ── Session Management ───────────────────────────────────────────────────
  async revokeSession(id: string): Promise<void> {
    const confirm = await this.alert.confirm(
      'Log out this device?',
      'The session on this device will be terminated immediately.',
      'Log out device',
      'Cancel'
    );
    if (confirm.isConfirmed) {
      this.activeSessions = this.activeSessions.filter((s) => s.id !== id);
      this.alert.toastSuccess('Device session terminated.');
    }
  }

  async logoutAllOtherSessions(): Promise<void> {
    const confirm = await this.alert.confirm(
      'Log out all other devices?',
      'All active sessions except your current device will be terminated.',
      'Log out all',
      'Cancel'
    );
    if (confirm.isConfirmed) {
      this.activeSessions = this.activeSessions.filter((s) => s.isCurrent);
      this.alert.toastSuccess('All other sessions terminated successfully.');
    }
  }

  // ── Help Center Accordion & Ticket ───────────────────────────────────────
  toggleFaq(index: number): void {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }

  get filteredFaqs(): FaqItem[] {
    const q = this.faqSearchQuery.toLowerCase().trim();
    if (!q) return this.faqs;
    return this.faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }

  submitSupportTicket(): void {
    if (!this.ticketForm.subject.trim() || !this.ticketForm.message.trim()) {
      this.alert.toastWarning('Please enter both subject and message for your support ticket.');
      return;
    }

    this.alert.success(
      'Ticket Submitted!',
      'Your request (Ref: #PM-89421) has been logged. Our clinical support team will respond within 2 hours.'
    );
    this.ticketForm.subject = '';
    this.ticketForm.message = '';
  }

  // ── Practice Preferences ─────────────────────────────────────────────────
  savePreferences(): void {
    this.alert.toastSuccess('Practice & consultation preferences updated!');
  }

  // ── Delete Account & Data Backup ─────────────────────────────────────────
  downloadDataBackup(): void {
    this.alert.toastInfo('Preparing clinical records archive... Download will start shortly.');
    setTimeout(() => {
      this.alert.toastSuccess('Clinical data archive (ZIP) downloaded.');
    }, 1500);
  }

  get isDeleteFormValid(): boolean {
    return (
      this.deleteAccountForm.agreeConsequences &&
      this.deleteAccountForm.confirmText.trim().toUpperCase() === 'DELETE' &&
      this.deleteAccountForm.currentPassword.trim().length > 0 &&
      this.deleteAccountForm.reason.trim().length > 0
    );
  }

  async deleteAccount(): Promise<void> {
    if (!this.isDeleteFormValid) {
      this.alert.toastWarning(
        'Please complete all verification steps, type "DELETE", and check the agreement.'
      );
      return;
    }

    const res = await this.alert.confirmDelete(
      'Permanently Delete Account?',
      'All your clinical profile data, treatment plans, and appointment logs will be permanently erased. This cannot be undone.'
    );

    if (res.isConfirmed) {
      this.alert.success(
        'Account Deleted',
        'Your PhysiosMate practitioner account has been closed. You will now be redirected to the homepage.'
      );
      setTimeout(() => {
        this.authService.clearPendingVerification();
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        this.router.navigate(['/']);
      }, 2000);
    }
  }
  // ── Form Builders ─────────────────────────────────────────────────────────

  /** Base form — superset of all role-specific fields so no formControlName is ever missing on init */
  CreateForm(): void {
    this.form = this.fb.group({
      // ── Shared ─────────────────────────────────────────
      id: [0],
      fullName: [''],
      email: [''],
      mobile: [''],
      gender: [null],
      dob: [''],
      city: [''],
      state: [''],
      profileImageUrl: [''],
      // ── Patient ────────────────────────────────────────
      // (covered by shared fields above)
      // ── Practitioner ───────────────────────────────────
      practitionerId: [0],
      profileImage: [''],
      specialization: [''],
      specializationId: [null],
      experienceYears: [null],
      about: [''],
      consultationFee: [null],
      clinicId: [null],
      clinicName: [''],
      isVerified: [false],
      isActive: [false],
      isProfileCompleted: [false],
      // ── Clinic ─────────────────────────────────────────
      logoUrl: [''],
      bannerImageUrl: [''],
      address: [''],
      phone: [''],
    });
  }



  async GetProfile(): Promise<void> {
    const roleId = this.authService.getRoleId();

    // Step 1: Always load personal info (shared across all roles)
    await this.GetPatientProfile();

    // Step 2: Layer professional data on top for practitioner / clinic
    if (roleId === 2) {
      await this.GetPractitionerProfile();
    } else if (roleId === 3) {
      await this.GetClinicProfile();
    }
  }

  // ── Role-Based Profile Loaders ────────────────────────────────────────────

  /** Loads personal/contact info — called for ALL roles */
  async GetPatientProfile(): Promise<void> {
    const res = await this.apiService.Get<UserProfileModel>(ApiEndPoints.GetPatientProfile);
    if (!res.isSuccess || !res.data) return;
    this.CreateForm();
    this.form.patchValue(res.data);
    const name: string = res.data.fullName ?? '';
    this.doctorName = name || this.currentUser?.fullName || '';
    if (res.data.profileImageUrl) this.photoPreview = res.data.profileImageUrl;
  }

  async GetPractitionerProfile(): Promise<void> {
    const res = await this.apiService.Get<PractitionerProfileModel>(
      `${ApiEndPoints.GetPractitionerProfile}?practitionerId=${this.authService.getCurrentProfessionalId()}`
    );
    if (!res.isSuccess || !res.data) return;
    this.form.patchValue({
      practitionerId: res.data.practitionerId,
      profileImage: res.data.profileImage,
      specialization: res.data.specialization,
      specializationId: res.data.specializationId,
      experienceYears: res.data.experienceYears,
      about: res.data.about,
      consultationFee: res.data.consultationFee,
      clinicId: res.data.clinicId,
      clinicName: res.data.clinicName,
      isVerified: res.data.isVerified,
      isActive: res.data.isActive,
      isProfileCompleted: res.data.isProfileCompleted,
    });
    this.selectedServiceIds = new Set(
      (res.data.services ?? []).map(s => s.serviceId!).filter(id => id != null)
    );
    const name: string = this.form.get('fullName')?.value ?? '';
    this.doctorName = name.startsWith('Dr.') ? name : name ? `Dr. ${name}` : '';
    if (res.data.profileImage) this.photoPreview = res.data.profileImage;
  }

  /** Loads clinic professional data — called AFTER GetPatientProfile for role 3 */
  async GetClinicProfile(): Promise<void> {
    const res = await this.apiService.Get<ClinicProfileModel>(ApiEndPoints.GetClinicProfile);
    if (!res.isSuccess || !res.data) return;
    this.form.patchValue({
      clinicName: res.data.clinicName,
      logoUrl: res.data.logoUrl,
      bannerImageUrl: res.data.bannerImageUrl,
      about: res.data.about,
      address: res.data.address,
      phone: res.data.phone,
      isVerified: res.data.isVerified,
      isActive: res.data.isActive,
    });
    // Pre-select already saved services
    this.selectedServiceIds = new Set(
      (res.data.services ?? []).map(s => s.serviceId!).filter(id => id != null)
    );
    this.doctorName = res.data.clinicName ?? this.doctorName;
    if (res.data.logoUrl) this.photoPreview = res.data.logoUrl;
  }

  /** Fetches the master list of all available services */
  async LoadServices(): Promise<void> {
    const roleId = this.authService.getRoleId();
    if (roleId !== 2 && roleId !== 3) return; // only needed for professional roles
    const res = await this.apiService.Get<ServiceItem[]>(ApiEndPoints.GetAllServices);
    if (res.isSuccess && res.data) {
      this.serviceList = res.data;
    }
  }
}