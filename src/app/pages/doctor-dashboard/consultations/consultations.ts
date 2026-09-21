import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorPatient, DoctorConsultationRecord } from '../../../models/doctor-dashboard.model';
import { SweetAlertService } from '../../../services/sweet-alert.service';

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultations.html',
  styleUrl: './consultations.css',
})
export class Consultations implements OnInit, OnChanges {
  private alertService = inject(SweetAlertService);

  @Input() patients: DoctorPatient[] = [];
  @Input() preSelectedPatientId: string | null = null;
  @Output() consultationAdded = new EventEmitter<DoctorConsultationRecord>();
  @Output() viewPatientProfile = new EventEmitter<DoctorPatient>();

  // ─── Top Filter & Search State ──────────────────────────────────────────────
  patientSearchQuery = signal<string>('');
  selectedPatientId = signal<string | null>(null);
  selectedPatient = signal<DoctorPatient | null>(null);
  isSearchDropdownOpen = signal<boolean>(false);

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
  formData: {
    consultationType: 'Initial Assessment' | 'Follow-up Visit' | 'Second Opinion' | 'Pre-Rehab Review';
    visitMode: 'In-Clinic' | 'Video Call' | 'Home Visit';
    fee: number;
    paymentStatus: 'Paid' | 'Pending' | 'Waived';
    paymentMethod: 'Cash' | 'UPI / QR' | 'Card' | 'Insurance';

    chiefComplaint: string;
    symptomsNotes: string;
    provisionalDiagnosis: string;
    painSeverity: 'Mild' | 'Moderate' | 'Severe';
    bp: string;
    pulse: string;
    romNotes: string;

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
      symptomsNotes: '',
      provisionalDiagnosis: '',
      painSeverity: 'Moderate',
      bp: '120/80 mmHg',
      pulse: '74 bpm',
      romNotes: '',

      treatmentGiven: '',
      recommendedPlan: 'Spine Decompression & Core Stabilization',
      clinicalAdvice: 'Prescribe cryotherapy 15 mins post-session. Maintain neutral spinal alignment during lifting.',
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

  // ─── Filtered Patients for Top Search Bar ─────────────────────────────────
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

  // ─── Select Patient & Pre-fill Clinical Defaults ──────────────────────────
  selectPatient(patient: DoctorPatient): void {
    this.selectedPatient.set(patient);
    this.selectedPatientId.set(patient.id);
    this.isSearchDropdownOpen.set(false);
    this.patientSearchQuery.set('');

    // Pre-fill encounter defaults from patient's permanent clinical baseline
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
    this.selectedCondition.set('');
    this.selectedPrecautions.set([]);

    this.formData = {
      consultationType: 'Initial Assessment',
      visitMode: 'In-Clinic',
      fee: 500,
      paymentStatus: 'Paid',
      paymentMethod: 'UPI / QR',

      chiefComplaint: '',
      symptomsNotes: '',
      provisionalDiagnosis: '',
      painSeverity: 'Moderate',
      bp: '120/80 mmHg',
      pulse: '74 bpm',
      romNotes: '',

      treatmentGiven: '',
      recommendedPlan: 'Spine Decompression & Core Stabilization',
      clinicalAdvice: 'Prescribe cryotherapy 15 mins post-session. Maintain neutral spinal alignment during lifting.',
      nextFollowUpDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    };
  }

  setPainSeverity(severity: 'Mild' | 'Moderate' | 'Severe'): void {
    this.formData.painSeverity = severity;
  }

  // ─── Form Submission & Saving ──────────────────────────────────────────────
  onSaveConsultation(): void {
    const pt = this.selectedPatient();
    if (!pt) {
      this.alertService.error('No Patient Selected', 'Please select a patient from the top search bar before recording a consultation encounter.');
      return;
    }

    const newCode = `CNS-${500 + this.recentConsultations.length + 1}`;
    const now = new Date();
    const formattedDate = `Today, ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Snapshot patient permanent details alongside clinical encounter data
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
      symptomsNotes: this.formData.symptomsNotes || 'Clinical examination within expected functional parameters.',
      provisionalDiagnosis: this.formData.provisionalDiagnosis || pt.primaryCondition || 'Clinical assessment recorded',
      painSeverity: this.formData.painSeverity,
      bp: this.formData.bp,
      pulse: this.formData.pulse,
      romNotes: this.formData.romNotes,
      treatmentGiven: this.formData.treatmentGiven,
      recommendedPlan: this.formData.recommendedPlan,
      clinicalAdvice: this.formData.clinicalAdvice,
      nextFollowUpDate: this.formData.nextFollowUpDate
    };

    // Prepend to recent consultations ledger
    this.recentConsultations = [record, ...this.recentConsultations];
    this.consultationAdded.emit(record);

    this.alertService.toastSuccess(`Consultation ${newCode} recorded for ${record.patientName}!`);
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

  getInitials(name: string): string {
    if (!name) return 'PT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
}
