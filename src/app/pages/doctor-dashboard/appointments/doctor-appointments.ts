import { Component, Input, Output, EventEmitter, OnInit, ElementRef, HostListener, PLATFORM_ID, signal, computed, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DoctorPatient,
  DoctorAppointment,
  DoctorInquiryOrAppointment,
  AppointmentPatientSearchItem,
  PatientAppointmentHistoryItem,
  CompleteAppointmentRequest
} from '../../../models/doctor-dashboard.model';
import { ProviderAddon } from '../../../models/mastermodel';
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
  private elementRef = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);

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

  // ─── Add-on Services (Multiselect via GetAllAddOns) ────────────────────────
  addons = signal<ProviderAddon[]>([]);
  isLoadingAddons = signal<boolean>(false);
  selectedAddOns = signal<ProviderAddon[]>([]);
  isAddonDropdownOpen = signal<boolean>(false);
  selectedAddOnPayload = computed(() =>
    this.selectedAddOns().map(addon => ({
      addOnId: addon.id,
      addOnService: addon.addOnName
    }))
  );

  // ─── Patient Appointment History State ──────────────────────────────────────
  patientAppointmentHistory = signal<PatientAppointmentHistoryItem[]>([]);
  isLoadingHistory = signal<boolean>(false);
  selectedAppointment = signal<PatientAppointmentHistoryItem | null>(null);
  appointmentDetailModal = signal<PatientAppointmentHistoryItem | null>(null);
  isSubmitting = signal<boolean>(false);

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

    if (isPlatformBrowser(this.platformId)) {
      this.loadAddons();
    }
  }

  // ─── Add-on Services Fetch & Multiselect Handlers ──────────────────────────
  async loadAddons(): Promise<void> {
    this.isLoadingAddons.set(true);
    try {
      const res = await this.apiService.Get<ProviderAddon[]>(ApiEndPoints.GetAllAddOns);
      if (res?.isSuccess && Array.isArray(res.data)) {
        this.addons.set(res.data);
      } else {
        this.addons.set([]);
      }
    } catch (e) {
      console.error('Error loading add-ons', e);
      this.addons.set([]);
    } finally {
      this.isLoadingAddons.set(false);
    }
  }

  toggleAddonDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isAddonDropdownOpen.update(open => !open);
  }

  isAddOnSelected(addOnId: number): boolean {
    return this.selectedAddOns().some(a => a.id === addOnId);
  }

  toggleAddOn(addon: ProviderAddon): void {
    if (this.isAddOnSelected(addon.id)) {
      this.selectedAddOns.update(list => list.filter(a => a.id !== addon.id));
    } else {
      this.selectedAddOns.update(list => [...list, addon]);
    }
  }

  removeAddOn(addOnId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedAddOns.update(list => list.filter(a => a.id !== addOnId));
  }

  clearAddOns(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedAddOns.set([]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (
      this.isAddonDropdownOpen() &&
      !this.elementRef.nativeElement.querySelector('.addon-multiselect-wrap')?.contains(target)
    ) {
      this.isAddonDropdownOpen.set(false);
    }

    if (
      this.isSearchDropdownOpen() &&
      !this.elementRef.nativeElement.querySelector('.top-search-row')?.contains(target)
    ) {
      this.isSearchDropdownOpen.set(false);
    }
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
      notes: item.notes || undefined,
    };

    this.selectedPatientItem.set(item);
    this.selectPatient(patient);

    if (item.notes && !this.formData.appointmentNotes) {
      this.formData.appointmentNotes = item.notes;
    }

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

    try {
      const res = await this.apiService.Get<PatientAppointmentHistoryItem[]>(
        `${ApiEndPoints.PatientAppointmentDetails}?patientId=${patientId}`
      );

      if (res?.isSuccess && Array.isArray(res.data) && res.data.length > 0) {
        this.patientAppointmentHistory.set(res.data);
        const currentSelectedId = this.selectedAppointment()?.id;
        const stillExists = currentSelectedId ? res.data.find(a => a.id === currentSelectedId) : null;
        if (stillExists) {
          this.selectedAppointment.set(stillExists);
        } else {
          // Auto-select scheduled/in-progress appointment, or the first appointment
          const active = res.data.find(a => a.status === 'Scheduled' || a.status === 'In-Progress') || res.data[0];
          if (active) {
            this.selectedAppointment.set(active);
            if (active.notes && !this.formData.appointmentNotes) {
              this.formData.appointmentNotes = active.notes;
            }
          }
        }
      } else {
        this.patientAppointmentHistory.set([]);
        this.selectedAppointment.set(null);
      }
    } catch (e) {
      console.error('Appointment history error', e);
      this.patientAppointmentHistory.set([]);
      this.selectedAppointment.set(null);
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

  // ─── Select Appointment from History ───────────────────────────────────────
  selectAppointment(apt: PatientAppointmentHistoryItem): void {
    this.selectedAppointment.set(apt);
    if (apt.notes) {
      this.formData.appointmentNotes = apt.notes;
    }
    if (apt.appointmentDate) {
      this.formData.appointmentDate = apt.appointmentDate.split('T')[0];
    }
    if (apt.status && ['Scheduled', 'In-Progress', 'Completed'].includes(apt.status)) {
      this.formData.appointmentStatus = apt.status as 'Scheduled' | 'In-Progress' | 'Completed';
    }
  }

  viewAppointmentDetails(apt: PatientAppointmentHistoryItem, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectAppointment(apt);
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
    this.selectedAddOns.set([]);
    this.isAddonDropdownOpen.set(false);

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

  // ─── Complete Appointment API Call ─────────────────────────────────────────
  async onCompleteAppointment(): Promise<void> {
    const pt = this.selectedPatient();
    if (!pt) {
      this.alertService.error('Missing Information', 'Please search and select a patient first.');
      return;
    }

    const apt = this.selectedAppointment();
    if (!apt?.id) {
      this.alertService.error('No Appointment Selected', 'Please select an appointment from the appointment history on the right to complete.');
      return;
    }

    if (apt.status === 'Completed') {
      this.alertService.warning('Already Completed', 'This appointment has already been completed.');
      return;
    }

    const addOnList = this.selectedAddOnPayload();
    const payload: CompleteAppointmentRequest = {
      appointmentId: apt.id,
      clinicalNotes: this.formData.appointmentNotes?.trim() || null,
      addOn: addOnList.length > 0 ? addOnList : null
    };

    this.isSubmitting.set(true);
    try {
      const res = await this.apiService.Post<any>(ApiEndPoints.CompleteAppointment, payload);
      if (res?.isSuccess) {
        this.alertService.toastSuccess(res.message || 'Appointment completed successfully!');

        // Update local appointment status
        apt.status = 'Completed';
        this.formData.appointmentStatus = 'Completed';

        // Refresh appointment history for this patient
        const rawId = (pt.patientCode || pt.id).replace(/\D/g, '');
        const numericId = parseInt(rawId, 10);
        if (!isNaN(numericId) && numericId > 0) {
          await this.loadPatientAppointmentHistory(numericId);
        }

        // Emit updated appointment to parent
        const code = `BKG-${Date.now().toString().slice(-4)}`;
        const updatedAppointment: DoctorInquiryOrAppointment = {
          id: `APT-${apt.id}`,
          bookingCode: code,
          entryType: 'appointment',
          patientId: pt.patientCode || pt.id,
          patientCode: pt.patientCode || pt.id,
          patientName: pt.fullName,
          phone: this.formData.phone,
          email: this.formData.email,
          age: this.formData.age || 30,
          gender: this.formData.gender,
          date: this.formData.appointmentDate,
          timeSlot: this.formData.timeSlot,
          visitType: this.formData.visitType,
          conditionOrInterest: this.formData.condition || 'Physical Therapy Session',
          notes: this.formData.appointmentNotes,
          status: 'Completed',
          fee: this.formData.fee,
          ...(addOnList.length > 0 ? { addOn: addOnList } : {})
        };
        this.appointmentAdded.emit(updatedAppointment);

        // Reset add-on selection after completion
        this.selectedAddOns.set([]);
      } else {
        this.alertService.error('Error', res?.message || 'Failed to complete appointment.');
      }
    } catch (e: any) {
      console.error('CompleteAppointment error', e);
      this.alertService.error('Error', e?.message || 'An error occurred while completing the appointment.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Alias onSave to onCompleteAppointment for backward-compatibility with form submit
  onSave(): void {
    this.onCompleteAppointment();
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
