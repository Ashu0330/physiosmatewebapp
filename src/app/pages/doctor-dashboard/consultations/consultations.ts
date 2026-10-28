import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DoctorPatient,
  DoctorConsultationRecord,
  PatientSearchItem,
  PatientConsultancyBooking,
  FinalizeConsultancyRequest
} from '../../../models/doctor-dashboard.model';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { ApiService } from '../../../services/api.service';
import { ApiEndPoints } from '../../../helper/api-endpoints';

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultations.html',
  styleUrl: './consultations.css',
})
export class Consultations implements OnInit, OnChanges {
  private alertService = inject(SweetAlertService);
  private apiService = inject(ApiService);

  @Input() patients: DoctorPatient[] = [];
  @Input() preSelectedPatientId: string | null = null;
  @Output() consultationAdded = new EventEmitter<DoctorConsultationRecord>();
  @Output() viewPatientProfile = new EventEmitter<DoctorPatient>();

  // ─── Top Filter & Search State ──────────────────────────────────────────────
  patientSearchQuery = signal<string>('');
  selectedPatientId = signal<string | null>(null);
  selectedPatient = signal<DoctorPatient | null>(null);
  isSearchDropdownOpen = signal<boolean>(false);

  // ─── API-driven patient search ─────────────────────────────────────────────
  patientSearchResults = signal<PatientSearchItem[]>([]);
  isSearchingPatients = signal<boolean>(false);
  selectedPatientItem = signal<PatientSearchItem | null>(null);

  // ─── Patient Booking History ───────────────────────────────────────────────
  patientBookingHistory = signal<PatientConsultancyBooking[]>([]);
  isLoadingHistory = signal<boolean>(false);
  selectedBooking = signal<PatientConsultancyBooking | null>(null);

  // ─── Submission State ──────────────────────────────────────────────────────
  isSubmitting = signal<boolean>(false);

  // ─── Right Panel: Conditions (Clinical Quick Select) ──────────────────────
  conditionSearch = signal<string>('');
  conditionsList = signal<string[]>([
    'Low Back Pain',
    'Cervical Spondylosis',
    'ACL Post-Op',
    'Shoulder Impingement',
    'Frozen Shoulder',
    'Lumbar Disc Herniation',
    'Plantar Fasciitis',
    'Tennis Elbow (Lateral Epicondylitis)'
  ]);

  selectedCondition = signal<string>('');
  showAddCondition = false;
  newConditionInput = '';

  filteredConditions = computed(() => {
    const query = this.conditionSearch().toLowerCase().trim();
    if (!query) return this.conditionsList();
    return this.conditionsList().filter(c => c.toLowerCase().includes(query));
  });

  selectCondition(condition: string): void {
    this.selectedCondition.set(condition);
    this.formData.provisionalDiagnosis = condition;
    if (!this.formData.chiefComplaint) {
      this.formData.chiefComplaint = `Evaluation and rehabilitation for ${condition}.`;
    }
  }

  addCustomCondition(): void {
    const trimmed = this.newConditionInput.trim();
    if (trimmed) {
      if (!this.conditionsList().includes(trimmed)) {
        this.conditionsList.update(list => [trimmed, ...list]);
      }
      this.selectCondition(trimmed);
      this.newConditionInput = '';
      this.showAddCondition = false;
    }
  }

  removeSelectedCondition(): void {
    this.selectedCondition.set('');
    this.formData.provisionalDiagnosis = '';
  }

  // ─── Right Panel: Precaution Notes ────────────────────────────────────────
  precautionSearch = signal<string>('');
  precautionsList = signal<string[]>([
    'Avoid loaded deep squats',
    'No high-impact activity',
    'Avoid overhead loading',
    'Monitor pain > 6/10',
    'No end-range lumbar flexion',
    'Limit weight-bearing to 50%',
    'Avoid rapid rotational twisting'
  ]);

  selectedPrecautions = signal<string[]>([]);
  showAddPrecaution = false;
  newPrecautionInput = '';

