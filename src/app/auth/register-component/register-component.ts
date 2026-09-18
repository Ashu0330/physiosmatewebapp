import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Authservice } from '../../services/authservice';
import { mastermodel } from '../../models/mastermodel';
import { Masterservice } from '../../services/masterservice';
import { role } from '../../helper/utilities';
import { ApiEndPoints } from '../../helper/api-endpoints';
import { AppMessage } from '../../helper/app-message';
import { BaseComponent } from '../../helper/base-component';
import { SharedModule } from '../../shared/shared-module';

@Component({
  selector: 'app-register-component',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './register-component.html',
  styleUrl: './register-component.css',
})
export class RegisterComponent extends BaseComponent implements OnInit, OnChanges, OnDestroy {
  @Input() verifiedMobile: string = '';
  @Input() verifiedEmail: string = '';
  @Output() backToAuth = new EventEmitter<void>();
  @Output() registrationSuccess = new EventEmitter<void>();

  // ── @ViewChild file inputs (replaces document.getElementById) ──────────────
  @ViewChild('profileImageInput') profileImageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('clinicLogoInput') clinicLogoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('clinicBannerInput') clinicBannerInput!: ElementRef<HTMLInputElement>;
  @ViewChild('clinicMediaInput') clinicMediaInput!: ElementRef<HTMLInputElement>;

  specializationList: mastermodel[] = [];
  qualificationList: mastermodel[] = [];
  languageList: mastermodel[] = [];
  stateList: any[] = [];
  cityList: any[] = [];

  private specializationMap = new Map<number, string>();
  private qualificationMap = new Map<number, string>();
  private languageMap = new Map<number, string>();
  selectedSpecializations: number[] = [];
  selectedQualifications: number[] = [];
  selectedLanguages: number[] = [];
  openDropdown: 'specialization' | 'qualification' | 'language' | null = null;
  specializationSearch = '';
  qualificationSearch = '';
  languageSearch = '';
  profileImageFile: File | null = null;
  profileImagePreview: string | null = null;

  clinicLogoFile: File | null = null;
  clinicLogoPreview: string | null = null;

  clinicBannerFile: File | null = null;
  clinicBannerPreview: string | null = null;

  clinicMediaFiles: File[] = [];
  clinicMediaPreviews: { url: string; name: string }[] = [];

  readonly CLINIC_MEDIA_MAX = 10;

  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;         // 5 MB
  private readonly MAX_BANNER_SIZE_BYTES = 10 * 1024 * 1024;       // 10 MB

  private fb = inject(FormBuilder);
  protected override authService = inject(Authservice);

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


  async GetAllSpecialization(): Promise<void> {
    const res = await this.apiService.Get<mastermodel[]>(ApiEndPoints.GetAllSpecialization);
    this.specializationList = res.isSuccess ? (res.data ?? []) : [];
    this.specializationMap = new Map(this.specializationList.map(x => [x.id, x.name ?? '']));
  }

  async GetAllQualification(): Promise<void> {
    const res = await this.apiService.Get<mastermodel[]>(ApiEndPoints.GetAllQualification);
    this.qualificationList = res.isSuccess ? (res.data ?? []) : [];
    this.qualificationMap = new Map(this.qualificationList.map(x => [x.id, x.name ?? '']));
  }

  async GetAllLanguages(): Promise<void> {
    const res = await this.apiService.Get<mastermodel[]>(ApiEndPoints.GetAllLanguage);
    this.languageList = res.isSuccess ? (res.data ?? []) : [];
    this.languageMap = new Map(this.languageList.map(x => [x.id, x.name ?? '']));
  }

  async GetAllStates(): Promise<void> {
    const res = await this.apiService.Get<any[]>(ApiEndPoints.GetAllState);
    this.stateList = res.isSuccess ? (res.data ?? []) : [];
  }


