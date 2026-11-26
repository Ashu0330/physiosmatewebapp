import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NewPatientFormData, DoctorPatient } from '../../../models/doctor-dashboard.model';
import { ApiService } from '../../../services/api.service';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { ApiEndPoints } from '../../../helper/api-endpoints';
import { SharedModule } from '../../../shared/shared-module';
import { Authservice } from '../../../services/authservice';
import { ClinicRelationshipService } from '../../../services/clinic-relationship.service';

// ─── Slot Models ──────────────────────────────────────────────────────────────
interface ConsultancySlot {
  id: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface TreatmentSlot {
  slotId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
  remainingSpots: number;
  isOpen: boolean;
}
type AppointmentSlot = TreatmentSlot;

@Component({
  selector: 'app-addpatient',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './addpatient.html',
  styleUrl: './addpatient.css',
})
export class Addpatient implements OnInit {
  private apiService = inject(ApiService);
  private alert = inject(SweetAlertService);
  private fb = inject(FormBuilder);
  private auth = inject(Authservice);
  private relationshipService = inject(ClinicRelationshipService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  @ViewChild('photoInput') photoInputRef?: ElementRef<HTMLInputElement>;

  patientAdded = output<NewPatientFormData>();
  cancel = output<void>();
  startConsultationWith = output<DoctorPatient>();

  isSavingPatient = false;
  practitioners: { id: number; name: string }[] = [];
  isLoadingPractitioners = false;
  private resolvedClinicId = 0;

  // ─── Dynamic slot state (replaces static list) ────────────────────────────
  consultancySlots = signal<ConsultancySlot[]>([]);
  treatmentSlots = signal<TreatmentSlot[]>([]);
  get appointmentSlots() {
    return this.treatmentSlots;
  }
  isLoadingSlots = false;

  // Keep for backward-compat on onSlotSelected (not used for display now)
  slots: { label: string; startTime: string; endTime: string }[] = [];

  isLoadingSlots_legacy = false;
  selectedSlot: string | undefined = undefined;

  photoPreview: string | null = null;
  registeredPatient = signal<DoctorPatient | null>(null);

  constructor() {
    this.createform();
  }

  ngOnInit(): void {
    this.setupFormSubscriptions();

    if (!this.canAssignPractitioner) {
      const currentPid = this.currentPractitionerId;
      if (currentPid > 0) {
        this.form.patchValue({ assignedPractitionerId: currentPid }, { emitEvent: false });
      }
    }
    this.loadPractitioners();
  }

  get canAssignPractitioner(): boolean {
    return this.auth.canAssignPractitioner();
  }

  get currentClinicId(): number {
    const id = Number(
      this.resolvedClinicId ||
      this.auth.getClinicId() ||
      this.auth.getActiveWorkspace()?.clinicId ||
      this.auth.getCurrentUser()?.clinicId ||
      this.auth.getCurrentUser()?.ClinicId ||
      0
    );
    return id > 0 ? id : 0;
  }

  get useClinicSlots(): boolean {
    return (this.auth.isReceptionistWorkspace() || this.canAssignPractitioner) && this.currentClinicId > 0;
  }

  get currentBranchId(): number | null {
    return this.auth.getActiveClinicBranchId(this.route.snapshot.queryParamMap.get('branchId'));
  }

  get currentPractitionerId(): number {
    const user = this.auth.getCurrentUser();
    const directPid = Number(this.auth.getPractitionerId() || user?.practitionerId || 0);
    if (directPid > 0) {
      return directPid;
    }
    if (!this.canAssignPractitioner) {
      const profId = Number(this.auth.getCurrentProfessionalId() || 0);
      return profId > 0 ? profId : Number(user?.id || 0);
    }
    return 0;
  }

  setupFormSubscriptions(): void {
    this.form.get('visitType')?.valueChanges.subscribe(() => {
      this.onVisitTypeChange();
    });
    this.form.get('assignedPractitionerId')?.valueChanges.subscribe(() => {
      this.onPractitionerChange();
    });
    this.form.get('consultationDate')?.valueChanges.subscribe(() => {
      this.onDateChange();
    });
  }

  createform(): void {
    this.form = this.fb.group({
      file: [null],
      photoPreview: [''],
      fullName: ['', [Validators.required]],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.email]],
      gender: ['Male'],
      dob: [''],
      age: [null],
      address: [''],
      city: [''],
      state: [''],
      fees: [0],
      visitType: [null],
      visitFor: [null],
      visitMode: [null],
      assignedPractitionerId: [null],
      consultationDate: [''],
      startTime: [''],
      endTime: [''],
      slotTime: [null],
      appointmentSlotId: [null],   // ← for Appointment visit type
      amount: [null],
      paymentMode: [null],
      paymentStatus: [null],
      userId: [1],
      roleId: [3],
      phone: [''],
      height: [''],
      weight: [''],
      primaryCondition: ['General Assessment']
    });
  }



