import { Component, ElementRef, ViewChild, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewPatientFormData, DoctorPatient } from '../../../models/doctor-dashboard.model';

@Component({
  selector: 'app-addpatient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './addpatient.html',
  styleUrl: './addpatient.css',
})
export class Addpatient {
  @ViewChild('photoInput') photoInputRef?: ElementRef<HTMLInputElement>;

  patientAdded = output<NewPatientFormData>();
  cancel = output<void>();
  startConsultationWith = output<DoctorPatient>();

  formData: NewPatientFormData = {
    file: null,
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
    if (!this.formData.fullName?.trim()) {
      this.errorMessage = 'Please enter patient full name.';
      return;
    }
    if (!this.formData.mobile?.trim()) {
      this.errorMessage = 'Please enter mobile number.';
      return;
    }

    this.errorMessage = '';
    this.formData.phone = this.formData.mobile.trim();

    // Emit payload to parent dashboard
    this.patientAdded.emit({ ...this.formData });

    // Generate local patient entity for post-registration preview
    const newPtCode = `PT-${Math.floor(1040 + Math.random() * 900)}`;
    const newPatient: DoctorPatient = {
      id: newPtCode,
      patientCode: newPtCode,
      fullName: this.formData.fullName.trim(),
      age: this.formData.age || 30,
      gender: this.formData.gender as string,
      dob: this.formData.dob,
      phone: this.formData.mobile.trim(),
      mobile: this.formData.mobile.trim(),
      email: this.formData.email?.trim() || `${this.formData.fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      address: this.formData.address?.trim() || '',
      city: this.formData.city?.trim() || '',
      state: this.formData.state?.trim() || '',
      photoUrl: this.photoPreview || undefined,
      userId: this.formData.userId || 1,
      roleId: this.formData.roleId || 3,
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
    this.registeredPatient.set(null);
    // const input = fileInput || this.photoInputRef?.nativeElement;
    // if (input) {
    //   input.value = '';
    // }
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
}