  filteredPrecautions = computed(() => {
    const query = this.precautionSearch().toLowerCase().trim();
    if (!query) return this.precautionsList();
    return this.precautionsList().filter(p => p.toLowerCase().includes(query));
  });

  isPrecautionSelected(precaution: string): boolean {
    return this.selectedPrecautions().includes(precaution);
  }

  togglePrecaution(precaution: string): void {
    if (this.isPrecautionSelected(precaution)) {
      this.selectedPrecautions.update(list => list.filter(p => p !== precaution));
    } else {
      this.selectedPrecautions.update(list => [...list, precaution]);
    }
    this.syncPrecautionsToAdvice();
  }

  addCustomPrecaution(): void {
    const trimmed = this.newPrecautionInput.trim();
    if (trimmed) {
      if (!this.precautionsList().includes(trimmed)) {
        this.precautionsList.update(list => [trimmed, ...list]);
      }
      if (!this.isPrecautionSelected(trimmed)) {
        this.selectedPrecautions.update(list => [...list, trimmed]);
        this.syncPrecautionsToAdvice();
      }
      this.newPrecautionInput = '';
      this.showAddPrecaution = false;
    }
  }

  removeSelectedPrecaution(precaution: string): void {
    this.selectedPrecautions.update(list => list.filter(p => p !== precaution));
    this.syncPrecautionsToAdvice();
  }

  syncPrecautionsToAdvice(): void {
    const precautions = this.selectedPrecautions();
    if (precautions.length > 0) {
      const precStr = `Precautions: ${precautions.join('; ')}.`;
      const baseAdvice = 'Prescribe cryotherapy 15 mins post-session. Maintain neutral spinal alignment.';
      this.formData.clinicalAdvice = `${baseAdvice} ${precStr}`;
    }
  }

  // ─── Care Plan Presets ────────────────────────────────────────────────────
  planTemplates = [
    'Spine Decompression & Core Stabilization',
    'Knee ACL Accelerated Rehab Protocol',
    'Glenohumeral Joint Mobilization & ROM',
    'Cervical Postural & Deep Neck Flexor Protocol',
    'Ankle Stability & Tendinopathy Care',
    'Custom Physical Therapy Care Plan'
  ];

  // ─── Active Clinical Consultation Form State ──────────────────────────────
  // Field names match FinalizeConsultancyRequest API contract
  formData: {
    consultationType: 'Initial Assessment' | 'Follow-up Visit' | 'Second Opinion' | 'Pre-Rehab Review';
    visitMode: 'In-Clinic' | 'Video Call' | 'Home Visit';
    fee: number;
    paymentStatus: 'Paid' | 'Pending' | 'Waived';
    paymentMethod: 'Cash' | 'UPI / QR' | 'Card' | 'Insurance';

    chiefComplaint: string;
    clinicalFindings: string;        // API: clinicalFindings
    provisionalDiagnosis: string;
    painSeverity: 'Mild' | 'Moderate' | 'Severe';
    bloodPressure: string;           // API: bloodPressure
    pulse: string;
    investigation: string;           // API: investigation

    treatmentGiven: string;
    recommendedPlan: string;
    clinicalAdvice: string;
    nextFollowUpDate: string;
  } = {
      consultationType: 'Initial Assessment',
      visitMode: 'In-Clinic',
      fee: 500,
      paymentStatus: 'Paid',
      paymentMethod: 'UPI / QR',

      chiefComplaint: '',
      clinicalFindings: '',
      provisionalDiagnosis: '',
      painSeverity: 'Moderate',
      bloodPressure: '120/80 mmHg',
      pulse: '74 bpm',
      investigation: '',

      treatmentGiven: '',
      recommendedPlan: 'Spine Decompression & Core Stabilization',
      clinicalAdvice: '',
      nextFollowUpDate: ''
    };

