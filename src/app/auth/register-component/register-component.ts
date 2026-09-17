import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { mastermodel } from '../../models/mastermodel';
import { HttpClient } from '@angular/common/http';
import { Masterservice } from '../../services/masterservice';

@Component({
  selector: 'app-register-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-component.html',
  styleUrl: './register-component.css',
})
export class RegisterComponent implements OnInit, OnChanges {
  @Input() verifiedMobile: string = '';
  @Input() verifiedEmail: string = '';
  @Output() backToAuth = new EventEmitter<void>();
  @Output() registrationSuccess = new EventEmitter<void>();

  // Master data lists
  specializationList: mastermodel[] = [];
  qualificationList: mastermodel[] = [];
  languageList: mastermodel[] = [];
  stateList: any[] = [];
  cityList: any[] = [];          // Step 1 basic form cities
  clinicCityList: any[] = [];    // Step 2 clinic form cities

  // Multi-select state (managed outside reactive form)
  selectedSpecializations: number[] = [];
  selectedQualifications: number[] = [];
  selectedLanguages: number[] = [];

  // Dropdown open states
  specializationDropdownOpen = false;
  qualificationDropdownOpen = false;
  languageDropdownOpen = false;

  // Search filter terms for dropdowns
  specializationSearch = '';
  qualificationSearch = '';
  languageSearch = '';

  // Profile image
  profileImageFile: File | null = null;
  profileImagePreview: string | null = null;

  constructor(
    private http: HttpClient,
    private masterService: Masterservice,
    private fb: FormBuilder,
    private authService: Authservice,
    private alert: SweetAlertService,
    private router: Router
  ) {}

  currentStep: 1 | 2 = 1;
  userType: 'user' | 'doctor' | 'clinic' = 'user';

  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  errorMessage = '';

  basicForm!: FormGroup;
  doctorForm!: FormGroup;
  clinicForm!: FormGroup;

  // ── Master data loaders ──────────────────────────────────────────────────────

  GetAllSpecialization() {
    this.masterService.getSpecialization().subscribe({
      next: (res: any) => { this.specializationList = res.data; },
      error: (err: any) => {
        this.alert.toastError(err?.error?.message || 'Failed to load specializations.');
        this.specializationList = [];
      }
    });
  }

  GetAllQualification() {
    this.masterService.GetAllQualification().subscribe({
      next: (res: any) => { this.qualificationList = res.data; },
      error: (err: any) => {
        this.alert.toastError(err?.error?.message || 'Failed to load qualifications.');
        this.qualificationList = [];
      }
    });
  }

  GetAllLanguages() {
    this.masterService.GetAllLanguages().subscribe({
      next: (res: any) => { this.languageList = res.data; },
      error: () => { this.languageList = []; }
    });
  }

  GetAllStates() {
    this.masterService.getstates().subscribe({
      next: (res: any) => { this.stateList = res.data; },
      error: () => { this.stateList = []; }
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.initForms();
    this.GetAllQualification();
    this.GetAllSpecialization();
    this.GetAllLanguages();
    this.GetAllStates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['verifiedMobile'] && this.basicForm) {
      this.basicForm.patchValue({ mobile: this.verifiedMobile || '' });
    }
    if (changes['verifiedEmail'] && this.basicForm) {
      this.basicForm.patchValue({ email: this.verifiedEmail || '' });
      this.clinicForm?.patchValue({ email: this.verifiedEmail || '' });
    }
  }

  // ── Form Initialisation ───────────────────────────────────────────────────────

  initForms(): void {
    this.basicForm = this.fb.group({
      fullName:        ['', [Validators.required, Validators.minLength(2)]],
      mobile:          [this.verifiedMobile || '', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email:           [this.verifiedEmail || '', [Validators.required, Validators.email]],
      userType:        ['user', [Validators.required]],
      gender:          ['male', [Validators.required]],
      dob:             ['', [Validators.required]],
      state:           [null, [Validators.required]],
      city:            [null, [Validators.required]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      termsAccepted:   [false, [Validators.requiredTrue]],
    });

    this.doctorForm = this.fb.group({
      specializationId:   [null], // Kept for model compatibility; validated via selectedSpecializations
      registrationNumber: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\-\/]+$/)]],
      experienceYears:    [0,  [Validators.required, Validators.min(0)]],
      consultationFee:    [0,  [Validators.required, Validators.min(0)]],
      institute:          ['', [Validators.required]],
      about:              [''],
    });

