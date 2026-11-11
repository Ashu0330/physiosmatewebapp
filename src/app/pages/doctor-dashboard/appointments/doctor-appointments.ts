import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DoctorPatient,
  DoctorAppointment,
  DoctorInquiryOrAppointment,
  AppointmentPatientSearchItem,
  PatientAppointmentHistoryItem
} from '../../../models/doctor-dashboard.model';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { ApiService } from '../../../services/api.service';
import { ApiEndPoints } from '../../../helper/api-endpoints';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-appointments.html',
  styleUrl: './doctor-appointments.css',
})
export class DoctorAppointments implements OnInit {
  private alertService = inject(SweetAlertService);
  private apiService = inject(ApiService);

  @Input() patients: DoctorPatient[] = [];
  @Input() appointments: DoctorAppointment[] = [];
  @Output() appointmentAdded = new EventEmitter<DoctorInquiryOrAppointment>();

  // ─── Search & Selection State ───────────────────────────────────────────────
  patientSearchQuery = signal<string>('');
  selectedPatientId = signal<string | null>(null);
  selectedPatient = signal<DoctorPatient | null>(null);
  isSearchDropdownOpen = signal<boolean>(false);
  patientSearchResults = signal<AppointmentPatientSearchItem[]>([]);
  isSearchingPatients = signal<boolean>(false);
  selectedPatientItem = signal<AppointmentPatientSearchItem | null>(null);

  // ─── Patient Appointment History State ──────────────────────────────────────
  patientAppointmentHistory = signal<PatientAppointmentHistoryItem[]>([]);
  isLoadingHistory = signal<boolean>(false);
  selectedAppointment = signal<PatientAppointmentHistoryItem | null>(null);
  appointmentDetailModal = signal<PatientAppointmentHistoryItem | null>(null);

  // ─── Time Slot Presets ─────────────────────────────────────────────────────
  availableSlots = [
    '09:30 AM - 10:15 AM',
    '10:30 AM - 11:15 AM',
    '11:15 AM - 12:00 PM',
    '02:00 PM - 02:45 PM',
    '03:15 PM - 04:00 PM',
    '04:30 PM - 05:15 PM',
    '05:30 PM - 06:15 PM'
  ];

  // ─── Active Form Model ─────────────────────────────────────────────────────
  formData = {
    patientCode: '',
    fullName: '',
    phone: '',
    email: '',
    age: null as number | null,
    gender: 'Male' as 'Male' | 'Female' | 'Other',

    // Appointment Specifics
    appointmentDate: '',
    timeSlot: '09:30 AM - 10:15 AM',
    visitType: 'In-Clinic' as 'In-Clinic' | 'Video Call' | 'Home Visit',
    sessionType: 'Regular Rehab Session' as 'Initial Assessment' | 'Regular Rehab Session' | 'Follow-up Review',
    condition: '',
    fee: 500,
    appointmentNotes: '',
    appointmentStatus: 'Scheduled' as 'Scheduled' | 'In-Progress' | 'Completed'
  };

  ngOnInit(): void {
    const today = new Date();
    this.formData.appointmentDate = today.toISOString().split('T')[0];
  }

  // ─── Live Patient Search via Backend API (Matching Consultancy Approach) ───
  async onPatientSearchChange(query: string): Promise<void> {
    this.patientSearchQuery.set(query);
    this.isSearchDropdownOpen.set(true);

    if (!query.trim()) {
      this.patientSearchResults.set([]);
      return;
    }

    this.isSearchingPatients.set(true);
    try {
      const res = await this.apiService.Post<any>(ApiEndPoints.GetPractitionerAppointments, {
        search: query.trim(),
        page: 1,
        pageSize: 10
      });
      if (res?.isSuccess && Array.isArray(res.data) && res.data.length > 0) {
        this.patientSearchResults.set(res.data as AppointmentPatientSearchItem[]);
      } else {
        this.patientSearchResults.set([]);
      }
    } catch (e) {
      console.error('Patient search error', e);
      this.patientSearchResults.set([]);
    } finally {
      this.isSearchingPatients.set(false);
    }
  }