  get isConsultancyOrTreatment(): boolean {
    const vt = this.form?.get('visitType')?.value;
    return vt === 'Consultancy' || vt === 'Treatment';
  }

  get isTreatmentVisit(): boolean {
    return this.form?.get('visitType')?.value === 'Treatment';
  }

  get isAppointmentVisit(): boolean {
    return this.isTreatmentVisit;
  }

  get isConsultancyVisit(): boolean {
    return this.form?.get('visitType')?.value === 'Consultancy';
  }

  // ─── Slot Loading & Dropdown Handlers ─────────────────────────────────────
  onVisitTypeChange(): void {
    this.consultancySlots.set([]);
    this.treatmentSlots.set([]);
    this.form.patchValue({ slotTime: null, startTime: '', endTime: '', appointmentSlotId: null });
    this.triggerSlotLoad();
  }

  onPractitionerChange(): void {
    if (this.useClinicSlots || this.auth.isReceptionistWorkspace() || this.canAssignPractitioner) {
      return;
    }
    this.consultancySlots.set([]);
    this.treatmentSlots.set([]);
    this.form.patchValue({ slotTime: null, startTime: '', endTime: '', appointmentSlotId: null });
    this.triggerSlotLoad();
  }

  onDateChange(): void {
    const visitType = this.form.get('visitType')?.value;
    if (visitType === 'Treatment') {
      this.treatmentSlots.set([]);
      this.form.patchValue({ slotTime: null, appointmentSlotId: null, startTime: '', endTime: '' });
      this.triggerSlotLoad();
    } else if (visitType === 'Consultancy') {
      this.triggerSlotLoad();
    }
  }

  async loadPractitioners(): Promise<void> {
    debugger;
    const currentPid = this.currentPractitionerId;
    if (!this.canAssignPractitioner) {
      this.practitioners = currentPid > 0
        ? [{ id: currentPid, name: this.auth.getUserName() || 'Assigned Doctor' }]
        : [];
      if (currentPid > 0 && !this.form.get('assignedPractitionerId')?.value) {
        this.form.patchValue({ assignedPractitionerId: currentPid }, { emitEvent: false });
      }
      this.isLoadingPractitioners = false;
      this.cdr.markForCheck();
      this.triggerSlotLoad();
      return;
    }

    this.isLoadingPractitioners = true;
    try {
      const clinicId = await this.relationshipService.resolveCurrentClinicId();
      if (clinicId > 0) {
        this.resolvedClinicId = clinicId;
      }
      const branchId = this.currentBranchId;
      if (clinicId > 0) {
        const res = await this.relationshipService.getClinicPractitioners(clinicId, 'Active', branchId);
        if (res?.isSuccess && Array.isArray(res.data)) {
          this.practitioners = res.data
            .map((p: any) => ({
              id: Number(p.practitionerId ?? p.id ?? 0),
              name: String(p.practitionerName ?? p.fullName ?? `Practitioner #${p.practitionerId ?? p.id}`).trim()
            }))
            .filter((p: { id: number; name: string }) => p.id > 0);
        } else {
          this.practitioners = [];
        }
      } else {
        this.practitioners = [];
      }
    } catch (e) {
      console.error('Error loading clinic practitioners', e);
      this.practitioners = [];
    } finally {
      if (!this.form.get('assignedPractitionerId')?.value && this.practitioners.length > 0) {
        this.form.patchValue({ assignedPractitionerId: this.practitioners[0].id }, { emitEvent: false });
      }

      this.isLoadingPractitioners = false;
      this.cdr.markForCheck();
      this.triggerSlotLoad();
    }
  }

