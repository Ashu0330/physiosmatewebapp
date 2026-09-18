import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { SweetAlertService } from '../../services/sweet-alert.service';
import { mastermodel } from '../../models/mastermodel';
import { HttpClient } from '@angular/common/http';
import { Masterservice } from '../../services/masterservice';
import { role } from '../../helper/utilities';

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

  specializationList: mastermodel[] = [];
  qualificationList: mastermodel[] = [];
  languageList: mastermodel[] = [];
  stateList: any[] = [];
  cityList: any[] = [];

  selectedSpecializations: number[] = [];
  selectedQualifications: number[] = [];
  selectedLanguages: number[] = [];

  specializationDropdownOpen = false;
  qualificationDropdownOpen = false;
  languageDropdownOpen = false;

  specializationSearch = '';
  qualificationSearch = '';
  languageSearch = '';
  profileImageFile: File | null = null;
  profileImagePreview: string | null = null;

  // Clinic-specific image uploads
  clinicLogoFile: File | null = null;
  clinicLogoPreview: string | null = null;

  clinicBannerFile: File | null = null;
  clinicBannerPreview: string | null = null;

  clinicMediaFiles: File[] = [];
  clinicMediaPreviews: { url: string; name: string }[] = [];

  readonly CLINIC_MEDIA_MAX = 10;

  constructor(
    private masterService: Masterservice,
    private fb: FormBuilder,
    private authService: Authservice,
    private alert: SweetAlertService,
    private router: Router
  ) { }

  currentStep: 1 | 2 = 1;
  userType: 'user' | 'doctor' | 'clinic' = 'user';
  registeredUser: any = null;

  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  errorMessage = '';

  basicForm!: FormGroup;
  doctorForm!: FormGroup;
  clinicForm!: FormGroup;

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
        this.alert.toastError(err?.error?.message);
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


  initForms(): void {
    this.basicForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      mobile: [this.verifiedMobile || '', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: [this.verifiedEmail || '', [Validators.required, Validators.email]],
      userType: ['user', [Validators.required]],
      gender: ['male', [Validators.required]],
      dob: ['', [Validators.required]],
      state: [null, [Validators.required]],
      city: [null, [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      termsAccepted: [false, [Validators.requiredTrue]],
    });

    this.doctorForm = this.fb.group({
      specializationId: [null], // Kept for model compatibility; validated via selectedSpecializations
      registrationNumber: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\-\/]+$/)]],
      experienceYears: [0, [Validators.required, Validators.min(0)]],
      consultationFee: [0, [Validators.required, Validators.min(0)]],
      institute: ['', [Validators.required]],
      about: [''],
    });

    this.clinicForm = this.fb.group({
      clinicName: ['', [Validators.required, Validators.minLength(2)]],
      establishedYear: [null, [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      consultancyFees: [0, [Validators.required, Validators.min(0)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: [this.verifiedEmail || '', [Validators.required, Validators.email]],
      state: [null, [Validators.required]],
      city: [null, [Validators.required]],
      pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      address: ['', [Validators.required]],
      description: [''],
    });
  }


  setUserType(type: 'user' | 'doctor' | 'clinic'): void {
    this.userType = type;
    this.basicForm.patchValue({ userType: type });
    this.registeredUser = null;
  }


  setGender(gender: string): void {
    this.basicForm.patchValue({ gender });
  }


  onDobChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) return;
  }

  onStateChange(event: Event, target: 'basic' | 'clinic'): void {
    const select = event.target as HTMLSelectElement;
    const stateId = +select.value;
    if (!stateId) return;

    if (target === 'basic') {
      this.cityList = [];
      this.basicForm.patchValue({ city: null });
    } else {
      this.cityList = [];
      this.clinicForm.patchValue({ city: null });
    }

    this.masterService.getcities(stateId).subscribe({
      next: (res: any) => {
        if (target === 'basic') this.cityList = res.data;
        else this.cityList = res.data;
      },
      error: () => { }
    });
  }

  triggerImageUpload(): void {
    const el = document.getElementById('profile-image-input') as HTMLInputElement;
    el?.click();
  }
  onProfileImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.profileImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.profileImagePreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  // ── Clinic Logo ──────────────────────────────────────────────────────
  triggerClinicLogoUpload(): void {
    const el = document.getElementById('clinic-logo-input') as HTMLInputElement;
    el?.click();
  }

  onClinicLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.clinicLogoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.clinicLogoPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  // ── Clinic Banner ────────────────────────────────────────────────────
  triggerClinicBannerUpload(): void {
    const el = document.getElementById('clinic-banner-input') as HTMLInputElement;
    el?.click();
  }

  onClinicBannerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.clinicBannerFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.clinicBannerPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  // ── Clinic Media Gallery ─────────────────────────────────────────────
  triggerClinicMediaUpload(): void {
    const el = document.getElementById('clinic-media-input') as HTMLInputElement;
    el?.click();
  }

  onClinicMediaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const incoming = Array.from(input.files || []);
    if (!incoming.length) return;

    const remaining = this.CLINIC_MEDIA_MAX - this.clinicMediaFiles.length;
    const toAdd = incoming.slice(0, remaining);

    if (incoming.length > remaining) {
      this.alert.toastError(`You can add at most ${this.CLINIC_MEDIA_MAX} photos. Only ${toAdd.length} were added.`);
    }

    toAdd.forEach(file => {
      this.clinicMediaFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.clinicMediaPreviews.push({ url: e.target?.result as string, name: file.name });
      };
      reader.readAsDataURL(file);
    });

    // Reset input so the same files can be re-selected if needed
    input.value = '';
  }

  removeClinicMedia(index: number): void {
    this.clinicMediaFiles.splice(index, 1);
    this.clinicMediaPreviews.splice(index, 1);
  }

  clearAllClinicMedia(): void {
    this.clinicMediaFiles = [];
    this.clinicMediaPreviews = [];
  }



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



  togglePassword(): void { this.showPassword = !this.showPassword; }
  toggleConfirmPassword(): void { this.showConfirmPassword = !this.showConfirmPassword; }


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

    if (this.registeredUser) {
      if (this.userType === 'user' || this.registeredUser?.roleId === role.patient) {
        this.registrationSuccess.emit();
        this.alert.toastSuccess('Registration successful! Welcome to PhysiosMate.');
        this.router.navigate(['/']);
      } else {
        if (this.userType === 'doctor') {
          this.doctorForm.patchValue({ email: bVal.email });
        } else if (this.userType === 'clinic') {
          this.clinicForm.patchValue({ email: bVal.email, phone: bVal.mobile });
        }
        this.currentStep = 2;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    this.submitUserRegistration();
  }

  prevStep(): void {
    this.currentStep = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  submitUserRegistration(): void {
    this.isSubmitting = true;
    this.errorMessage = '';
    const b = this.basicForm.value;
    const form = new FormData();
    const cityname = this.cityList.find(c => c.id === b.city)?.name;
    const statename = this.stateList.find(c => c.id === b.state)?.name;
    form.append('fullName', b.fullName);
    form.append('email', b.email);
    form.append('mobile', b.mobile);
    form.append('password', b.password);
    form.append('dob', b.dob);
    form.append('gender', b.gender);
    form.append('state', statename || '');
    form.append('city', cityname || '');

    let roleId = role.patient;
    if (this.userType === 'doctor') {
      roleId = role.doctor;
    } else if (this.userType === 'clinic') {
      roleId = role.clinic;
    }
    form.append('roleId', roleId.toString());

    if (this.profileImageFile) {
      form.append('file', this.profileImageFile);
    }

    this.authService.register(form).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        const user = res?.data || res;
        this.registeredUser = user;
        const token = user?.token;
        this.authService.saveUserSession(user, token);

        if (this.userType === 'user' || user?.roleId === role.patient) {
          this.registrationSuccess.emit();
          this.alert.toastSuccess('Registration successful! Welcome to PhysiosMate.');
          this.router.navigate(['/']);
        } else {
          // Send doctor or clinic to their signup next screen (Step 2)
          if (this.userType === 'doctor') {
            this.doctorForm.patchValue({ email: b.email });
          } else if (this.userType === 'clinic') {
            this.clinicForm.patchValue({ email: b.email, phone: b.mobile });
          }
          this.currentStep = 2;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.alert.toastError(err?.error?.message || err?.message || 'Error creating account');
      }
    });
  }


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

    const d = this.doctorForm.value;
    const user = this.registeredUser || this.authService.getCurrentUser();
    const userId = user?.id || this.authService.getuserid();

    const payload = {
      userId: userId,
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
      error: (err: any) => {
        this.isSubmitting = false;
        this.alert.toastError(err?.error?.message || err?.message || 'Failed to complete doctor profile.');
      }
    });
  }


  submitClinicRegistration(): void {
    if (this.clinicForm.invalid) {
      this.clinicForm.markAllAsTouched();
      this.alert.toastError('Please fill all required clinic profile details.');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const c = this.clinicForm.value;
    const user = this.registeredUser || this.authService.getCurrentUser();
    const userId = user?.id || this.authService.getuserid();
    debugger
    const formData = new FormData();
    const city = this.cityList.find(ci => ci.id === c.city)?.name;
    const stateName = this.stateList.find(si => si.id === c.state)?.name;
    if (userId) {
      formData.append('ownerUserId', userId.toString());
    }
    formData.append('clinicName', c.clinicName);
    formData.append('establishedYear', c.establishedYear);
    formData.append('consultancyFees', c.consultancyFees);
    formData.append('phone', c.phone);
    formData.append('email', c.email);
    formData.append('state', stateName || '');
    formData.append('city', city || '');
    formData.append('pincode', c.pincode);
    formData.append('address', c.address);
    formData.append('description', c.description || '');
    if (this.profileImageFile) {
      formData.append('file', this.profileImageFile);
    }
    if (this.clinicLogoFile) {
      formData.append('logoFile', this.clinicLogoFile);
    }
    if (this.clinicBannerFile) {
      formData.append('bannerImageFile', this.clinicBannerFile);
    }
    this.clinicMediaFiles.forEach(f => formData.append('clinicMedia', f));

    this.authService.addClinic(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.alert.toastSuccess('Clinic registration submitted successfully!');
        this.registrationSuccess.emit();
        this.router.navigate(['/clinics']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.alert.toastError(err?.error?.message || err?.message || 'Failed to complete clinic profile.');
      }
    });
  }
}