  // ─── Recent Consultations Ledger ───────────────────────────────────────────
  recentConsultations: DoctorConsultationRecord[] = [
    {
      id: 'CNS-501',
      consultationCode: 'CNS-501',
      patientId: 'PT-1041',
      patientCode: 'PT-1041',
      patientName: 'Ananya Iyer',
      age: 34,
      gender: 'Female',
      phone: '+91 98234 56789',
      email: 'ananya.iyer@example.com',
      primaryCondition: 'Lumbar Disc Herniation',
      chiefComplaint: 'Radiating pain into left buttock and calf upon prolonged sitting.',
      date: 'Today, 05 Sep 2026',
      time: '09:30 AM',
      consultationType: 'Initial Assessment',
      visitMode: 'In-Clinic',
      fee: 500,
      paymentStatus: 'Paid',
      paymentMethod: 'UPI / QR',
      symptomsNotes: 'Positive straight leg raise (SLR) at 45 degrees on left side.',
      provisionalDiagnosis: 'L4-L5 Disc Protrusion with L5 Radiculopathy',
      painSeverity: 'Moderate',
      bp: '118/76 mmHg',
      pulse: '72 bpm',
      romNotes: 'Lumbar flexion restricted to 40%. Extension symptom-relieving.',
      treatmentGiven: 'Manual lumbar traction, IFT (15 mins), deep core transverse abdominis activation drills.',
      recommendedPlan: 'Spine Decompression & Core Stabilization',
      clinicalAdvice: 'Prescribed McKenzie extension press-ups 3x daily. Ergonomic seat cushion recommended.',
      nextFollowUpDate: '12 Sep 2026'
    },
    {
      id: 'CNS-502',
      consultationCode: 'CNS-502',
      patientId: 'PT-1042',
      patientCode: 'PT-1042',
      patientName: 'Vikramaditya Rao',
      age: 28,
      gender: 'Male',
      phone: '+91 98450 12345',
      email: 'vikram.rao@example.com',
      primaryCondition: 'Right Knee ACL Reconstruction',
      chiefComplaint: 'Mild anterior knee stiffness during terminal extension.',
      date: 'Today, 05 Sep 2026',
      time: '11:15 AM',
      consultationType: 'Follow-up Visit',
      visitMode: 'In-Clinic',
      fee: 500,
      paymentStatus: 'Paid',
      paymentMethod: 'Card',
      symptomsNotes: 'Minimal intra-articular effusion. Stable anterior drawer test.',
      provisionalDiagnosis: 'Post-Op ACL Reconstruction Week 8 Progression',
      painSeverity: 'Mild',
      bp: '124/82 mmHg',
      pulse: '68 bpm',
      romNotes: 'Full active extension (0 deg). Flexion at 125 degrees.',
      treatmentGiven: 'Patellar mobilizations Grade III, closed kinetic chain mini-squats, Hamstring eccentric loading.',
      recommendedPlan: 'Knee ACL Accelerated Rehab Protocol',
      clinicalAdvice: 'Initiate closed-kinetic chain squats and single-leg balance drills.',
      nextFollowUpDate: '15 Sep 2026'
    },
    {
      id: 'CNS-503',
      consultationCode: 'CNS-503',
      patientId: 'PT-1043',
      patientCode: 'PT-1043',
      patientName: 'Meera Nambiar',
      age: 52,
      gender: 'Female',
      phone: '+91 97112 34567',
      email: 'meera.nambiar@example.com',
      primaryCondition: 'Adhesive Capsulitis (Left)',
      chiefComplaint: 'Inability to fasten dress or reach overhead cupboards.',
      date: '03 Sep 2026',
      time: '02:00 PM',
      consultationType: 'Follow-up Visit',
      visitMode: 'Video Call',
      fee: 500,
      paymentStatus: 'Pending',
      paymentMethod: 'UPI / QR',
      symptomsNotes: 'Severe night aching and capsular pattern tightness.',
      provisionalDiagnosis: 'Stage 2 Adhesive Capsulitis (Freezing Phase)',
      painSeverity: 'Severe',
      bp: '130/84 mmHg',
      pulse: '78 bpm',
      romNotes: 'Abduction 85 deg, External Rotation 20 deg.',
      treatmentGiven: 'Tele-rehab guided pendular Codman exercises, wand-assisted elevation within pain-free arc.',
      recommendedPlan: 'Glenohumeral Joint Mobilization & ROM',
      clinicalAdvice: 'Pulleys and wand exercises within pain-free arc. Hot fermentation before exercises.',
      nextFollowUpDate: '10 Sep 2026'
    }
  ];