  async ngOnInit(): Promise<void> {
    this.initForms();
    await Promise.all([
      this.GetAllQualification(),
      this.GetAllSpecialization(),
      this.GetAllLanguages(),
      this.GetAllStates()
    ]);
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

  ngOnDestroy(): void {
    if (this.profileImagePreview) URL.revokeObjectURL(this.profileImagePreview);
    if (this.clinicLogoPreview) URL.revokeObjectURL(this.clinicLogoPreview);
    if (this.clinicBannerPreview) URL.revokeObjectURL(this.clinicBannerPreview);
    this.clinicMediaPreviews.forEach(p => URL.revokeObjectURL(p.url));
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
      specializationId: [null],
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

  async onStateChange(event: Event, target: 'basic' | 'clinic'): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const stateId = +select.value;
    if (!stateId) return;

    this.cityList = [];
    if (target === 'basic') {
      this.basicForm.patchValue({ city: null });
    } else {
      this.clinicForm.patchValue({ city: null });
    }

    const res = await this.apiService.Get<any[]>(`${ApiEndPoints.GetAllCity}?stateId=${stateId}`);
    this.cityList = res.isSuccess ? (res.data ?? []) : [];
  }


  private validateImageFile(file: File, maxSizeBytes: number = this.MAX_IMAGE_SIZE_BYTES): boolean {
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.alert.toastError('Only JPG, PNG, or WebP images are allowed.');
      return false;
    }
    if (file.size > maxSizeBytes) {
      const mb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      this.alert.toastError(`Image size must be less than ${mb} MB.`);
      return false;
    }
    return true;
  }



  triggerImageUpload(): void {
    this.profileImageInput?.nativeElement.click();
  }

  onProfileImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.validateImageFile(file)) return;

    if (this.profileImagePreview) URL.revokeObjectURL(this.profileImagePreview);
    this.profileImageFile = file;
    this.profileImagePreview = URL.createObjectURL(file);
  }



  triggerClinicLogoUpload(): void {
    this.clinicLogoInput?.nativeElement.click();
  }

  onClinicLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.validateImageFile(file)) return;

    if (this.clinicLogoPreview) URL.revokeObjectURL(this.clinicLogoPreview);
    this.clinicLogoFile = file;
    this.clinicLogoPreview = URL.createObjectURL(file);
  }



  triggerClinicBannerUpload(): void {
    this.clinicBannerInput?.nativeElement.click();
  }

  onClinicBannerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.validateImageFile(file, this.MAX_BANNER_SIZE_BYTES)) return;

    if (this.clinicBannerPreview) URL.revokeObjectURL(this.clinicBannerPreview);
    this.clinicBannerFile = file;
    this.clinicBannerPreview = URL.createObjectURL(file);
  }



  triggerClinicMediaUpload(): void {
    this.clinicMediaInput?.nativeElement.click();
  }

  onClinicMediaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const incoming = Array.from(input.files || []);
    if (!incoming.length) return;

    const remaining = this.CLINIC_MEDIA_MAX - this.clinicMediaFiles.length;
    const validFiles: File[] = [];

    for (const file of incoming) {
      if (validFiles.length >= remaining) {
        this.alert.toastError(`You can add at most ${this.CLINIC_MEDIA_MAX} photos. Remaining capacity: ${remaining}.`);
        break;
      }
      if (this.validateImageFile(file)) {
        validFiles.push(file);
      }
    }

    validFiles.forEach(file => {
      this.clinicMediaFiles.push(file);
      this.clinicMediaPreviews.push({ url: URL.createObjectURL(file), name: file.name });
    });

    input.value = '';
  }

  removeClinicMedia(index: number): void {
    URL.revokeObjectURL(this.clinicMediaPreviews[index].url);
    this.clinicMediaFiles.splice(index, 1);
    this.clinicMediaPreviews.splice(index, 1);
  }

  clearAllClinicMedia(): void {
    this.clinicMediaPreviews.forEach(p => URL.revokeObjectURL(p.url));
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
    this.openDropdown = this.openDropdown === type ? null : type;
  }

  closeAllDropdowns(): void {
    this.openDropdown = null;
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
      this.doctorForm.patchValue({ specializationId: this.selectedSpecializations[0] || null });
    }
  }

  clearSpecializations(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedSpecializations = [];
    this.doctorForm.patchValue({ specializationId: null });
  }

  getSpecializationName(id: number): string {
    return this.specializationMap.get(id) ?? '';
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
    if (idx !== -1) this.selectedQualifications.splice(idx, 1);
  }

  clearQualifications(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedQualifications = [];
  }

  getQualificationName(id: number): string {
    return this.qualificationMap.get(id) ?? '';
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
    if (idx !== -1) this.selectedLanguages.splice(idx, 1);
  }

  clearLanguages(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedLanguages = [];
  }

  getLanguageName(id: number): string {
    return this.languageMap.get(id) ?? '';
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
      this.alert.toastError(AppMessage.InvalidForm);
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
        this.alert.toastSuccess(AppMessage.RegistrationSuccess);
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


  async submitUserRegistration(): Promise<void> {
    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const b = this.basicForm.value;
      const form = new FormData();
      const cityname = this.cityList.find((c: any) => c.id === b.city)?.name;
      const statename = this.stateList.find((c: any) => c.id === b.state)?.name;

      form.append('fullName', b.fullName);
      form.append('email', b.email);
      form.append('mobile', b.mobile);
      form.append('password', b.password);
      form.append('dob', b.dob);
      form.append('gender', b.gender);
      form.append('state', statename || '');
      form.append('city', cityname || '');

      let roleId = role.patient;
      if (this.userType === 'doctor') roleId = role.doctor;
      else if (this.userType === 'clinic') roleId = role.clinic;
      form.append('roleId', roleId.toString());

      if (this.profileImageFile) form.append('file', this.profileImageFile);

      const res = await this.apiService.PostForm<any>(ApiEndPoints.Register, form);

      if (res.isSuccess) {
        const user = res.data;
        this.registeredUser = user;
        this.authService.saveUserSession(user, user?.token);

        if (this.userType === 'user' || user?.roleId === role.patient) {
          this.registrationSuccess.emit();
          this.alert.toastSuccess(AppMessage.RegistrationSuccess);
          this.router.navigate(['/']);
        } else {
          if (this.userType === 'doctor') {
            this.doctorForm.patchValue({ email: b.email });
          } else if (this.userType === 'clinic') {
            this.clinicForm.patchValue({ email: b.email, phone: b.mobile });
          }
          this.currentStep = 2;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  async submitDoctorRegistration(): Promise<void> {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      this.alert.toastError(AppMessage.InvalidForm);
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

    try {
      const d = this.doctorForm.value;
      const user = this.registeredUser || this.authService.getCurrentUser();
      const userId = user?.id || this.authService.getuserid();

      const payload = {
        userId,
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

      const res = await this.apiService.Post<any>(ApiEndPoints.AddPractitioner, payload);

      if (res.isSuccess) {
        this.alert.toastSuccess('Doctor registration complete! Welcome to PhysiosMate.');
        this.registrationSuccess.emit();
        this.router.navigate(['/doctor-dashboard']);
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  async submitClinicRegistration(): Promise<void> {
    if (this.clinicForm.invalid) {
      this.clinicForm.markAllAsTouched();
      this.alert.toastError(AppMessage.InvalidForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const c = this.clinicForm.value;
      const user = this.registeredUser || this.authService.getCurrentUser();
      const userId = user?.id || this.authService.getuserid();

      const formData = new FormData();
      const city = this.cityList.find((ci: any) => ci.id === c.city)?.name;
      const stateName = this.stateList.find((si: any) => si.id === c.state)?.name;

      if (userId) formData.append('ownerUserId', userId.toString());
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
      if (this.profileImageFile) formData.append('file', this.profileImageFile);
      if (this.clinicLogoFile) formData.append('logoFile', this.clinicLogoFile);
      if (this.clinicBannerFile) formData.append('bannerImageFile', this.clinicBannerFile);
      this.clinicMediaFiles.forEach(f => formData.append('clinicMedia', f));

      const res = await this.apiService.PostForm<any>(ApiEndPoints.AddClinic, formData);

      if (res.isSuccess) {
        this.alert.toastSuccess('Clinic registration submitted successfully!');
        this.registrationSuccess.emit();
        this.router.navigate(['/clinics']);
      }
    } finally {
      this.isSubmitting = false;
    }
  }
}
