import {
  Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges,
  inject, signal, computed, viewChild,
} from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Authservice } from '../../services/authservice';
import { ClinicRelationshipService } from '../../services/clinic-relationship.service';
import { mastermodel, qualification, ServiceItem } from '../../models/mastermodel';
import { DateHelper, role } from '../../helper/utilities';
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
  @Input() soloSetupMode: boolean = false;
  @Output() backToAuth = new EventEmitter<void>();
  @Output() registrationSuccess = new EventEmitter<void>();

  // ── Signal-based view children for file inputs ────────────────────────────
  readonly profileImageInput = viewChild<ElementRef<HTMLInputElement>>('profileImageInput');
  readonly clinicLogoInput = viewChild<ElementRef<HTMLInputElement>>('clinicLogoInput');
  readonly clinicBannerInput = viewChild<ElementRef<HTMLInputElement>>('clinicBannerInput');
  readonly clinicMediaInput = viewChild<ElementRef<HTMLInputElement>>('clinicMediaInput');

  // ── Master Data Signals ───────────────────────────────────────────────────
  readonly specializationList = signal<mastermodel[]>([]);
  readonly qualificationList = signal<qualification[]>([]);
  readonly languageList = signal<mastermodel[]>([]);
  readonly serviceList = signal<ServiceItem[]>([]);
  readonly stateList = signal<any[]>([]);
  readonly cityList = signal<any[]>([]);

  private specializationMap = new Map<number, string>();
  private qualificationMap = new Map<number, string>();
  private languageMap = new Map<number, string>();

  // ── Selection Signals ─────────────────────────────────────────────────────
  readonly selectedSpecializations = signal<number[]>([]);
  readonly selectedQualifications = signal<number[]>([]);
  readonly selectedLanguages = signal<number[]>([]);
  readonly selectedServiceIds = signal<Set<number>>(new Set<number>());

  // ── Dropdown & Search Signals ─────────────────────────────────────────────
  readonly openDropdown = signal<'specialization' | 'qualification' | 'language' | null>(null);
  readonly specializationSearch = signal<string>('');
  readonly qualificationSearch = signal<string>('');
  readonly languageSearch = signal<string>('');

  // ── File & Preview Signals ────────────────────────────────────────────────
  readonly profileImageFile = signal<File | null>(null);
  readonly profileImagePreview = signal<string | null>(null);

  readonly clinicLogoFile = signal<File | null>(null);
  readonly clinicLogoPreview = signal<string | null>(null);

  readonly clinicBannerFile = signal<File | null>(null);
  readonly clinicBannerPreview = signal<string | null>(null);

  readonly clinicMediaFiles = signal<File[]>([]);
  readonly clinicMediaPreviews = signal<{ url: string; name: string }[]>([]);

  readonly CLINIC_MEDIA_MAX = 10;
  readonly maxAgeYears = 100;
  readonly minDob = (() => {
    const today = new Date();
    return DateHelper.formatLocalDate(
      new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
    );
  })();
  readonly maxDob = DateHelper.formatLocalDate(new Date());
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
  private readonly MAX_BANNER_SIZE_BYTES = 10 * 1024 * 1024;

  protected override authService = inject(Authservice);
  private relationshipService = inject(ClinicRelationshipService);

  // ── Flow & Form Signals ───────────────────────────────────────────────────
  readonly isSoloSetup = signal<boolean>(false);
  readonly currentStep = signal<1 | 2>(1);
  readonly userType = signal<'user' | 'doctor' | 'clinic'>('user');
  readonly registeredUser = signal<any>(null);
  private basicStepSavedInSession = false;

  readonly showPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  basicForm!: FormGroup;
  doctorForm!: FormGroup;
  clinicForm!: FormGroup;

  // ── Computed Filtered Lists ───────────────────────────────────────────────
  readonly filteredSpecializations = computed(() => {
    const term = this.specializationSearch().toLowerCase().trim();
    const list = this.specializationList();
    if (!term) return list;
    return list.filter(s => s.name?.toLowerCase().includes(term));
  });

  readonly filteredQualifications = computed(() => {
    const term = this.qualificationSearch().toLowerCase().trim();
    const list = this.qualificationList();
    if (!term) return list;
    return list.filter(q =>
      (q.qualificationName || (q as any).name || '').toLowerCase().includes(term)
    );
  });

  readonly filteredLanguages = computed(() => {
    const term = this.languageSearch().toLowerCase().trim();
    const list = this.languageList();
    if (!term) return list;
    return list.filter(l => l.name?.toLowerCase().includes(term));
  });

  handleBackToAuth(): void {
    this.clearDraft();
    this.authService.clearPendingVerification();
    this.backToAuth.emit();
  }

  toggleService(id: number): void {
    this.selectedServiceIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    this.saveDraft();
  }

  isServiceSelected(id: number): boolean {
    return this.selectedServiceIds().has(id);
  }

  async GetAllSpecialization(): Promise<void> {
    const res = await this.apiService.Get<mastermodel[]>(ApiEndPoints.GetAllSpecialization);
    const list = res.isSuccess ? (res.data ?? []) : [];
    this.specializationList.set(list);
    this.specializationMap = new Map(list.map(x => [x.id, x.name ?? '']));
  }

  async GetAllQualification(): Promise<void> {
    const res = await this.apiService.Get<qualification[]>(ApiEndPoints.GetAllQualification);
    const list = res.isSuccess && res.data?.length ? res.data : [];
    this.qualificationList.set(list);
    this.qualificationMap = new Map(list.map(x => [x.id, x.qualificationName]));
  }

  async GetAllLanguages(): Promise<void> {
    const res = await this.apiService.Get<mastermodel[]>(ApiEndPoints.GetAllLanguage);
    const list = res.isSuccess ? (res.data ?? []) : [];
    this.languageList.set(list);
    this.languageMap = new Map(list.map(x => [x.id, x.name ?? '']));
  }

  async GetAllServices(): Promise<void> {
    const res = await this.apiService.Get<ServiceItem[]>(ApiEndPoints.GetAllServices);
    this.serviceList.set(res.isSuccess ? (res.data ?? []) : []);
  }

  async GetAllStates(): Promise<void> {
    const res = await this.apiService.Get<any[]>(ApiEndPoints.GetAllState);
    this.stateList.set(res.isSuccess ? (res.data ?? []) : []);
  }

  async ngOnInit(): Promise<void> {
    const pending = this.authService.getPendingVerification();
    const isSolo = this.soloSetupMode || Boolean(pending?.soloSetupMode);
    this.isSoloSetup.set(isSolo);

    if (!this.verifiedEmail && (pending?.email || this.authService.getCurrentUser()?.email)) {
      this.verifiedEmail = pending?.email || this.authService.getCurrentUser()?.email || '';
    }
    const existingUser = pending?.user || (isSolo ? this.authService.getCurrentUser() : null);
    if (existingUser) {
      this.registeredUser.set(existingUser);
      if (isSolo || existingUser.roleId === role.doctor) {
        this.userType.set('doctor');
      }
    } else if (isSolo) {
      this.userType.set('doctor');
    }

    this.initForms();
    await Promise.all([
      this.GetAllQualification(),
      this.GetAllSpecialization(),
      this.GetAllLanguages(),
      this.GetAllStates(),
      this.GetAllServices(),
    ]);
    await this.loadDraft();
    await this.prefillExistingProfile();
  }

  saveDraft(): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      const draft = {
        currentStep: this.currentStep(),
        userType: this.userType(),
        basicForm: this.basicForm?.value,
        doctorForm: this.doctorForm?.value,
        clinicForm: this.clinicForm?.value,
        selectedSpecializations: this.selectedSpecializations(),
        selectedQualifications: this.selectedQualifications(),
        selectedLanguages: this.selectedLanguages(),
        selectedServiceIds: [...this.selectedServiceIds()],
      };
      sessionStorage.setItem('physios_register_draft', JSON.stringify(draft));
    } catch { }
  }

  async loadDraft(): Promise<void> {
    if (typeof sessionStorage === 'undefined') return;
    try {
      const saved = sessionStorage.getItem('physios_register_draft');
      if (!saved) return;
      const draft = JSON.parse(saved);
      const draftEmail = (draft.basicForm?.email || '').trim().toLowerCase();
      const targetEmail = (this.verifiedEmail || '').trim().toLowerCase();
      if (targetEmail && draftEmail && draftEmail !== targetEmail) {
        return;
      }
      if (draft.userType && !this.isSoloSetup()) {
        this.userType.set(draft.userType);
      }
      if (draft.currentStep) {
        this.currentStep.set(draft.currentStep);
      }
      if (draft.basicForm && this.basicForm) {
        this.basicForm.patchValue(draft.basicForm);
        if (draft.basicForm.state) {
          await this.loadCitiesForState(draft.basicForm.state, 'basic', draft.basicForm.city);
        }
      }
      if (draft.doctorForm && this.doctorForm) {
        this.doctorForm.patchValue(draft.doctorForm);
      }
      if (draft.clinicForm && this.clinicForm) {
        this.clinicForm.patchValue(draft.clinicForm);
        if (draft.clinicForm.state) {
          await this.loadCitiesForState(draft.clinicForm.state, 'clinic', draft.clinicForm.city);
        }
      }
      if (draft.selectedSpecializations?.length) this.selectedSpecializations.set(draft.selectedSpecializations);
      if (draft.selectedQualifications?.length) this.selectedQualifications.set(draft.selectedQualifications);
      if (draft.selectedLanguages?.length) this.selectedLanguages.set(draft.selectedLanguages);
      if (draft.selectedServiceIds?.length) this.selectedServiceIds.set(new Set(draft.selectedServiceIds));
    } catch { }
  }

  private async prefillExistingProfile(): Promise<void> {
    if (!this.authService.isLoggedIn()) return;
    const regUser = this.registeredUser() || this.authService.getCurrentUser();
    if (!this.isSoloSetup() && regUser?.roleId !== role.doctor) return;

    try {
      const profileRes = await this.apiService.Get<any>(ApiEndPoints.GetUserProfile);
      if (profileRes.isSuccess && profileRes.data) {
        const p = profileRes.data;
        const normalizedMobile = (p.mobile || '').replace(/\D/g, '').slice(-10);
        const normalizedGender = p.gender ? String(p.gender).toLowerCase() : (this.basicForm.get('gender')?.value || 'male');

        const patch: any = {};
        if (!this.basicForm.get('fullName')?.value && p.fullName) patch.fullName = p.fullName;
        if (p.email || this.verifiedEmail) patch.email = p.email || this.verifiedEmail;
        if (!this.basicForm.get('mobile')?.value && normalizedMobile) patch.mobile = normalizedMobile;
        if (normalizedGender) patch.gender = normalizedGender;
        if (!this.basicForm.get('dob')?.value && p.dob) patch.dob = String(p.dob).slice(0, 10);

        if (Object.keys(patch).length > 0) {
          this.basicForm.patchValue(patch);
        }
        if (p.profileImageUrl && !this.profileImagePreview()) {
          this.profileImagePreview.set(p.profileImageUrl);
        }

        if (!this.basicForm.get('state')?.value && p.state) {
          const matchedState = this.stateList().find(
            (s: any) => (s.name || '').toLowerCase() === String(p.state).toLowerCase()
          );
          if (matchedState) {
            this.basicForm.patchValue({ state: matchedState.id });
            await this.loadCitiesForState(matchedState.id, 'basic');
            if (p.city) {
              const matchedCity = this.cityList().find(
                (c: any) => (c.name || '').toLowerCase() === String(p.city).toLowerCase()
              );
              if (matchedCity) {
                this.basicForm.patchValue({ city: matchedCity.id });
              }
            }
          }
        }
      }

      const pracId = Number(regUser?.practitionerId || this.authService.getPractitionerId() || 0);
      const userId = Number(regUser?.id || this.authService.getuserid() || 0);
      if (pracId > 0 && userId > 0) {
        const pracRes = await this.apiService.Get<any>(
          `${ApiEndPoints.GetPractitionerProfile}?practitionerId=${pracId}&UserId=${userId}`
        );
        if (pracRes.isSuccess && pracRes.data) {
          const pd = pracRes.data;
          this.doctorForm.patchValue({
            specializationId: this.doctorForm.get('specializationId')?.value ?? pd.specializationId ?? null,
            experienceYears: this.doctorForm.get('experienceYears')?.value || pd.experienceYears || 0,
            consultationFee: this.doctorForm.get('consultationFee')?.value || pd.consultationFee || 0,
            about: this.doctorForm.get('about')?.value || pd.about || '',
          });
          if (this.selectedSpecializations().length === 0 && pd.specializationId) {
            this.selectedSpecializations.set([pd.specializationId]);
          }
          if (this.selectedQualifications().length === 0 && pd.qualifications?.length) {
            this.selectedQualifications.set(
              pd.qualifications.map((q: any) => q.qualificationId).filter((id: any) => id > 0)
            );
          }
          if (this.selectedLanguages().length === 0 && pd.languages?.length) {
            this.selectedLanguages.set(
              pd.languages.map((l: any) => l.languageId).filter((id: any) => id > 0)
            );
          }
          if (this.selectedServiceIds().size === 0 && pd.services?.length) {
            this.selectedServiceIds.set(
              new Set(pd.services.map((s: any) => s.serviceId).filter((id: any) => id > 0))
            );
          }
        }
      }
    } catch {
      // Allow manual form entry if profile prefill fails
    }
  }

  clearDraft(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('physios_register_draft');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['soloSetupMode'] && this.soloSetupMode) {
      this.isSoloSetup.set(true);
      this.userType.set('doctor');
      this.basicForm?.patchValue({ userType: 'doctor' });
    }
    if (changes['verifiedMobile'] && this.basicForm) {
      this.basicForm.patchValue({ mobile: this.verifiedMobile || '' });
    }
    if (changes['verifiedEmail'] && this.basicForm) {
      this.basicForm.patchValue({ email: this.verifiedEmail || '' });
      this.clinicForm?.patchValue({ email: this.verifiedEmail || '' });
    }
  }

  ngOnDestroy(): void {
    const pPrev = this.profileImagePreview();
    if (pPrev && pPrev.startsWith('blob:')) URL.revokeObjectURL(pPrev);
    const lPrev = this.clinicLogoPreview();
    if (lPrev && lPrev.startsWith('blob:')) URL.revokeObjectURL(lPrev);
    const bPrev = this.clinicBannerPreview();
    if (bPrev && bPrev.startsWith('blob:')) URL.revokeObjectURL(bPrev);
    this.clinicMediaPreviews().forEach(p => {
      if (p.url.startsWith('blob:')) URL.revokeObjectURL(p.url);
    });
  }

  initForms(): void {
    const defaultEmail = this.verifiedEmail || this.authService.getPendingVerification()?.email || '';
    const defaultUserType = this.isSoloSetup() ? 'doctor' : 'user';
    const passwordValidators = this.isSoloSetup()
      ? [Validators.minLength(6)]
      : [Validators.required, Validators.minLength(6)];
    const confirmValidators = this.isSoloSetup() ? [] : [Validators.required];

    this.basicForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      mobile: [this.verifiedMobile || '', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: [defaultEmail, [Validators.required, Validators.email]],
      userType: [defaultUserType, [Validators.required]],
      gender: ['male', [Validators.required]],
      dob: ['', [Validators.required, this.dobAgeValidator()]],
      state: [null, [Validators.required]],
      city: [null, [Validators.required]],
      password: ['', passwordValidators],
      confirmPassword: ['', confirmValidators],
      termsAccepted: [false, [Validators.requiredTrue]],
    });

    this.doctorForm = this.fb.group({
      specializationId: [null],
      experienceYears: [null, [Validators.required, Validators.min(0)]],
      consultationFee: [null, [Validators.required, Validators.min(0)]],
      institute: ['', [Validators.required]],
      about: [''],
    });

    this.clinicForm = this.fb.group({
      clinicName: ['', [Validators.required, Validators.minLength(2)]],
      establishedYear: [null, [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      consultancyFees: [null, [Validators.required, Validators.min(0)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: [defaultEmail, [Validators.required, Validators.email]],
      state: [null, [Validators.required]],
      city: [null, [Validators.required]],
      pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      address: ['', [Validators.required]],
      description: [''],
    });

    this.basicForm.valueChanges.subscribe(() => this.saveDraft());
    this.doctorForm.valueChanges.subscribe(() => this.saveDraft());
    this.clinicForm.valueChanges.subscribe(() => this.saveDraft());
  }

  setUserType(type: 'user' | 'doctor' | 'clinic'): void {
    if (this.isSoloSetup() && type !== 'doctor') {
      return;
    }
    this.userType.set(type);
    this.basicForm.patchValue({ userType: type });
    this.basicStepSavedInSession = false;
    if (!this.authService.isLoggedIn() && !this.authService.getPendingVerification()?.user) {
      this.registeredUser.set(null);
    }
    this.saveDraft();
  }

  setGender(gender: string): void {
    this.basicForm.patchValue({ gender });
    this.saveDraft();
  }

  onDobChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.basicForm.get('dob')?.markAsTouched();
    if (!input.value) return;
    this.saveDraft();
  }

  private dobAgeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = String(control.value ?? '').trim();
      if (!raw) return null;

      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.slice(0, 10));
      if (!match) return { invalidDob: true };

      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const dobDate = new Date(year, month - 1, day);
      if (
        dobDate.getFullYear() !== year ||
        dobDate.getMonth() !== month - 1 ||
        dobDate.getDate() !== day
      ) {
        return { invalidDob: true };
      }

      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (dobDate > todayDate) {
        return { futureDate: true };
      }

      const minAllowedDate = new Date(today.getFullYear() - this.maxAgeYears, today.getMonth(), today.getDate());
      if (dobDate < minAllowedDate) {
        return { maxAge: { max: this.maxAgeYears } };
      }

      return null;
    };
  }

  async loadCitiesForState(stateId: number, target: 'basic' | 'clinic', cityIdToSet?: any): Promise<void> {
    const res = await this.apiService.Get<any[]>(`${ApiEndPoints.GetAllCity}?stateId=${stateId}`);
    this.cityList.set(res.isSuccess ? (res.data ?? []) : []);
    if (cityIdToSet != null) {
      if (target === 'basic') {
        this.basicForm?.patchValue({ city: cityIdToSet });
      } else {
        this.clinicForm?.patchValue({ city: cityIdToSet });
      }
    }
  }

  async onStateChange(event: Event, target: 'basic' | 'clinic'): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const stateId = +select.value;
    if (!stateId) return;

    this.cityList.set([]);
    if (target === 'basic') {
      this.basicForm.patchValue({ city: null });
    } else {
      this.clinicForm.patchValue({ city: null });
    }

    await this.loadCitiesForState(stateId, target);
    this.saveDraft();
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
    this.profileImageInput()?.nativeElement.click();
  }

  onProfileImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.validateImageFile(file)) return;

    const prev = this.profileImagePreview();
    if (prev) URL.revokeObjectURL(prev);
    this.profileImageFile.set(file);
    this.profileImagePreview.set(URL.createObjectURL(file));
  }

  triggerClinicLogoUpload(): void {
    this.clinicLogoInput()?.nativeElement.click();
  }

  onClinicLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.validateImageFile(file)) return;

    const prev = this.clinicLogoPreview();
    if (prev) URL.revokeObjectURL(prev);
    this.clinicLogoFile.set(file);
    this.clinicLogoPreview.set(URL.createObjectURL(file));
  }

  triggerClinicBannerUpload(): void {
    this.clinicBannerInput()?.nativeElement.click();
  }

  onClinicBannerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.validateImageFile(file, this.MAX_BANNER_SIZE_BYTES)) return;

    const prev = this.clinicBannerPreview();
    if (prev) URL.revokeObjectURL(prev);
    this.clinicBannerFile.set(file);
    this.clinicBannerPreview.set(URL.createObjectURL(file));
  }

  triggerClinicMediaUpload(): void {
    this.clinicMediaInput()?.nativeElement.click();
  }

  onClinicMediaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const incoming = Array.from(input.files || []);
    if (!incoming.length) return;

    const remaining = this.CLINIC_MEDIA_MAX - this.clinicMediaFiles().length;
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

    const currentFiles = [...this.clinicMediaFiles()];
    const currentPreviews = [...this.clinicMediaPreviews()];
    validFiles.forEach(file => {
      currentFiles.push(file);
      currentPreviews.push({ url: URL.createObjectURL(file), name: file.name });
    });
    this.clinicMediaFiles.set(currentFiles);
    this.clinicMediaPreviews.set(currentPreviews);

    input.value = '';
  }

  removeClinicMedia(index: number): void {
    const previews = [...this.clinicMediaPreviews()];
    const files = [...this.clinicMediaFiles()];
    if (previews[index]) URL.revokeObjectURL(previews[index].url);
    files.splice(index, 1);
    previews.splice(index, 1);
    this.clinicMediaFiles.set(files);
    this.clinicMediaPreviews.set(previews);
  }

  clearAllClinicMedia(): void {
    this.clinicMediaPreviews().forEach(p => URL.revokeObjectURL(p.url));
    this.clinicMediaFiles.set([]);
    this.clinicMediaPreviews.set([]);
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
    this.openDropdown.update(cur => cur === type ? null : type);
  }

  closeAllDropdowns(): void {
    this.openDropdown.set(null);
  }

  toggleSpecialization(id: number): void {
    this.selectedSpecializations.update(list => {
      const idx = list.indexOf(id);
      const updated = [...list];
      if (idx === -1) {
        updated.push(id);
      } else {
        updated.splice(idx, 1);
      }
      return updated;
    });
    this.doctorForm.patchValue({
      specializationId: this.selectedSpecializations()[0] || null
    });
    this.saveDraft();
  }

  isSpecializationSelected(id: number): boolean {
    return this.selectedSpecializations().includes(id);
  }

  removeSpecialization(id: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedSpecializations.update(list => list.filter(x => x !== id));
    this.doctorForm.patchValue({ specializationId: this.selectedSpecializations()[0] || null });
    this.saveDraft();
  }

  clearSpecializations(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedSpecializations.set([]);
    this.doctorForm.patchValue({ specializationId: null });
    this.saveDraft();
  }

  getSpecializationName(id: number): string {
    return this.specializationMap.get(id) ?? '';
  }

  toggleQualification(id: number): void {
    this.selectedQualifications.update(list => {
      const idx = list.indexOf(id);
      const updated = [...list];
      if (idx === -1) {
        updated.push(id);
      } else {
        updated.splice(idx, 1);
      }
      return updated;
    });
    this.saveDraft();
  }

  isQualificationSelected(id: number): boolean {
    return this.selectedQualifications().includes(id);
  }

  removeQualification(id: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedQualifications.update(list => list.filter(x => x !== id));
    this.saveDraft();
  }

  clearQualifications(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedQualifications.set([]);
    this.saveDraft();
  }

  getQualificationName(id: number): string {
    return this.qualificationMap.get(id) ?? '';
  }

  toggleLanguage(id: number): void {
    this.selectedLanguages.update(list => {
      const idx = list.indexOf(id);
      const updated = [...list];
      if (idx === -1) {
        updated.push(id);
      } else {
        updated.splice(idx, 1);
      }
      return updated;
    });
    this.saveDraft();
  }

  isLanguageSelected(id: number): boolean {
    return this.selectedLanguages().includes(id);
  }

  removeLanguage(id: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedLanguages.update(list => list.filter(x => x !== id));
    this.saveDraft();
  }

  clearLanguages(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedLanguages.set([]);
    this.saveDraft();
  }

  getLanguageName(id: number): string {
    return this.languageMap.get(id) ?? '';
  }

  togglePassword(): void { this.showPassword.update(v => !v); }
  toggleConfirmPassword(): void { this.showConfirmPassword.update(v => !v); }

  onNextOrSubmit(): void {
    if (this.basicForm.invalid) {
      this.basicForm.markAllAsTouched();
      const dobCtrl = this.basicForm.get('dob');
      if (dobCtrl?.hasError('maxAge')) {
        this.alert.toastError(`Age cannot exceed ${this.maxAgeYears} years.`);
        return;
      }
      if (dobCtrl?.hasError('futureDate')) {
        this.alert.toastError('Date of birth cannot be in the future.');
        return;
      }
      this.alert.toastError(AppMessage.InvalidForm);
      return;
    }
    const bVal = this.basicForm.value;
    if ((bVal.password || bVal.confirmPassword) && bVal.password !== bVal.confirmPassword) {
      this.alert.toastError('Passwords do not match! Please check your password confirmation.');
      return;
    }

    const regUser = this.registeredUser();
    if (this.basicStepSavedInSession && regUser) {
      if (this.userType() === 'user' || regUser?.roleId === role.patient) {
        this.registrationSuccess.emit();
        this.alert.toastSuccess(AppMessage.RegistrationSuccess);
        this.router.navigate(['/']);
      } else {
        if (this.userType() === 'doctor') {
          this.doctorForm.patchValue({ email: bVal.email });
        } else if (this.userType() === 'clinic') {
          this.clinicForm.patchValue({ email: bVal.email, phone: bVal.mobile });
        }
        this.currentStep.set(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    this.submitUserRegistration();
  }

  prevStep(): void {
    this.currentStep.set(1);
    this.saveDraft();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async submitUserRegistration(): Promise<void> {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const b = this.basicForm.value;
      const form = new FormData();
      const cityname = this.cityList().find((c: any) => c.id === Number(b.city))?.name;
      const statename = this.stateList().find((c: any) => c.id === Number(b.state))?.name;
      const existingId = Number(this.registeredUser()?.id || this.authService.getuserid() || 0);

      if (existingId > 0) {
        form.append('id', existingId.toString());
      }
      form.append('fullName', b.fullName);
      form.append('email', b.email);
      form.append('mobile', b.mobile);
      if (b.password) {
        form.append('passwordHash', b.password);
      }
      form.append('dob', b.dob);
      form.append('gender', b.gender);
      form.append('state', statename || '');
      form.append('city', cityname || '');

      let roleId = role.patient;
      if (this.userType() === 'doctor') roleId = role.doctor;
      else if (this.userType() === 'clinic') roleId = role.clinic;
      form.append('roleId', roleId.toString());

      const profileImg = this.profileImageFile();
      if (profileImg) form.append('file', profileImg);

      const res = await this.apiService.PostForm<any>(ApiEndPoints.Register, form);

      if (res.isSuccess) {
        const prevUser = this.registeredUser() || this.authService.getCurrentUser();
        const user = { ...(prevUser || {}), ...(res.data || {}) };
        this.basicStepSavedInSession = true;
        this.registeredUser.set(user);
        this.authService.saveUserSession(user, user?.token);

        if (this.userType() === 'user' || user?.roleId === role.patient) {
          this.clearDraft();
          this.authService.clearPendingVerification();
          this.registrationSuccess.emit();
          this.alert.toastSuccess(AppMessage.RegistrationSuccess);
          this.router.navigate(['/user-dashboard/medical-records']);
        } else {
          if (this.userType() === 'doctor') {
            this.doctorForm.patchValue({ email: b.email });
          } else if (this.userType() === 'clinic') {
            this.clinicForm.patchValue({ email: b.email, phone: b.mobile });
          }
          this.currentStep.set(2);
          this.saveDraft();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        this.alert.toastError(res.message);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async submitDoctorRegistration(): Promise<void> {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      this.alert.toastError(AppMessage.InvalidForm);
      return;
    }
    if (this.selectedSpecializations().length === 0) {
      this.alert.toastError('Please select at least one specialization.');
      return;
    }
    if (this.selectedQualifications().length === 0) {
      this.alert.toastError('Please select at least one qualification.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const d = this.doctorForm.value;
      const user = this.registeredUser() || this.authService.getCurrentUser() || {};
      const userId = user?.id || this.authService.getuserid();
      const existingPracId = Number(user?.practitionerId || this.authService.getPractitionerId() || 0);

      const payload = {
        practitionerId: existingPracId,
        userId,
        specializationId: this.selectedSpecializations()[0] || null,
        services: [...this.selectedServiceIds()].map(id => ({ serviceId: id })),
        qualifications: this.selectedQualifications().map(id => ({
          qualificationId: id
        })),
        experienceYears: d.experienceYears,
        consultationFee: d.consultationFee,
        institute: d.institute,
        languages: this.selectedLanguages().map(id => ({
          languageId: id
        })),
        about: d.about,
        registrationNumber: d.registrationNumber,
        isSoloPracticeEnabled: true,
      };

      const res = await this.apiService.Post<any>(ApiEndPoints.AddPractitioner, payload);
      if (res.isSuccess) {
        const updatedUser = {
          ...user,
          practitionerId: res.data || existingPracId,
          isProfileCompleted: true,
          isSoloPracticeEnabled: true,
        };
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // Refresh workspaces so Solo and any Clinic affiliations are immediately available
        let soloWs: any = null;
        try {
          const wsRes = await this.relationshipService.resolveWorkspaces();
          if (wsRes.isSuccess && wsRes.data) {
            const options = this.authService.buildProfileOptions(wsRes.data, updatedUser);
            soloWs = options.find(w => w.workspaceType === 'Solo') ?? null;
          }
        } catch {
          // Fall back to explicit Solo workspace locally
        }

        this.authService.setActiveWorkspace(
          soloWs ?? {
            workspaceType: 'Solo',
            accessLevel: 'Solo',
            clinicId: null,
            clinicName: null,
            branchId: null,
            branchName: null,
            branchCode: null,
            city: null,
            isPrimary: false,
          },
          updatedUser
        );
        this.clearDraft();
        this.authService.clearPendingVerification();
        this.alert.toastSuccess(
          this.isSoloSetup()
            ? 'Solo Professional Profile created! Welcome to your Doctor Dashboard.'
            : 'Doctor registration complete! Welcome to PhysiosMate.'
        );
        this.router.navigate(['/doctor-dashboard/dashboard']);
      }
      else {
        this.alert.toastError(res.message);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async submitClinicRegistration(): Promise<void> {
    if (this.clinicForm.invalid) {
      this.clinicForm.markAllAsTouched();
      this.alert.toastError(AppMessage.InvalidForm);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const c = this.clinicForm.value;
      const user = this.registeredUser() || this.authService.getCurrentUser();
      const userId = user?.id || this.authService.getuserid();

      const formData = new FormData();
      const city = this.cityList().find((ci: any) => ci.id === c.city)?.name;
      const stateName = this.stateList().find((si: any) => si.id === c.state)?.name;

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

      const pImg = this.profileImageFile();
      if (pImg) formData.append('file', pImg);

      const cLogo = this.clinicLogoFile();
      if (cLogo) formData.append('logoFile', cLogo);

      const cBanner = this.clinicBannerFile();
      if (cBanner) formData.append('bannerImageFile', cBanner);

      this.clinicMediaFiles().forEach(f => formData.append('clinicMedia', f));
      [...this.selectedServiceIds()].forEach(id => formData.append('serviceIds', id.toString()));

      const res = await this.apiService.PostForm<any>(ApiEndPoints.AddClinic, formData);

      if (res.isSuccess) {
        if (res.data) {
          const clinicId = Number(res.data);
          if (!isNaN(clinicId) && clinicId > 0) {
            this.authService.setClinicId(clinicId);
          }
        }
        this.clearDraft();
        this.authService.clearPendingVerification();
        this.alert.toastSuccess('Clinic registration submitted successfully!');
        this.registrationSuccess.emit();
        this.router.navigate(['/clinics']);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