  async triggerSlotLoad(): Promise<void> {
    const visitType = this.form.get('visitType')?.value;
    if (!visitType || (visitType !== 'Consultancy' && visitType !== 'Treatment')) {
      return;
    }

    const date = this.form.get('consultationDate')?.value;

    if (this.auth.isReceptionistWorkspace() || this.canAssignPractitioner) {
      let clinicId = this.currentClinicId;
      if (clinicId <= 0) {
        clinicId = await this.relationshipService.resolveCurrentClinicId();
        if (clinicId > 0) {
          this.resolvedClinicId = clinicId;
        }
      }
      if (clinicId > 0) {
        if (visitType === 'Consultancy') {
          await this.loadConsultancySlots(0, date, clinicId);
        } else if (visitType === 'Treatment') {
          if (date) {
            await this.loadTreatmentSlots(0, date, clinicId);
          } else {
            this.treatmentSlots.set([]);
          }
        }
        return;
      }
    }

    let practitionerId = this.form.get('assignedPractitionerId')?.value;

    if (!practitionerId && !this.canAssignPractitioner && this.currentPractitionerId > 0) {
      practitionerId = this.currentPractitionerId;
      this.form.patchValue({ assignedPractitionerId: practitionerId }, { emitEvent: false });
    }

    if (!practitionerId) {
      return;
    }

    if (visitType === 'Consultancy') {
      await this.loadConsultancySlots(Number(practitionerId), date);
    } else if (visitType === 'Treatment') {
      if (date) {
        await this.loadTreatmentSlots(Number(practitionerId), date);
      } else {
        this.treatmentSlots.set([]);
      }
    }
  }

  async loadConsultancySlots(practitionerId: number, date?: string, clinicId?: number): Promise<void> {
    this.isLoadingSlots = true;
    this.cdr.markForCheck();
    try {
      const query = clinicId && clinicId > 0
        ? `ClinicId=${clinicId}`
        : `practitionerId=${practitionerId}`;
      const res = await this.apiService.Get<any>(
        `${ApiEndPoints.GetAvailability}?${query}`
      );
      if (res?.isSuccess && res.data) {
        const rawGroups = Array.isArray(res.data) ? res.data : [res.data];
        let targetDayOfWeek: number | null = null;
        if (date) {
          const d = new Date(date);
          if (!isNaN(d.getTime())) {
            targetDayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          }
        }

        const allSlots: ConsultancySlot[] = [];
        for (const group of rawGroups) {
          const groupDay = group.dayOfWeek ?? group.DayOfWeek;
          if (targetDayOfWeek !== null && groupDay !== undefined && groupDay !== targetDayOfWeek) {
            continue;
          }
          const slots = group.slots ?? group.Slots ?? [];
          for (const s of slots) {
            allSlots.push({
              id: s.id ?? s.Id,
              startTime: s.startTime ?? s.StartTime,
              endTime: s.endTime ?? s.EndTime,
              isActive: s.isActive ?? s.IsActive ?? true,
            });
          }
        }

        if (allSlots.length === 0) {
          for (const group of rawGroups) {
            const slots = group.slots ?? group.Slots ?? [];
            for (const s of slots) {
              allSlots.push({
                id: s.id ?? s.Id,
                startTime: s.startTime ?? s.StartTime,
                endTime: s.endTime ?? s.EndTime,
                isActive: s.isActive ?? s.IsActive ?? true,
              });
            }
          }
        }

        this.consultancySlots.set(allSlots.filter(s => s.isActive));
      } else {
        this.consultancySlots.set([]);
      }
    } catch (e) {
      console.error('Error loading consultancy slots', e);
      this.consultancySlots.set([]);
    } finally {
      this.isLoadingSlots = false;
      this.cdr.markForCheck();
    }
  }

  async loadTreatmentSlots(practitionerId: number, date: string, clinicId?: number): Promise<void> {
    this.isLoadingSlots = true;
    this.cdr.markForCheck();
    try {
      const query = clinicId && clinicId > 0
        ? `clinicId=${clinicId}&date=${encodeURIComponent(date)}`
        : `practitionerId=${practitionerId}&date=${encodeURIComponent(date)}`;
      const res = await this.apiService.Get<any>(
        `${ApiEndPoints.GetAvailableAppointmentSlots}?${query}`
      );
      if (res?.isSuccess && res.data) {
        const raw = Array.isArray(res.data) ? res.data : [res.data];
        const data: TreatmentSlot[] = raw.map((s: any) => ({
          slotId: s.slotId ?? s.SlotId,
          slotDate: s.slotDate ?? s.SlotDate,
          startTime: s.startTime ?? s.StartTime,
          endTime: s.endTime ?? s.EndTime,
          maxCapacity: s.maxCapacity ?? s.MaxCapacity,
          currentBookings: s.currentBookings ?? s.CurrentBookings,
          remainingSpots: s.remainingSpots ?? s.RemainingSpots,
          isOpen: s.isOpen ?? s.IsOpen ?? true,
        }));
        this.treatmentSlots.set(data.filter(s => s.isOpen && s.remainingSpots > 0));
      } else {
        this.treatmentSlots.set([]);
      }
    } catch (e) {
      console.error('Error loading treatment slots', e);
      this.treatmentSlots.set([]);
    } finally {
      this.isLoadingSlots = false;
      this.cdr.markForCheck();
    }
  }

