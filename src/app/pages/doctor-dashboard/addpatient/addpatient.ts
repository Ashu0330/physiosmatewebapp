import { Component, ElementRef, OnInit, ViewChild, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewPatientFormData, DoctorPatient } from '../../../models/doctor-dashboard.model';
import { ApiService } from '../../../services/api.service';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { ApiEndPoints } from '../../../helper/api-endpoints';

@Component({
  selector: 'app-addpatient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './addpatient.html',
  styleUrl: './addpatient.css',
})
export class Addpatient implements OnInit {
  private apiService = inject(ApiService);
  private alert = inject(SweetAlertService);

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

  private showError(msg: string): void { this.alert.toastError(msg); }

  ngOnInit(): void {
    this.loadPractitioners();
  }

  async loadPractitioners(): Promise<void> {
    this.isLoadingPractitioners = true;
    try {
      const res = await this.apiService.Get<any>(ApiEndPoints.GetPractitioners);
      if (res && res.isSuccess && Array.isArray(res.data)) {
        this.practitioners = res.data.map((p: any) => ({
          id: p.userId ?? p.id ?? p.practitionerId,
          name: p.fullName ?? p.name ?? `Practitioner ${p.userId ?? p.id}`
        }));
      } else if (res && res.isSuccess && res.data?.items) {
        this.practitioners = res.data.items.map((p: any) => ({
          id: p.userId ?? p.id ?? p.practitionerId,
          name: p.fullName ?? p.name ?? `Practitioner ${p.userId ?? p.id}`
        }));
      }
    } catch (e) {
      console.error('Failed to load practitioners', e);
    } finally {
      this.isLoadingPractitioners = false;
    }
  }

  

  onSlotSelected(): void {
    const slot = this.slots.find(s => s.label === this.selectedSlot);
    if (slot) {
      this.formData.startTime = slot.startTime;
      this.formData.endTime   = slot.endTime;
    } else {
      this.formData.startTime = '';
      this.formData.endTime   = '';
    }
  }

  private showSuccess(msg: string): void { this.alert.toastSuccess(msg); }

  formData: NewPatientFormData = {
    file: null,
    height: '',
    weight: '',
    photoPreview: '',
    fullName: '',
    mobile: '',
    email: '',
    gender: 'Male',
    dob: '',
    age: null,
    address: '',
    city: '',
    state: '',
    fees: 0,
    visitType: undefined,
    visitFor: undefined,
    visitMode: undefined,
    assignedPractitionerId: undefined,
    consultationDate: '',
    startTime: '',
    endTime: '',
    amount: undefined,
    paymentMode: undefined,
    paymentStatus: undefined,
    userId: 1,
    roleId: 3,
    phone: '',
    primaryCondition: 'General Assessment'
  };

  photoPreview: string | null = null;
  registeredPatient = signal<DoctorPatient | null>(null);
  errorMessage = '';

