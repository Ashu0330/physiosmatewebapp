import { Component, ElementRef, OnInit, ViewChild, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NewPatientFormData, DoctorPatient } from '../../../models/doctor-dashboard.model';
import { ApiService } from '../../../services/api.service';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { ApiEndPoints } from '../../../helper/api-endpoints';
import { SharedModule } from '../../../shared/shared-module';

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

  form!: FormGroup;
  @ViewChild('photoInput') photoInputRef?: ElementRef<HTMLInputElement>;

  patientAdded = output<NewPatientFormData>();
  cancel = output<void>();
  startConsultationWith = output<DoctorPatient>();

  isSavingPatient = false;
  practitioners: { id: number; name: string }[] = [];
  isLoadingPractitioners = false;
  slots: { label: string; startTime: string; endTime: string }[] = [
    { label: '09:00 - 09:30', startTime: '09:00', endTime: '09:30' },
    { label: '09:30 - 10:00', startTime: '09:30', endTime: '10:00' },
    { label: '10:00 - 10:30', startTime: '10:00', endTime: '10:30' },
    { label: '10:30 - 11:00', startTime: '10:30', endTime: '11:00' },
    { label: '11:00 - 11:30', startTime: '11:00', endTime: '11:30' },
    { label: '11:30 - 12:00', startTime: '11:30', endTime: '12:00' },
    { label: '14:00 - 14:30', startTime: '14:00', endTime: '14:30' },
    { label: '14:30 - 15:00', startTime: '14:30', endTime: '15:00' },
    { label: '15:00 - 15:30', startTime: '15:00', endTime: '15:30' },
    { label: '15:30 - 16:00', startTime: '15:30', endTime: '16:00' },
  ];
  isLoadingSlots = false;
  selectedSlot: string | undefined = undefined;

  photoPreview: string | null = null;
  registeredPatient = signal<DoctorPatient | null>(null);

  constructor() {
    this.createform();
  }

  ngOnInit(): void {
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



  onSlotSelected(): void {
    const slotLabel = this.form.get('slotTime')?.value || this.selectedSlot;
    const slot = this.slots.find(s => s.label === slotLabel);
    if (slot) {
      this.selectedSlot = slot.label;
      this.form.patchValue({
        slotTime: slot.label,
        startTime: slot.startTime,
        endTime: slot.endTime
      });
    } else {
      this.selectedSlot = undefined;
      this.form.patchValue({
        startTime: '',
        endTime: ''
      });
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
        ...(formVal.consultationDate ? { ConsultationDate: formVal.consultationDate } : {}),
        ...(formVal.startTime ? { StartTime: formVal.startTime } : {}),
        ...(formVal.endTime ? { EndTime: formVal.endTime } : {}),
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
    this.photoPreview = null;
    this.selectedSlot = undefined;
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