  loadAppointmentSlots(practitionerId: number, date: string): Promise<void> {
    return this.loadTreatmentSlots(practitionerId, date);
  }

  formatSlotTime(t: string): string {
    if (!t) return '';
    const parts = t.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  onSlotSelected(): void {
    const visitType = this.form.get('visitType')?.value;
    const slotVal = this.form.get('slotTime')?.value;

    if (visitType === 'Treatment') {
      const slot = this.treatmentSlots().find(s => s.slotId == slotVal);
      if (slot) {
        this.form.patchValue({
          appointmentSlotId: slot.slotId,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      }
    } else {
      const slot = this.consultancySlots().find(s => s.id == slotVal);
      if (slot) {
        this.selectedSlot = `${slot.startTime}–${slot.endTime}`;
        this.form.patchValue({
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      } else {
        this.selectedSlot = undefined;
        this.form.patchValue({ startTime: '', endTime: '' });
      }
    }
  }

  // ─── Photo File Upload Handling ──────────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const selectedFile = input.files[0];
      this.form.patchValue({ file: selectedFile });

      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
        this.form.patchValue({ photoPreview: this.photoPreview });
      };
      reader.readAsDataURL(selectedFile);
    }
  }

  removePhoto(fileInput?: HTMLInputElement): void {
    this.form.patchValue({ file: null, photoPreview: '' });
    this.photoPreview = null;
    const input = fileInput || this.photoInputRef?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  // ─── DOB & Age Calculation ───────────────────────────────────────────────
  onDobChange(): void {
    const dob = this.form.get('dob')?.value;
    if (dob) {
      const birth = new Date(dob);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      this.form.patchValue({ age: age >= 0 ? age : null });
    } else {
      this.form.patchValue({ age: null });
    }
  }

  // ─── Submit Registration Form ────────────────────────────────────────────
  onSubmit(): void {
    this.addPatient();
  }

  async addPatient(): Promise<void> {
    const formVal = this.form.getRawValue();

    if (!formVal.fullName?.trim()) {
      this.alert.error('Please enter patient full name.');
      return;
    }
    if (!formVal.mobile?.trim()) {
      this.alert.error('Please enter mobile number.');
      return;
    }

    this.isSavingPatient = true;

    try {
      const visitTypeValue = formVal.visitType ?? (
        formVal.visitFor === 'Consultation' ? 'Consultancy' : formVal.visitFor
      );
      const branchId = this.currentBranchId;
      const params = new URLSearchParams({
        FullName: formVal.fullName.trim(),
        Mobile: formVal.mobile.trim(),
        ...(formVal.email?.trim() ? { Email: formVal.email.trim() } : {}),
        ...(formVal.gender ? { Gender: formVal.gender as string } : {}),
        ...(formVal.dob ? { DOB: formVal.dob } : {}),
        ...(formVal.address?.trim() ? { Address: formVal.address.trim() } : {}),
        ...(formVal.city?.trim() ? { City: formVal.city.trim() } : {}),
        ...(formVal.state?.trim() ? { State: formVal.state.trim() } : {}),
        ...(visitTypeValue ? { VisitType: visitTypeValue } : {}),
        ...(formVal.visitMode ? { VisitMode: formVal.visitMode } : {}),
        ...(formVal.assignedPractitionerId != null
          ? { AssignedPractitionerId: String(formVal.assignedPractitionerId) } : {}),
        ...(branchId != null && branchId > 0
          ? { ClinicBranchId: String(branchId) } : {}),
        ...(formVal.consultationDate ? {
          ConsultationDate: formVal.consultationDate,
          AppointmentDate: formVal.consultationDate
        } : {}),
        ...(formVal.startTime ? { StartTime: formVal.startTime } : {}),
        ...(formVal.endTime ? { EndTime: formVal.endTime } : {}),
        ...(visitTypeValue === 'Treatment' && formVal.appointmentSlotId != null
          ? { AppointmentSlotId: String(formVal.appointmentSlotId) } : {}),
        ...(formVal.amount != null ? { Amount: String(formVal.amount) } : {}),
        ...(formVal.paymentMode ? { PaymentMode: formVal.paymentMode } : {}),
        ...(formVal.paymentStatus ? { PaymentStatus: formVal.paymentStatus } : {}),
      });

      // Build multipart/form-data body for the profile photo
      const body = new FormData();
      if (formVal.file) {
        body.append('file', formVal.file);
      }

      const endpoint = `${ApiEndPoints.AddPatient}?${params.toString()}`;
      const res: any = await this.apiService.PostForm<any>(endpoint, body);

      if (res && res.isSuccess) {
        this.alert.success(res.message);
        const p = res.data?.patient;
        const newPtCode = `PT-${res.data?.patientId}`;
        const newPatient = res.data.items;
        // const newPatient: DoctorPatient = {
        //   id: newPtCode,
        //   patientCode: newPtCode,
        //   fullName: p?.fullName ?? formVal.fullName.trim(),
        //   age: p?.age ?? formVal.age ?? 0,
        //   gender: p?.gender ?? (formVal.gender as string),
        //   dob: p?.dob ?? formVal.dob,
        //   phone: p?.mobile ?? formVal.mobile.trim(),
        //   mobile: p?.mobile ?? formVal.mobile.trim(),
        //   email: p?.email ?? formVal.email?.trim() ?? '',
        //   address: formVal.address?.trim() ?? '',
        //   city: p?.city ?? formVal.city?.trim() ?? '',
        //   state: p?.state ?? formVal.state?.trim() ?? '',
        //   photoUrl: p?.profileImage ?? this.photoPreview ?? undefined,
        //   userId: formVal.userId ?? 1,
        //   roleId: formVal.roleId ?? 3,
        //   primaryCondition: 'General Assessment',
        //   status: 'Active',
        //   currentPlan: 'General Physiotherapy Plan',
        //   sessionsCompleted: 0,
        //   totalSessions: 10,
        //   lastVisit: 'Just Registered',
        //   nextAppointment: 'Pending Schedule',
        //   notes: 'Registered via Add Patient form.'
        // };

        this.registeredPatient.set(newPatient);
        this.form.patchValue({ phone: formVal.mobile.trim() });
        this.patientAdded.emit({ ...this.form.getRawValue() });
      } else {
        this.alert.success(res?.message || 'Failed to add patient.');
      }
    } catch (e: any) {
      console.error('Add patient error', e);
      this.alert.error('Error adding patient. Please try again.');
    } finally {
      this.isSavingPatient = false;
    }
  }

  // ─── Form Reset & Navigation ─────────────────────────────────────────────
  resetForm(): void {
    this.createform();
    this.setupFormSubscriptions();
    if (!this.canAssignPractitioner) {
      const currentPid = this.currentPractitionerId;
      if (currentPid > 0) {
        this.form.patchValue({ assignedPractitionerId: currentPid }, { emitEvent: false });
      }
    } else if (this.practitioners.length > 0) {
      this.form.patchValue({ assignedPractitionerId: this.practitioners[0].id }, { emitEvent: false });
    }
    this.photoPreview = null;
    this.selectedSlot = undefined;
    this.consultancySlots.set([]);
    this.treatmentSlots.set([]);
    this.registeredPatient.set(null);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onStartConsultation(): void {
    if (this.registeredPatient()) {
      this.startConsultationWith.emit(this.registeredPatient()!);
    }
  }

  getInitials(name: string): string {
    return name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'PT';
  }

  async Getpatient(e: any): Promise<void> {
    const val = typeof e === 'string' ? e : this.form.get('mobile')?.value;
    if (!val || val.length < 10) {
      return;
    }
    const mobile = val.trim();
    try {
      const request = { search: mobile };

      const response = await this.apiService.Post<any>(
        ApiEndPoints.GetMyPatients,
        request
      );

      if (response && response.isSuccess && response.data?.items?.length > 0) {
        const patient = response.data.items[0];
        this.form.patchValue({
          fullName: patient.fullName ?? '',
          mobile: patient.mobile ?? mobile,
          email: patient.email ?? '',
          gender: patient.gender ?? 'Male',
          dob: patient.dob ?? '',
          address: patient.address ?? '',
          city: patient.city ?? '',
          state: patient.state ?? '',
          userId: patient.userId,
          roleId: patient.roleId,
          phone: patient.phone ?? patient.mobile ?? mobile,
          primaryCondition: patient.primaryCondition ?? 'General Assessment'
        });

        if (patient.dob) {
          this.onDobChange();
        }

        this.alert.success('Patient details fetched successfully.');
      } else {
        this.alert.error(response?.message || 'Patient not found.');
      }
    } catch (error) {
      this.alert.error('Error fetching patient details. Please try again.');
    }
  }
}