  // ─── Slip Printing & Modal State ──────────────────────────────────────────
  selectedConsultationForSlip: DoctorConsultationRecord | null = null;
  showSlipModal = false;

  ngOnInit(): void {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    this.formData.nextFollowUpDate = nextWeek.toISOString().split('T')[0];

    if (this.preSelectedPatientId) {
      const match = this.patients.find(p => p.id === this.preSelectedPatientId || p.patientCode === this.preSelectedPatientId);
      if (match) {
        this.selectPatient(match);
        return;
      }
    }

    if (this.patients.length > 0) {
      this.selectPatient(this.patients[0]);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preSelectedPatientId'] && this.preSelectedPatientId) {
      const match = this.patients.find(p => p.id === this.preSelectedPatientId || p.patientCode === this.preSelectedPatientId);
      if (match) {
        this.selectPatient(match);
      }
    }
  }

  // ─── Filtered Patients for Top Search Bar (local fallback) ─────────────────
  filteredPatients = computed(() => {
    const query = this.patientSearchQuery().toLowerCase().trim();
    if (!query) return this.patients;

    return this.patients.filter(p =>
      p.fullName.toLowerCase().includes(query) ||
      (p.mobile && p.mobile.toLowerCase().includes(query)) ||
      (p.phone && p.phone.toLowerCase().includes(query)) ||
      p.patientCode.toLowerCase().includes(query) ||
      (p.city && p.city.toLowerCase().includes(query)) ||
      (p.primaryCondition && p.primaryCondition.toLowerCase().includes(query))
    );
  });