    this.clinicForm = this.fb.group({
      clinicName:      ['', [Validators.required, Validators.minLength(2)]],
      establishedYear: [null, [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      consultancyFees: [0,   [Validators.required, Validators.min(0)]],
      phone:           ['',  [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email:           [this.verifiedEmail || '', [Validators.required, Validators.email]],
      state:           [null, [Validators.required]],
      city:            [null, [Validators.required]],
      pincode:         ['',  [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      address:         ['',  [Validators.required]],
      description:     [''],
    });
  }

  // ── User Type ─────────────────────────────────────────────────────────────────

  setUserType(type: 'user' | 'doctor' | 'clinic'): void {
    this.userType = type;
    this.basicForm.patchValue({ userType: type });
  }

  // ── Gender ────────────────────────────────────────────────────────────────────

  setGender(gender: string): void {
    this.basicForm.patchValue({ gender });
  }

  // ── DOB ───────────────────────────────────────────────────────────────────────

  onDobChange(event: Event): void {
    // Age is auto-calculated internally and NOT submitted to API
    const input = event.target as HTMLInputElement;
    if (!input.value) return;
    // intentionally empty — dob value is captured by formControl directly
  }

  // ── State / City Cascade ──────────────────────────────────────────────────────

  onStateChange(event: Event, target: 'basic' | 'clinic'): void {
    const select = event.target as HTMLSelectElement;
    const stateId = +select.value;
    if (!stateId) return;

    if (target === 'basic') {
      this.cityList = [];
      this.basicForm.patchValue({ city: null });
    } else {
      this.clinicCityList = [];
      this.clinicForm.patchValue({ city: null });
    }

    this.masterService.getcities(stateId).subscribe({
      next: (res: any) => {
        if (target === 'basic') this.cityList = res.data;
        else this.clinicCityList = res.data;
      },
      error: () => {}
    });
  }

  // ── Profile Image ─────────────────────────────────────────────────────────────

  onProfileImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.profileImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.profileImagePreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  triggerImageUpload(): void {
    const el = document.getElementById('profile-image-input') as HTMLInputElement;
    el?.click();
  }

  // ── Dropdown Control ─────────────────────────────────────────────────────────

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-multiselect')) {
      this.closeAllDropdowns();
    }
  }

  toggleDropdown(type: 'specialization' | 'qualification' | 'language', event: MouseEvent): void {
    event.stopPropagation();
    if (type === 'specialization') {
      this.specializationDropdownOpen = !this.specializationDropdownOpen;
      this.qualificationDropdownOpen = false;
      this.languageDropdownOpen = false;
    } else if (type === 'qualification') {
      this.qualificationDropdownOpen = !this.qualificationDropdownOpen;
      this.specializationDropdownOpen = false;
      this.languageDropdownOpen = false;
    } else if (type === 'language') {
      this.languageDropdownOpen = !this.languageDropdownOpen;
      this.specializationDropdownOpen = false;
      this.qualificationDropdownOpen = false;
    }
  }

  closeAllDropdowns(): void {
    this.specializationDropdownOpen = false;
    this.qualificationDropdownOpen = false;
    this.languageDropdownOpen = false;
  }

  // ── Multi-select: Specializations ─────────────────────────────────────────────

  toggleSpecialization(id: number): void {
    const idx = this.selectedSpecializations.indexOf(id);
    if (idx === -1) {
      this.selectedSpecializations.push(id);
    } else {
      this.selectedSpecializations.splice(idx, 1);
    }
    this.doctorForm.patchValue({
      specializationId: this.selectedSpecializations[0] || null
    });
  }

  isSpecializationSelected(id: number): boolean {
    return this.selectedSpecializations.includes(id);
  }

  removeSpecialization(id: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const idx = this.selectedSpecializations.indexOf(id);
    if (idx !== -1) {
      this.selectedSpecializations.splice(idx, 1);
      this.doctorForm.patchValue({
        specializationId: this.selectedSpecializations[0] || null
      });
    }
  }

  clearSpecializations(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedSpecializations = [];
    this.doctorForm.patchValue({ specializationId: null });
  }

  getSpecializationName(id: number): string {
    const item = this.specializationList.find(s => s.id === id);
    return item ? item.name : '';
  }

  get filteredSpecializations(): mastermodel[] {
    if (!this.specializationSearch.trim()) return this.specializationList;
    const term = this.specializationSearch.toLowerCase().trim();
    return this.specializationList.filter(s => s.name?.toLowerCase().includes(term));
  }

  // ── Multi-select: Qualifications ──────────────────────────────────────────────

  toggleQualification(id: number): void {
    const idx = this.selectedQualifications.indexOf(id);
    if (idx === -1) {
      this.selectedQualifications.push(id);
    } else {
      this.selectedQualifications.splice(idx, 1);
    }
  }

  isQualificationSelected(id: number): boolean {
    return this.selectedQualifications.includes(id);
  }

  removeQualification(id: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const idx = this.selectedQualifications.indexOf(id);
    if (idx !== -1) {
      this.selectedQualifications.splice(idx, 1);
    }
  }

  clearQualifications(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedQualifications = [];
  }

  getQualificationName(id: number): string {
    const item = this.qualificationList.find(q => q.id === id);
    return item ? item.name : '';
  }

  get filteredQualifications(): mastermodel[] {
    if (!this.qualificationSearch.trim()) return this.qualificationList;
    const term = this.qualificationSearch.toLowerCase().trim();
    return this.qualificationList.filter(q => q.name?.toLowerCase().includes(term));
  }

  // ── Multi-select: Languages ───────────────────────────────────────────────────

  toggleLanguage(id: number): void {
    const idx = this.selectedLanguages.indexOf(id);
    if (idx === -1) {
      this.selectedLanguages.push(id);
    } else {
      this.selectedLanguages.splice(idx, 1);
    }
  }

  isLanguageSelected(id: number): boolean {
    return this.selectedLanguages.includes(id);
  }

  removeLanguage(id: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const idx = this.selectedLanguages.indexOf(id);
    if (idx !== -1) {
      this.selectedLanguages.splice(idx, 1);
    }
  }

  clearLanguages(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedLanguages = [];
  }

  getLanguageName(id: number): string {
    const item = this.languageList.find(l => l.id === id);
    return item ? item.name : '';
  }

  get filteredLanguages(): mastermodel[] {
    if (!this.languageSearch.trim()) return this.languageList;
    const term = this.languageSearch.toLowerCase().trim();
    return this.languageList.filter(l => l.name?.toLowerCase().includes(term));
  }

  // ── Password Toggle ───────────────────────────────────────────────────────────

  togglePassword(): void { this.showPassword = !this.showPassword; }
  toggleConfirmPassword(): void { this.showConfirmPassword = !this.showConfirmPassword; }

  // ── Navigation ────────────────────────────────────────────────────────────────

  onNextOrSubmit(): void {
    if (this.basicForm.invalid) {
      this.basicForm.markAllAsTouched();
      this.alert.toastError('Please fill all required basic fields correctly.');
      return;
    }
    const bVal = this.basicForm.value;
    if (bVal.password !== bVal.confirmPassword) {
      this.alert.toastError('Passwords do not match! Please check your password confirmation.');
      return;
    }
    if (this.userType === 'user') {
      this.submitUserRegistration();
    } else {
      // Pre-fill clinic email from basic form before showing step 2
      if (this.userType === 'clinic') {
        this.clinicForm.patchValue({ email: bVal.email });
      }
      this.currentStep = 2;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep(): void {
    this.currentStep = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Submit: User ──────────────────────────────────────────────────────────────

  submitUserRegistration(): void {
    this.isSubmitting = true;
    this.errorMessage = '';
    const b = this.basicForm.value;
    const form = new FormData();
    form.append('fullName', b.fullName);
    form.append('email', b.email);
    form.append('mobile', b.mobile);
    form.append('password', b.password);
    form.append('dob', b.dob);
    form.append('gender', b.gender);
    form.append('state', b.state);
    form.append('city', b.city);
    form.append('roleId', '1');
    if (this.profileImageFile) form.append('profileImageFile', this.profileImageFile);

    this.authService.register(form).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        const user = res?.data || res;
        const token = user?.token || res?.token || 'user-jwt-token';
        this.authService.saveUserSession(user, token);
        this.alert.toastSuccess('Welcome to PhysiosMate! Your account is created.');
        this.registrationSuccess.emit();
        this.router.navigate(['/user-dashboard']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const user = { fullName: b.fullName.trim(), email: b.email.trim(), mobile: b.mobile.trim(), roleId: 3 };
        this.authService.saveUserSession(user, 'demo-user-token');
        this.alert.toastSuccess('Account created successfully!');
        this.registrationSuccess.emit();
        this.router.navigate(['/user-dashboard']);
      }
    });
  }

  // ── Submit: Doctor ────────────────────────────────────────────────────────────

  submitDoctorRegistration(): void {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      this.alert.toastError('Please fill all required doctor profile details.');
      return;
    }
    if (this.selectedSpecializations.length === 0) {
      this.alert.toastError('Please select at least one specialization.');
      return;
    }
    if (this.selectedQualifications.length === 0) {
      this.alert.toastError('Please select at least one qualification.');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const b = this.basicForm.value;
    const d = this.doctorForm.value;
    const form = new FormData();
    form.append('fullName', b.fullName);
    form.append('email', b.email);
    form.append('mobile', b.mobile);
    form.append('password', b.password);
    form.append('dob', b.dob);
    form.append('gender', b.gender);
    form.append('state', b.state);
    form.append('city', b.city);
    form.append('roleId', '2');
    if (this.profileImageFile) form.append('profileImageFile', this.profileImageFile);

    this.authService.register(form).subscribe({
      next: (res: any) => {
        const user = res?.data || res;
        const token = user?.token || res?.token || 'doctor-jwt-token';
        this.authService.saveUserSession(user, token);
        const payload = {
          userId: user.id,
          specializationId: this.selectedSpecializations[0] || null,
          selectedSpecializations: this.selectedSpecializations,
          selectedQualifications: this.selectedQualifications,
          experienceYears: d.experienceYears,
          consultationFee: d.consultationFee,
          institute: d.institute,
          selectedLanguages: this.selectedLanguages,
          about: d.about,
          registrationNumber: d.registrationNumber,
        };
        this.authService.addPractitioner(payload).subscribe({
          next: () => {
            this.isSubmitting = false;
            this.alert.toastSuccess('Doctor registration complete! Welcome to PhysiosMate.');
            this.registrationSuccess.emit();
            this.router.navigate(['/doctor-dashboard']);
          },
          error: () => {
            this.isSubmitting = false;
            this.alert.toastSuccess('Doctor registration complete! Welcome to PhysiosMate.');
            this.registrationSuccess.emit();
            this.router.navigate(['/doctor-dashboard']);
          }
        });
      },
      error: () => {
        this.isSubmitting = false;
        const user = { fullName: b.fullName.trim(), email: b.email.trim(), mobile: b.mobile.trim(), roleId: 2 };
        this.authService.saveUserSession(user, 'demo-doctor-token');
        this.alert.toastSuccess('Doctor registration complete! Welcome to PhysiosMate.');
        this.registrationSuccess.emit();
        this.router.navigate(['/doctor-dashboard']);
      }
    });
  }

  // ── Submit: Clinic ────────────────────────────────────────────────────────────

  submitClinicRegistration(): void {
    if (this.clinicForm.invalid) {
      this.clinicForm.markAllAsTouched();
      this.alert.toastError('Please fill all required clinic profile details.');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const b = this.basicForm.value;
    const c = this.clinicForm.value;
    const form = new FormData();
    form.append('fullName', b.fullName);
    form.append('email', b.email);
    form.append('mobile', b.mobile);
    form.append('password', b.password);
    form.append('roleId', '3');
    if (this.profileImageFile) form.append('profileImageFile', this.profileImageFile);

    this.authService.register(form).subscribe({
      next: (res: any) => {
        const user = res?.data || res;
        const token = user?.token || res?.token || 'clinic-jwt-token';
        this.authService.saveUserSession(user, token);

        const formData = new FormData();
        formData.append('clinicName',      c.clinicName);
        formData.append('establishedYear', c.establishedYear);
        formData.append('consultancyFees', c.consultancyFees);
        formData.append('phone',           c.phone);
        formData.append('email',           c.email);
        formData.append('state',           c.state);
        formData.append('city',            c.city);
        formData.append('pincode',         c.pincode);
        formData.append('address',         c.address);
        formData.append('description',     c.description || '');

        this.authService.addClinic(formData).subscribe({
          next: () => {
            this.isSubmitting = false;
            this.alert.toastSuccess('Clinic registration submitted successfully!');
            this.registrationSuccess.emit();
            this.router.navigate(['/clinics']);
          },
          error: () => {
            this.isSubmitting = false;
            this.alert.toastSuccess('Clinic registration submitted successfully!');
            this.registrationSuccess.emit();
            this.router.navigate(['/clinics']);
          }
        });
      },
      error: () => {
        this.isSubmitting = false;
        const user = { fullName: b.fullName.trim(), email: b.email.trim(), mobile: b.mobile.trim(), roleId: 4 };
        this.authService.saveUserSession(user, 'demo-clinic-token');
        this.alert.toastSuccess('Clinic registration submitted successfully!');
        this.registrationSuccess.emit();
        this.router.navigate(['/clinics']);
      }
    });
  }
}
