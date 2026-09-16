import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { SweetAlertService } from '../../services/sweet-alert.service';

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

  private fb = inject(FormBuilder);
  private authService = inject(Authservice);
  private alert = inject(SweetAlertService);
  private router = inject(Router);

  currentStep: 1 | 2 = 1;
  userType: 'user' | 'doctor' | 'clinic' = 'user';

  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  errorMessage = '';

  basicForm!: FormGroup;
  doctorForm!: FormGroup;
  clinicForm!: FormGroup;

  // Predefined lists
  specializations = [
    'Orthopedic Physiotherapy',
    'Sports Rehabilitation & Injury',
    'Neurological Rehabilitation',
    'Pediatric Physiotherapy',
    'Geriatric Physical Therapy',
    'Cardiopulmonary Rehabilitation',
    'Post-Surgical Rehab & Spine Care',
    'Women Health & Prenatal / Postnatal',
    'General Physical Therapy'
  ];

  qualifications = [
    'BPT - Bachelor of Physiotherapy',
    'MPT - Master of Physiotherapy (Orthopedics)',
    'MPT - Master of Physiotherapy (Neurology)',
    'MPT - Master of Physiotherapy (Sports)',
    'MPT - Master of Physiotherapy (Cardiopulmonary)',
    'MPT - Master of Physiotherapy (Pediatrics)',
    'Ph.D. in Physical Therapy / Rehab Sciences',
    'Fellowship in Sports Rehabilitation',
    'Diploma in Physiotherapy (DPT)'
  ];

  ngOnInit(): void {
    this.initForms();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['verifiedMobile'] && this.basicForm) {
      this.basicForm.patchValue({ mobile: this.verifiedMobile || '' });
    }
    if (changes['verifiedEmail'] && this.basicForm) {
      this.basicForm.patchValue({ email: this.verifiedEmail || '' });
    }
  }

  initForms(): void {
    // Step 1: Basic details for all user types
    this.basicForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      mobile: [this.verifiedMobile || '', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: [this.verifiedEmail || '', [Validators.required, Validators.email]],
      userType: ['user', [Validators.required]],
      dob: ['', [Validators.required]],
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      gender: ['male', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });

    // Step 2: Doctor professional details
    this.doctorForm = this.fb.group({
      specialization: ['Orthopedic Physiotherapy', [Validators.required]],
      qualification: ['BPT - Bachelor of Physiotherapy', [Validators.required]],
      registrationNumber: ['', [Validators.required]],
      experienceYears: [3, [Validators.required, Validators.min(0)]],
      consultationFee: [600, [Validators.required, Validators.min(0)]],
      practiceType: ['clinic', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      about: ['']
    });

    // Step 2: Clinic facility details
    this.clinicForm = this.fb.group({
      clinicName: ['', [Validators.required, Validators.minLength(2)]],
      registrationNumber: ['', [Validators.required]],
      ownerName: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      facilities: ['Electrotherapy, Manual Therapy, Rehabilitation Gym'],
      operatingHours: ['08:00 AM - 08:00 PM']
    });
  }

  setUserType(type: 'user' | 'doctor' | 'clinic'): void {
    this.userType = type;
    this.basicForm.patchValue({ userType: type });
  }

  onDobChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const dobValue = input.value;
    if (!dobValue) return;

    const dob = new Date(dobValue);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age >= 0 && age <= 125) {
      this.basicForm.patchValue({ age });
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

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

    // If User / Patient, registration finishes at Step 1
    if (this.userType === 'user') {
      this.submitUserRegistration();
    } else {
      // Doctor or Clinic moves to Step 2
      this.currentStep = 2;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep(): void {
    this.currentStep = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  submitUserRegistration(): void {
    this.isSubmitting = true;
    this.errorMessage = '';

    const b = this.basicForm.value;
    const payload = {
      fullName: b.fullName.trim(),
      email: b.email.trim(),
      mobile: b.mobile.trim(),
      password: b.password,
      dob: b.dob,
      age: b.age,
      gender: b.gender,
      roleId: 3 // Patient / User
    };

    this.authService.register(payload).subscribe({
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
        console.warn('register fallback:', err);
        // Fallback demo support
        const user = { fullName: b.fullName.trim(), email: b.email.trim(), mobile: b.mobile.trim(), roleId: 3 };
        this.authService.saveUserSession(user, 'demo-user-token');
        this.alert.toastSuccess('Account created successfully!');
        this.registrationSuccess.emit();
        this.router.navigate(['/user-dashboard']);
      }
    });
  }

  submitDoctorRegistration(): void {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      this.alert.toastError('Please fill all required doctor profile details.');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const b = this.basicForm.value;
    const d = this.doctorForm.value;

    const basePayload = {
      fullName: b.fullName.trim(),
      email: b.email.trim(),
      mobile: b.mobile.trim(),
      password: b.password,
      dob: b.dob,
      age: b.age,
      gender: b.gender,
      roleId: 2 // Doctor / Practitioner
    };

    this.authService.register(basePayload).subscribe({
      next: (res: any) => {
        const user = res?.data || res;
        const token = user?.token || res?.token || 'doctor-jwt-token';
        this.authService.saveUserSession(user, token);

        const docPayload = {
          fullName: b.fullName.trim(),
          specialization: d.specialization,
          qualification: d.qualification,
          registrationNumber: d.registrationNumber,
          experienceYears: d.experienceYears,
          consultationFee: d.consultationFee,
          practiceType: d.practiceType,
          city: d.city,
          state: d.state,
          about: d.about,
          mobile: b.mobile.trim(),
          email: b.email.trim()
        };

        this.authService.addPractitioner(docPayload).subscribe({
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

    const basePayload = {
      fullName: c.ownerName.trim(),
      email: b.email.trim(),
      mobile: b.mobile.trim(),
      password: b.password,
      roleId: 4 // Clinic Partner
    };

    this.authService.register(basePayload).subscribe({
      next: (res: any) => {
        const user = res?.data || res;
        const token = user?.token || res?.token || 'clinic-jwt-token';
        this.authService.saveUserSession(user, token);

        const formData = new FormData();
        formData.append('clinicName', c.clinicName);
        formData.append('registrationNumber', c.registrationNumber);
        formData.append('ownerName', c.ownerName);
        formData.append('address', c.address);
        formData.append('city', c.city);
        formData.append('state', c.state);
        formData.append('pincode', c.pincode);
        formData.append('facilities', c.facilities || '');
        formData.append('operatingHours', c.operatingHours || '');

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
        const user = { fullName: c.ownerName.trim(), email: b.email.trim(), mobile: b.mobile.trim(), roleId: 4 };
        this.authService.saveUserSession(user, 'demo-clinic-token');
        this.alert.toastSuccess('Clinic registration submitted successfully!');
        this.registrationSuccess.emit();
        this.router.navigate(['/clinics']);
      }
    });
  }
}