  async onPatientSearchChange(query: string): Promise<void> {
    this.patientSearchQuery.set(query);
    this.isSearchDropdownOpen.set(true);

    if (!query.trim()) {
      this.patientSearchResults.set([]);
      return;
    }

    this.isSearchingPatients.set(true);
    try {
      const res = await this.apiService.Post<any>(ApiEndPoints.TodayConsultancyPatient, { search: query.trim() });
      if (res?.isSuccess && res.data?.length > 0) {
        this.patientSearchResults.set(res.data as PatientSearchItem[]);
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

  async selectPatientFromSearch(item: PatientSearchItem): Promise<void> {
    const ptCode = `PT-${item.patientId}`;
    const patient: DoctorPatient = {
      id: ptCode,
      patientCode: ptCode,
      fullName: item.fullName,
      age: item.age,
      gender: item.gender,
      phone: item.mobile,
      mobile: item.mobile,
      email: item.email,
      address: item.address,
      city: item.city,
      state: item.state,
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

    // Load booking history
    await this.loadPatientBookingHistory(item.patientId);
  }

  async loadPatientBookingHistory(patientId: number): Promise<void> {
    this.isLoadingHistory.set(true);
    this.patientBookingHistory.set([]);
    this.selectedBooking.set(null);

    try {
      const res = await this.apiService.Get<PatientConsultancyBooking[]>(
        `${ApiEndPoints.PatientConsultancyBookingDetails}?patientId=${patientId}`
      );

      if (res?.isSuccess && Array.isArray(res.data) && res.data.length > 0) {
        this.patientBookingHistory.set(res.data);
      }
    } catch (e) {
      console.error('Booking history error', e);
    } finally {
      this.isLoadingHistory.set(false);
    }
  }

  // ─── Pre-fill Form from Booking History ───────────────────────────────────
  preFillFromBooking(booking: PatientConsultancyBooking): void {
    if (booking.chiefComplaint) this.formData.chiefComplaint = booking.chiefComplaint;
    if (booking.clinicalFindings) this.formData.clinicalFindings = booking.clinicalFindings;
    if (booking.provisionalDiagnosis) {
      this.formData.provisionalDiagnosis = booking.provisionalDiagnosis;
      this.selectedCondition.set(booking.provisionalDiagnosis);
    }
    if (booking.painSeverity) {
      const sev = booking.painSeverity as 'Mild' | 'Moderate' | 'Severe';
      if (['Mild', 'Moderate', 'Severe'].includes(sev)) {
        this.formData.painSeverity = sev;
      }
    }
    if (booking.bloodPressure) this.formData.bloodPressure = booking.bloodPressure;
    if (booking.pulse) this.formData.pulse = booking.pulse;
    if (booking.treatmentGiven) this.formData.treatmentGiven = booking.treatmentGiven;
    if (booking.clinicalAdvice) this.formData.clinicalAdvice = booking.clinicalAdvice;
    if (booking.investigation) this.formData.investigation = booking.investigation;
    if (booking.amount) this.formData.fee = booking.amount;
    if (booking.visitType) {
      const mode = booking.visitType as 'In-Clinic' | 'Video Call' | 'Home Visit';
      if (['In-Clinic', 'Video Call', 'Home Visit'].includes(mode)) {
        this.formData.visitMode = mode;
      }
    }
  }

  // ─── Select Booking from History — show detail modal ─────────────────────
  bookingDetailModal = signal<PatientConsultancyBooking | null>(null);

  selectBooking(booking: PatientConsultancyBooking): void {
    this.selectedBooking.set(booking);
    this.bookingDetailModal.set(booking);
  }

  closeBookingModal(): void {
    this.bookingDetailModal.set(null);
  }

  selectPatient(patient: DoctorPatient): void {
    this.selectedPatient.set(patient);
    this.selectedPatientId.set(patient.id);
    this.isSearchDropdownOpen.set(false);
    this.patientSearchQuery.set('');
    this.patientSearchResults.set([]);

    this.formData.chiefComplaint = patient.initialComplaint || (patient.notes ? patient.notes : `${patient.primaryCondition || 'General'} clinical evaluation`);
    this.formData.provisionalDiagnosis = patient.primaryCondition || '';
    this.formData.treatmentGiven = '';
    this.formData.fee = 500;

    if (patient.primaryCondition) {
      this.selectedCondition.set(patient.primaryCondition);
    } else {
      this.selectedCondition.set('');
    }

    if (patient.currentPlan) {
      this.formData.recommendedPlan = patient.currentPlan;
    }
  }

  // ─── Clear Consultation Selection ─────────────────────────────────────────
  clearConsultation(): void {
    this.selectedPatient.set(null);
    this.selectedPatientId.set(null);
    this.selectedPatientItem.set(null);
    this.selectedCondition.set('');
    this.selectedPrecautions.set([]);
    this.patientBookingHistory.set([]);
    this.selectedBooking.set(null);
    this.patientSearchResults.set([]);

    this.formData = {
      consultationType: 'Initial Assessment',
      visitMode: 'In-Clinic',
      fee: 500,
      paymentStatus: 'Paid',
      paymentMethod: 'UPI / QR',

      chiefComplaint: '',
      clinicalFindings: '',
      provisionalDiagnosis: '',
      painSeverity: 'Moderate',
      bloodPressure: '120/80 mmHg',
      pulse: '74 bpm',
      investigation: '',

      treatmentGiven: '',
      recommendedPlan: 'Spine Decompression & Core Stabilization',
      clinicalAdvice: 'Prescribe cryotherapy 15 mins post-session. Maintain neutral spinal alignment during lifting.',
      nextFollowUpDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    };
  }

  setPainSeverity(severity: 'Mild' | 'Moderate' | 'Severe'): void {
    this.formData.painSeverity = severity;
  }

  // ─── Form Submission → FinalizeConsultancy API ─────────────────────────────
  async onSaveConsultation(): Promise<void> {
    const pt = this.selectedPatient();
    if (!pt) {
      this.alertService.error('No Patient Selected', 'Please select a patient from the top search bar before recording a consultation encounter.');
      return;
    }

    if (!this.formData.chiefComplaint?.trim()) {
      this.alertService.toastError('Chief Complaint is required.');
      return;
    }

    this.isSubmitting.set(true);

    const booking = this.selectedBooking();
    const ptItem = this.selectedPatientItem();

    const payload: FinalizeConsultancyRequest = {
      ...(booking?.consultancyBookingId ? { consultancyBookingId: booking.consultancyBookingId } : {}),
      ...(ptItem?.patientId ? { patientId: ptItem.patientId } : {}),
      chiefComplaint: this.formData.chiefComplaint,
      clinicalFindings: this.formData.clinicalFindings,
      provisionalDiagnosis: this.formData.provisionalDiagnosis,
      painSeverity: this.formData.painSeverity,
      bloodPressure: this.formData.bloodPressure,
      pulse: this.formData.pulse,
      treatmentGiven: this.formData.treatmentGiven,
      clinicalAdvice: this.formData.clinicalAdvice,
      investigation: this.formData.investigation,
    };

    try {
      const res = await this.apiService.Post<any>(ApiEndPoints.FinalizeConsultancy, payload);

      if (res?.isSuccess) {
        // Build local record for the ledger
        const newCode = `CNS-${500 + this.recentConsultations.length + 1}`;
        const now = new Date();
        const formattedDate = `Today, ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const record: DoctorConsultationRecord = {
          id: newCode,
          consultationCode: newCode,
          patientId: pt.id,
          patientCode: pt.patientCode,
          patientName: pt.fullName,
          age: pt.age,
          gender: (pt.gender as 'Male' | 'Female' | 'Other') || 'Male',
          phone: pt.mobile || pt.phone || '',
          email: pt.email,
          primaryCondition: this.formData.provisionalDiagnosis || pt.primaryCondition || 'General Musculoskeletal Care',
          chiefComplaint: this.formData.chiefComplaint || `${pt.fullName} clinical evaluation`,
          date: formattedDate,
          time: formattedTime,
          consultationType: this.formData.consultationType,
          visitMode: this.formData.visitMode,
          fee: this.formData.fee,
          paymentStatus: this.formData.paymentStatus,
          paymentMethod: this.formData.paymentMethod,
          symptomsNotes: this.formData.clinicalFindings || 'Clinical examination within expected functional parameters.',
          provisionalDiagnosis: this.formData.provisionalDiagnosis || pt.primaryCondition || 'Clinical assessment recorded',
          painSeverity: this.formData.painSeverity,
          bp: this.formData.bloodPressure,
          pulse: this.formData.pulse,
          romNotes: this.formData.investigation,
          treatmentGiven: this.formData.treatmentGiven,
          recommendedPlan: this.formData.recommendedPlan,
          clinicalAdvice: this.formData.clinicalAdvice,
          nextFollowUpDate: this.formData.nextFollowUpDate
        };

        this.recentConsultations = [record, ...this.recentConsultations];
        this.consultationAdded.emit(record);
        this.alertService.toastSuccess(res.message || `Consultation ${newCode} recorded for ${record.patientName}!`);
      } else {
        this.alertService.toastError(res?.message || 'Failed to finalize consultation.');
      }
    } catch (e: any) {
      console.error('FinalizeConsultancy error', e);
      this.alertService.toastError('Error saving consultation. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // ─── View Patient Profile Output ──────────────────────────────────────────
  onViewPatientProfile(): void {
    const pt = this.selectedPatient();
    if (pt) {
      this.viewPatientProfile.emit(pt);
    }
  }

  // ─── Slip View & Print Action ──────────────────────────────────────────────
  viewSlip(consultation: DoctorConsultationRecord): void {
    this.selectedConsultationForSlip = consultation;
    this.showSlipModal = true;
  }

  closeSlipModal(): void {
    this.showSlipModal = false;
    this.selectedConsultationForSlip = null;
  }

  printCurrentSlip(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  // ─── Format booking date for history display ───────────────────────────────
  formatBookingDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
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