  // ─── Photo File Upload Handling ──────────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const selectedFile = input.files[0];
      this.formData.file = selectedFile;

      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
        this.formData.photoPreview = this.photoPreview;
      };
      reader.readAsDataURL(selectedFile);
    }
  }

  removePhoto(fileInput?: HTMLInputElement): void {
    this.formData.file = null;
    this.photoPreview = null;
    this.formData.photoPreview = '';
    const input = fileInput || this.photoInputRef?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  // ─── DOB & Age Calculation ───────────────────────────────────────────────
  onDobChange(): void {
    if (this.formData.dob) {
      const birth = new Date(this.formData.dob);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      this.formData.age = age >= 0 ? age : null;
    } else {
      this.formData.age = null;
    }
  }

  // ─── Submit Registration Form ────────────────────────────────────────────
  onSubmit(): void {
    this.addPatient();
  }

  async addPatient(): Promise<void> {
    if (!this.formData.fullName?.trim()) {
      this.showError('Please enter patient full name.');
      return;
    }
    if (!this.formData.mobile?.trim()) {
      this.showError('Please enter mobile number.');
      return;
    }

    this.errorMessage = '';
    this.isSavingPatient = true;

    try {
      // Build query-param URL (mirrors the curl spec)
      const visitTypeValue = this.formData.visitType ?? (
        this.formData.visitFor === 'Consultation' ? 'Consultancy' : this.formData.visitFor
      );
      const params = new URLSearchParams({
        FullName: this.formData.fullName.trim(),
        Mobile: this.formData.mobile.trim(),
        ...(this.formData.email?.trim() ? { Email: this.formData.email.trim() } : {}),
        ...(this.formData.gender ? { Gender: this.formData.gender as string } : {}),
        ...(this.formData.dob ? { DOB: this.formData.dob } : {}),
        ...(this.formData.address?.trim() ? { Address: this.formData.address.trim() } : {}),
        ...(this.formData.city?.trim() ? { City: this.formData.city.trim() } : {}),
        ...(this.formData.state?.trim() ? { State: this.formData.state.trim() } : {}),
        ...(visitTypeValue ? { VisitType: visitTypeValue } : {}),
        ...(this.formData.visitMode ? { VisitMode: this.formData.visitMode } : {}),
        ...(this.formData.assignedPractitionerId != null
          ? { AssignedPractitionerId: String(this.formData.assignedPractitionerId) } : {}),
        ...(this.formData.consultationDate ? { ConsultationDate: this.formData.consultationDate } : {}),
        ...(this.formData.startTime ? { StartTime: this.formData.startTime } : {}),
        ...(this.formData.endTime ? { EndTime: this.formData.endTime } : {}),
        ...(this.formData.amount != null ? { Amount: String(this.formData.amount) } : {}),
        ...(this.formData.paymentMode ? { PaymentMode: this.formData.paymentMode } : {}),
        ...(this.formData.paymentStatus ? { PaymentStatus: this.formData.paymentStatus } : {}),
      });

      // Build multipart/form-data body for the profile photo
      const body = new FormData();
      if (this.formData.file) {
        body.append('file', this.formData.file);
      }

      const endpoint = `${ApiEndPoints.AddPatient}?${params.toString()}`;
      const res = await this.apiService.PostForm<any>(endpoint, body);

      if (res && res.isSuccess) {
        this.showSuccess(res.message || 'Patient added successfully.');
        const p = res.data?.patient;

        const newPtCode = `PT-${res.data?.patientId ?? Math.floor(1040 + Math.random() * 900)}`;
        const newPatient: DoctorPatient = {
          id: newPtCode,
          patientCode: newPtCode,
          fullName: p?.fullName ?? this.formData.fullName.trim(),
          age: p?.age ?? this.formData.age ?? 0,
          gender: p?.gender ?? (this.formData.gender as string),
          dob: p?.dob ?? this.formData.dob,
          phone: p?.mobile ?? this.formData.mobile.trim(),
          mobile: p?.mobile ?? this.formData.mobile.trim(),
          email: p?.email ?? this.formData.email?.trim() ?? '',
          address: this.formData.address?.trim() ?? '',
          city: p?.city ?? this.formData.city?.trim() ?? '',
          state: p?.state ?? this.formData.state?.trim() ?? '',
          photoUrl: p?.profileImage ?? this.photoPreview ?? undefined,
          userId: this.formData.userId ?? 1,
          roleId: this.formData.roleId ?? 3,
          primaryCondition: 'General Assessment',
          status: 'Active',
          currentPlan: 'General Physiotherapy Plan',
          sessionsCompleted: 0,
          totalSessions: 10,
          lastVisit: 'Just Registered',
          nextAppointment: 'Pending Schedule',
          notes: 'Registered via Add Patient form.'
        };

        this.registeredPatient.set(newPatient);
        this.formData.phone = this.formData.mobile.trim();
        this.patientAdded.emit({ ...this.formData });
      } else {
        this.showError(res?.message || 'Failed to add patient.');
      }
    } catch (e: any) {
      console.error('Add patient error', e);
      this.showError('Error adding patient. Please try again.');
    } finally {
      this.isSavingPatient = false;
    }
  }

  // ─── Form Reset & Navigation ─────────────────────────────────────────────
  resetForm(): void {
    this.formData = {
      file: null,
      photoPreview: '',
      fullName: '',
      mobile: '',
      email: '',
      gender: 'Male',
      dob: '',
      age: null,
      fees: 0,
      visitType: undefined,
      visitFor: undefined,
      visitMode: undefined,
      assignedPractitionerId: undefined,
      consultationDate: '',
      startTime: '',
      endTime: '',
      amount: undefined,
      paymentMode: undefined,
      paymentStatus: undefined,
      address: '',
      city: '',
      state: '',
      userId: 1,
      roleId: 3,
      phone: '',
      primaryCondition: 'General Assessment'
    };
    this.photoPreview = null;
    this.errorMessage = '';
    this.selectedSlot = undefined;
    this.slots = [];
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
    if (e.length !== 10) {
      return;
    }
    const mobile = this.formData.mobile?.trim();

    if (!mobile) {
      this.showError('Please enter mobile number.');
      return;
    }

    try {
      const request = {
        search: mobile
      };

      const response = await this.apiService.Post<any>(
        ApiEndPoints.GetMyPatients,
        request
      );

      if (response.isSuccess && response.data?.items?.length > 0) {
        const patient = response.data.items[0];
        this.formData = {
          ...this.formData,
          fullName: patient.fullName ?? '',
          mobile: patient.mobile ?? mobile,
          email: patient.email ?? '',
          gender: patient.gender ?? 'Male',
          dob: patient.dob ?? '',
          address: patient.address ?? '',
          city: patient.city ?? '',
          state: patient.state ?? '',
          userId: patient.userId ?? 1,
          roleId: patient.roleId ?? 3,
          phone: patient.phone ?? patient.mobile ?? mobile,
          primaryCondition: patient.primaryCondition ?? 'General Assessment'
        };

        this.showSuccess('Patient details fetched successfully.');
      } else {
        this.showError(response?.message || 'Patient not found.');
      }
    } catch (error) {
      console.error('Get patient error:', error);
      this.showError('Error fetching patient details. Please try again.');
    }
  }
}