  // ─── Select Patient from Search Results ─────────────────────────────────────
  async selectPatientFromSearch(item: AppointmentPatientSearchItem): Promise<void> {
    const ptCode = `PT-${item.patientId}`;
    const patient: DoctorPatient = {
      id: ptCode,
      patientCode: ptCode,
      fullName: item.fullName,
      age: item.age,
      gender: (item.gender as 'Male' | 'Female' | 'Other') || 'Male',
      phone: item.mobile,
      mobile: item.mobile,
      email: item.email || '',
      address: item.address || undefined,
      city: item.city || undefined,
      state: item.state || undefined,
      photoUrl: item.profileImage || undefined,
      status: 'Active',
      sessionsCompleted: 0,
      totalSessions: 0,
      lastVisit: item.lastVisitDate
        ? new Date(item.lastVisitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A',
    };

    this.selectedPatientItem.set(item);
    this.selectPatient(patient);

    if (item.appointmentDate) {
      this.formData.appointmentDate = item.appointmentDate.split('T')[0];
    }
    if (item.fees) {
      this.formData.fee = item.fees;
    }
    if (item.appointmentStatus && ['Scheduled', 'In-Progress', 'Completed'].includes(item.appointmentStatus)) {
      this.formData.appointmentStatus = item.appointmentStatus as 'Scheduled' | 'In-Progress' | 'Completed';
    }
    if (item.startTime && item.endTime) {
      this.formData.timeSlot = `${item.startTime} - ${item.endTime}`;
    }

    // Load Appointment History for this patient
    await this.loadPatientAppointmentHistory(item.patientId);
  }

  // ─── Load Patient Past Appointment History from Backend ────────────────────
  async loadPatientAppointmentHistory(patientId: number): Promise<void> {
    this.isLoadingHistory.set(true);
    this.patientAppointmentHistory.set([]);
    this.selectedAppointment.set(null);

    try {
      const res = await this.apiService.Get<PatientAppointmentHistoryItem[]>(
        `${ApiEndPoints.PatientAppointmentDetails}?patientId=${patientId}`
      );

      if (res?.isSuccess && Array.isArray(res.data) && res.data.length > 0) {
        this.patientAppointmentHistory.set(res.data);
      }
    } catch (e) {
      console.error('Appointment history error', e);
    } finally {
      this.isLoadingHistory.set(false);
    }
  }

  // ─── Auto-Fill Form on Patient Selection ───────────────────────────────────
  selectPatient(patient: DoctorPatient): void {
    this.selectedPatient.set(patient);
    this.selectedPatientId.set(patient.id);
    this.isSearchDropdownOpen.set(false);
    this.patientSearchQuery.set('');
    this.patientSearchResults.set([]);

    this.formData.patientCode = patient.patientCode || patient.id;
    this.formData.fullName = patient.fullName;
    this.formData.phone = patient.mobile || patient.phone || '';
    this.formData.email = patient.email || '';
    this.formData.age = patient.age;
    this.formData.gender = (patient.gender as 'Male' | 'Female' | 'Other') || 'Male';
    this.formData.condition = patient.primaryCondition || '';
    this.formData.appointmentNotes = patient.notes || '';
    if (!this.formData.fee) {
      this.formData.fee = 500;
    }

    // Attempt to load appointment history if patient has numeric ID
    const rawId = (patient.patientCode || patient.id).replace(/\D/g, '');
    const numericId = parseInt(rawId, 10);
    if (!isNaN(numericId) && numericId > 0 && !this.selectedPatientItem()) {
      this.loadPatientAppointmentHistory(numericId);
    }
  }

  // ─── Select Appointment from History (open modal) ───────────────────────────
  selectAppointment(apt: PatientAppointmentHistoryItem): void {
    this.selectedAppointment.set(apt);
    this.appointmentDetailModal.set(apt);
  }

  closeAppointmentModal(): void {
    this.appointmentDetailModal.set(null);
  }

  // ─── Clear Form for New Patient ───────────────────────────────────────────
  clearForNewEntry(): void {
    this.selectedPatient.set(null);
    this.selectedPatientId.set(null);
    this.selectedPatientItem.set(null);
    this.patientSearchQuery.set('');
    this.patientSearchResults.set([]);
    this.patientAppointmentHistory.set([]);
    this.selectedAppointment.set(null);
    this.appointmentDetailModal.set(null);
    this.isSearchDropdownOpen.set(false);

    this.formData = { 
      patientCode: '',
      fullName: '',
      phone: '',
      email: '',
      age: null,
      gender: 'Male',

      appointmentDate: new Date().toISOString().split('T')[0],
      timeSlot: '09:30 AM - 10:15 AM',
      visitType: 'In-Clinic',
      sessionType: 'Regular Rehab Session',
      condition: '',
      fee: 500,
      appointmentNotes: '',
      appointmentStatus: 'Scheduled'
    };
  }

  setTimeSlot(slot: string): void {
    this.formData.timeSlot = slot;
  }

  // ─── Save Appointment ─────────────────────────────────────────────────────
  onSave(): void {
    if (!this.formData.fullName.trim()) {
      this.alertService.error('Missing Information', 'Please provide the patient name.');
      return;
    }
    if (!this.formData.phone.trim()) {
      this.alertService.error('Missing Information', 'Please provide a contact phone number.');
      return;
    }

    const code = `BKG-${Date.now().toString().slice(-4)}`;
    const newAppointment: DoctorInquiryOrAppointment = {
      id: `APT-${Date.now().toString().slice(-4)}`,
      bookingCode: code,
      entryType: 'appointment',
      patientId: this.formData.patientCode || 'PT-NEW',
      patientCode: this.formData.patientCode || 'PT-NEW',
      patientName: this.formData.fullName,
      phone: this.formData.phone,
      email: this.formData.email,
      age: this.formData.age || 30,
      gender: this.formData.gender,
      date: this.formData.appointmentDate,
      timeSlot: this.formData.timeSlot,
      visitType: this.formData.visitType,
      conditionOrInterest: this.formData.condition || 'Physical Therapy Session',
      notes: this.formData.appointmentNotes,
      status: this.formData.appointmentStatus,
      fee: this.formData.fee
    };

    this.appointmentAdded.emit(newAppointment);
    this.alertService.toastSuccess(`Appointment scheduled for ${newAppointment.patientName} (${newAppointment.timeSlot})!`);
  }

  formatBookingDate(dateStr?: string | null): string {
    if (!dateStr || dateStr.startsWith('0001-01-01')) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  getInitials(name: string): string {
    if (!name) return 'PT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
}
