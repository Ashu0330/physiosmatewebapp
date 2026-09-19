import { Component, OnInit, inject, signal, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

// Service & Models
import { DoctorDashboardService } from '../../../services/doctor-dashboard.service';
import {
  DoctorPatient,
  DoctorTreatmentPlan,
  DoctorAppointment,
  DoctorStats,
  DoctorStatsFilter,
  NewPatientFormData,
  DoctorConsultationRecord,
  DoctorInquiryOrAppointment
} from '../../../models/doctor-dashboard.model';

// Child components
import { Addpatient } from '../addpatient/addpatient';
import { Patients } from '../patients/patients';
import { Treatmentplans } from '../treatmentplans/treatmentplans';
import { Consultations } from '../consultations/consultations';
import { DoctorAppointments } from '../appointments/doctor-appointments';
import { Sidebar } from '../../layout/sidebar/sidebar';

export type DoctorDashboardTab = 'dashboard' | 'add-patient' | 'patients' | 'treatment-plans' | 'Consultations' | 'Appointments';

@Component({
  selector: 'app-doctordashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    Addpatient,
    Patients,
    Treatmentplans,
    Consultations,
    DoctorAppointments],
  templateUrl: './doctordashboard.html',
  styleUrl: './doctordashboard.css',
})
export class Doctordashboard implements OnInit {
  private doctorService = inject(DoctorDashboardService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private elementRef = inject(ElementRef);

  activeTab: DoctorDashboardTab = 'dashboard';
  doctorName = 'Dr. Himanshu Suman';
  preSelectedPatientId = signal<string | null>(null);

  // ─── Central Clinical State ────────────────────────────────────────────────
  patients: DoctorPatient[] = [
    {
      id: 'PT-1041',
      patientCode: 'PT-1041',
      fullName: 'Ananya Iyer',
      age: 34,
      gender: 'Female',
      phone: '+91 98234 56789',
      email: 'ananya.iyer@example.com',
      primaryCondition: 'Lumbar Disc Herniation & Sciatica',
      status: 'Active',
      currentPlan: 'Spine Decompression & Core Stabilization',
      sessionsCompleted: 6,
      totalSessions: 12,
      lastVisit: '04 Sep 2026',
      nextAppointment: 'Today, 09:30 AM',
      emergencyContact: 'Rajesh Iyer (+91 98234 56780)',
      notes: 'Significant reduction in radiating leg pain. Continue neutral spine core activation.'
    },
    {
      id: 'PT-1042',
      patientCode: 'PT-1042',
      fullName: 'Vikramaditya Rao',
      age: 28,
      gender: 'Male',
      phone: '+91 98450 12345',
      email: 'vikram.rao@example.com',
      primaryCondition: 'Right Knee ACL Reconstruction (Post-Op Wk 8)',
      status: 'Active',
      currentPlan: 'Knee ACL Accelerated Rehab Protocol',
      sessionsCompleted: 10,
      totalSessions: 16,
      lastVisit: '03 Sep 2026',
      nextAppointment: 'Today, 11:15 AM',
      emergencyContact: 'Sneha Rao (+91 98450 12340)',
      notes: 'Full active extension achieved. Concentrating on eccentric quadriceps strength.'
    },
    {
      id: 'PT-1043',
      patientCode: 'PT-1043',
      fullName: 'Meera Nambiar',
      age: 52,
      gender: 'Female',
      phone: '+91 97112 34567',
      email: 'meera.nambiar@example.com',
      primaryCondition: 'Adhesive Capsulitis (Frozen Shoulder - Left)',
      status: 'Active',
      currentPlan: 'Glenohumeral Joint Mobilization & ROM',
      sessionsCompleted: 4,
      totalSessions: 10,
      lastVisit: '02 Sep 2026',
      nextAppointment: 'Today, 02:00 PM',
      emergencyContact: 'K. Nambiar (+91 97112 34560)',
      notes: 'Grade II mobilization tolerated well. Passive abduction improved by 15 degrees.'
    },
    {
      id: 'PT-1044',
      patientCode: 'PT-1044',
      fullName: 'Rohan Deshmukh',
      age: 41,
      gender: 'Male',
      phone: '+91 99201 87654',
      email: 'rohan.deshmukh@example.com',
      primaryCondition: 'Cervical Radiculopathy & Postural Kyphosis',
      status: 'Pending',
      currentPlan: 'Cervical Postural & Deep Neck Flexor Protocol',
      sessionsCompleted: 2,
      totalSessions: 8,
      lastVisit: '01 Sep 2026',
      nextAppointment: 'Today, 04:30 PM',
      emergencyContact: 'Pooja Deshmukh (+91 99201 87650)',
      notes: 'Ergonomic workstation review conducted. Scapular retractors prescribed.'
    },
    {
      id: 'PT-1045',
      patientCode: 'PT-1045',
      fullName: 'Siddharth Verma',
      age: 23,
      gender: 'Male',
      phone: '+91 96500 43210',
      email: 'siddharth.v@example.com',
      primaryCondition: 'Lateral Ankle Sprain (Grade II ATFL)',
      status: 'Completed',
      currentPlan: 'Ankle Stability & Tendinopathy Care',
      sessionsCompleted: 8,
      totalSessions: 8,
      lastVisit: '28 Aug 2026',
      emergencyContact: 'Sunil Verma (+91 96500 43219)',
      notes: 'Discharged with home balance board maintenance exercises. Full proprioception restored.'
    }
  ];

  treatmentPlans: DoctorTreatmentPlan[] = [
    {
      id: 'PLN-301',
      planCode: 'PLN-301',
      title: 'Spine Decompression & Core Stabilization Protocol',
      patientId: 'PT-1041',
      patientName: 'Ananya Iyer',
      diagnosis: 'L4-L5 Disc Protrusion with Left L5 Radicular Pain',
      totalSessions: 12,
      completedSessions: 6,
      frequency: '3x weekly',
      durationWeeks: 4,
      status: 'In Progress',
      statusType: 'in-progress',
      startDate: '18 Aug 2026',
      targetEndDate: '15 Sep 2026',
      progressPercent: 50,
      isExpanded: true,
      clinicalNotes: 'Avoid lumbar end-range flexion during acute morning hours. Progress to bird-dog & side-plank holds.',
      phases: [
        {
          phaseNumber: 1,
          phaseName: 'Pain De-sensitization & Gentle Mobilization',
          description: 'Passive prone press-ups, McKenzie extension progressions, neutral spine walking.',
          status: 'Completed',
          targetDuration: 'Weeks 1-2'
        },
        {
          phaseNumber: 2,
          phaseName: 'Deep Core Isometric Activation',
          description: 'Transverse abdominis co-contraction, pelvic tilts, and modified dead bugs.',
          status: 'Current',
          targetDuration: 'Weeks 3-4'
        },
        {
          phaseNumber: 3,
          phaseName: 'Functional Dynamic Loading & Return to Activity',
          description: 'Hip hinge patterning, goblet squats with neutral spine, multi-planar carries.',
          status: 'Upcoming',
          targetDuration: 'Weeks 5-6'
        }
      ]
    },
    {
      id: 'PLN-302',
      planCode: 'PLN-302',
      title: 'ACL Accelerated Rehabilitation (Post-Op Phase II)',
      patientId: 'PT-1042',
      patientName: 'Vikramaditya Rao',
      diagnosis: 'Right Knee Bone-Patellar-Tendon-Bone ACL Reconstruction',
      totalSessions: 16,
      completedSessions: 10,
      frequency: '3x weekly',
      durationWeeks: 6,
      status: 'In Progress',
      statusType: 'in-progress',
      startDate: '10 Jul 2026',
      targetEndDate: '20 Sep 2026',
      progressPercent: 62,
      isExpanded: false,
      clinicalNotes: 'Ensure symmetric terminal knee extension before adding heavy closed-kinetic chain load.',
      phases: [
        {
          phaseNumber: 1,
          phaseName: 'Full Extension & Swelling Control',
          description: 'Cryotherapy, passive extension hangs, patellar glides, quad sets.',
          status: 'Completed',
          targetDuration: 'Weeks 1-4'
        },
        {
          phaseNumber: 2,
          phaseName: 'Closed Kinetic Chain Loading & Proprioception',
          description: 'Leg press (0-60 deg), step-ups, single leg balance on Airex pad.',
          status: 'Current',
          targetDuration: 'Weeks 5-10'
        },
        {
          phaseNumber: 3,
          phaseName: 'Agility, Plyometrics & Sport-Specific Drills',
          description: 'Double to single leg landing drills, cutting mechanics, treadmill intervals.',
          status: 'Upcoming',
          targetDuration: 'Weeks 11-16'
        }
      ]
    },
    {
      id: 'PLN-303',
      planCode: 'PLN-303',
      title: 'Glenohumeral Joint Mobilization & Scapular Dyskinesis',
      patientId: 'PT-1043',
      patientName: 'Meera Nambiar',
      diagnosis: 'Stage 2 Left Adhesive Capsulitis with Subacromial Impingement',
      totalSessions: 10,
      completedSessions: 4,
      frequency: '2x weekly',
      durationWeeks: 5,
      status: 'In Progress',
      statusType: 'in-progress',
      startDate: '20 Aug 2026',
      targetEndDate: '25 Sep 2026',
      progressPercent: 40,
      isExpanded: false,
      clinicalNotes: 'Tolerate to mild discomfort only (NPRS < 4/10). Apply moist heat before joint capsule stretches.',
      phases: [
        {
          phaseNumber: 1,
          phaseName: 'Capsular Distraction & Passive ROM',
          description: 'Pendulum exercises, pulley elevation, posterior glide mobilizations.',
          status: 'Completed',
          targetDuration: 'Weeks 1-2'
        },
        {
          phaseNumber: 2,
          phaseName: 'Scapular Stabilizer Strengthening',
          description: 'Serratus punches, prone Ts and Ys, wall slides with resistance band.',
          status: 'Current',
          targetDuration: 'Weeks 3-4'
        }
      ]
    },
    {
      id: 'PLN-304',
      planCode: 'PLN-304',
      title: 'Cervical Postural & Deep Neck Flexor Protocol',
      patientId: 'PT-1044',
      patientName: 'Rohan Deshmukh',
      diagnosis: 'C5-C6 Cervical Spondylosis with Forward Head Posture',
      totalSessions: 8,
      completedSessions: 2,
      frequency: '2x weekly',
      durationWeeks: 4,
      status: 'Pending Approval',
      statusType: 'pending',
      startDate: '01 Sep 2026',
      targetEndDate: '30 Sep 2026',
      progressPercent: 25,
      isExpanded: false,
      clinicalNotes: 'Awaiting updated cervical spine lateral X-ray before commencing traction therapy.',
      phases: [
        {
          phaseNumber: 1,
          phaseName: 'Craniocervical Flexion Training',
          description: 'Biofeedback pressure stabilizer, chin tucks in supine position.',
          status: 'Current',
          targetDuration: 'Weeks 1-2'
        },
        {
          phaseNumber: 2,
          phaseName: 'Thoracic Extension & Ergonomic Integration',
          description: 'Foam roller thoracic mobilization, standing angel slides.',
          status: 'Upcoming',
          targetDuration: 'Weeks 3-4'
        }
      ]
    }
  ];

  todayAppointments: DoctorAppointment[] = [
    {
      id: 'APT-901',
      bookingCode: 'BKG-7721',
      patientId: 'PT-1041',
      patientName: 'Ananya Iyer',
      timeSlot: '09:30 AM - 10:15 AM',
      date: 'Today, 05 Sep 2026',
      visitType: 'In-Clinic',
      condition: 'Lumbar Disc Herniation',
      sessionNumber: 6,
      totalSessions: 12,
      status: 'Completed',
      phone: '+91 98234 56789'
    },
    {
      id: 'APT-902',
      bookingCode: 'BKG-7722',
      patientId: 'PT-1042',
      patientName: 'Vikramaditya Rao',
      timeSlot: '11:15 AM - 12:00 PM',
      date: 'Today, 05 Sep 2026',
      visitType: 'In-Clinic',
      condition: 'Right Knee ACL Post-Op',
      sessionNumber: 10,
      totalSessions: 16,
      status: 'In-Progress',
      phone: '+91 98450 12345'
    },
    {
      id: 'APT-903',
      bookingCode: 'BKG-7723',
      patientId: 'PT-1043',
      patientName: 'Meera Nambiar',
      timeSlot: '02:00 PM - 02:45 PM',
      date: 'Today, 05 Sep 2026',
      visitType: 'Video Call',
      condition: 'Frozen Shoulder (Adhesive Capsulitis)',
      sessionNumber: 4,
      totalSessions: 10,
      status: 'Scheduled',
      phone: '+91 97112 34567'
    },
    {
      id: 'APT-904',
      bookingCode: 'BKG-7724',
      patientId: 'PT-1044',
      patientName: 'Rohan Deshmukh',
      timeSlot: '04:30 PM - 05:15 PM',
      date: 'Today, 05 Sep 2026',
      visitType: 'In-Clinic',
      condition: 'Cervical Spondylosis',
      sessionNumber: 2,
      totalSessions: 8,
      status: 'Scheduled',
      phone: '+91 99201 87654'
    }
  ];

  // ─── Filter State & Dynamic KPI Statistics ──────────────────────────────
  selectedPeriod: DoctorStatsFilter = 'day';
  isPeriodDropdownOpen = false;

  periodFilters: { id: DoctorStatsFilter; label: string }[] = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'Month' },
    { id: 'lifetime', label: 'Lifetime' }
  ];

  statsByPeriod: Record<DoctorStatsFilter, DoctorStats> = {
    day: {
      totalAppointments: 1,
      completedAppointments: 1,
      pendingAppointments: 0,
      cancelledAppointments: 0,
      activePatients: 2,
      newPatients: 1,
      revenue: 350.00,
      pendingPayments: 0.00,
      pendingPaymentCount: 0,
      completionRate: 100.00,
      averageRating: 4.9,
      totalReviews: 12
    },
    week: {
      totalAppointments: 8,
      completedAppointments: 6,
      pendingAppointments: 2,
      cancelledAppointments: 0,
      activePatients: 5,
      newPatients: 3,
      revenue: 2800.00,
      pendingPayments: 450.00,
      pendingPaymentCount: 1,
      completionRate: 87.5,
      averageRating: 4.9,
      totalReviews: 24
    },
    month: {
      totalAppointments: 32,
      completedAppointments: 28,
      pendingAppointments: 3,
      cancelledAppointments: 1,
      activePatients: 14,
      newPatients: 8,
      revenue: 11200.00,
      pendingPayments: 850.00,
      pendingPaymentCount: 2,
      completionRate: 90.6,
      averageRating: 4.9,
      totalReviews: 48
    },
    lifetime: {
      totalAppointments: 142,
      completedAppointments: 131,
      pendingAppointments: 5,
      cancelledAppointments: 6,
      activePatients: 29,
      newPatients: 42,
      revenue: 54250.00,
      pendingPayments: 2400.00,
      pendingPaymentCount: 4,
      completionRate: 92.3,
      averageRating: 4.95,
      totalReviews: 96
    }
  };

  get stats(): DoctorStats {
    return this.statsByPeriod[this.selectedPeriod];
  }

  get selectedPeriodLabel(): string {
    return this.periodFilters.find(f => f.id === this.selectedPeriod)?.label ?? this.selectedPeriod;
  }

  setPeriodFilter(period: DoctorStatsFilter): void {
    this.selectedPeriod = period;
    this.fetchStats(period);
  }

  togglePeriodDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isPeriodDropdownOpen = !this.isPeriodDropdownOpen;
  }

  selectPeriodOption(period: DoctorStatsFilter, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.setPeriodFilter(period);
    this.isPeriodDropdownOpen = false;
  }

  closePeriodDropdown(): void {
    this.isPeriodDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isPeriodDropdownOpen) {
      const target = event.target as HTMLElement;
      if (target && !this.elementRef.nativeElement.querySelector('.cpd-wrap')?.contains(target)) {
        this.isPeriodDropdownOpen = false;
      }
    }
  }

  // ─── Lifecycle & Routing Synchronization ─────────────────────────────────
  ngOnInit(): void {
    this.resolveTabFromRoute();
    this.fetchData();
  }

  /** Map each URL path segment → the tab that should be active */
  private readonly pathToTab: Record<string, DoctorDashboardTab> = {
    '': 'dashboard',
    'dashboard': 'dashboard',
    'add-patient': 'add-patient',
    'patients': 'patients',
    'treatment-plans': 'treatment-plans',
    'consultations': 'Consultations',
    'Consultations': 'Consultations',
    'appointments': 'Appointments',
    'Appointments': 'Appointments',
  };

  /** Map each tab → the URL path segment */
  private readonly tabToPath: Record<DoctorDashboardTab, string> = {
    'dashboard': 'dashboard',
    'add-patient': 'add-patient',
    'patients': 'patients',
    'treatment-plans': 'treatment-plans',
    'Consultations': 'Consultations',
    'Appointments': 'Appointments',
  };

  resolveTabFromRoute(): void {
    this.route.url.subscribe(segments => {
      const lastSegment = segments[segments.length - 1]?.path || '';
      const matched = this.pathToTab[lastSegment];
      if (matched) {
        this.activeTab = matched;
      } else {
        this.activeTab = 'dashboard';
      }
    });
  }

  selectTab(tab: DoctorDashboardTab): void {
    this.activeTab = tab;
    const path = this.tabToPath[tab] || '';
    this.router.navigate(['/doctor-dashboard', path]);
    window.scrollTo(0, 0);
  }

  // ─── Data Fetching (Uses Pure API Service with graceful fallback) ──────────
  fetchData(): void {
    this.fetchStats(this.selectedPeriod);

    this.doctorService.GetPatients().subscribe({
      next: (res) => {
        if (res?.data && res.data.length > 0) {
          this.patients = res.data;
        }
      },
      error: () => {
        // Retains initial rich clinical data
      }
    });

    this.doctorService.GetTreatmentPlans().subscribe({
      next: (res) => {
        if (res?.data && res.data.length > 0) {
          this.treatmentPlans = res.data;
        }
      },
      error: () => {
        // Retains initial treatment plans
      }
    });

    this.doctorService.GetAppointments().subscribe({
      next: (res) => {
        if (res?.data && res.data.length > 0) {
          this.todayAppointments = res.data;
        }
      },
      error: () => {
        // Retains initial schedule
      }
    });
  }

  fetchStats(period: DoctorStatsFilter = this.selectedPeriod): void {
    this.doctorService.GetStats(period).subscribe({
      next: (res) => {
        if (res?.data) {
          const d = res.data;
          this.statsByPeriod[period] = {
            totalAppointments: d.TotalAppointments ?? d.totalAppointments ?? this.statsByPeriod[period].totalAppointments,
            completedAppointments: d.CompletedAppointments ?? d.completedAppointments ?? this.statsByPeriod[period].completedAppointments,
            pendingAppointments: d.PendingAppointments ?? d.pendingAppointments ?? this.statsByPeriod[period].pendingAppointments,
            cancelledAppointments: d.CancelledAppointments ?? d.cancelledAppointments ?? this.statsByPeriod[period].cancelledAppointments,
            activePatients: d.ActivePatients ?? d.activePatients ?? this.statsByPeriod[period].activePatients,
            newPatients: d.NewPatients ?? d.newPatients ?? this.statsByPeriod[period].newPatients,
            revenue: d.Revenue ?? d.revenue ?? this.statsByPeriod[period].revenue,
            pendingPayments: d.PendingPayments ?? d.pendingPayments ?? this.statsByPeriod[period].pendingPayments,
            pendingPaymentCount: d.PendingPaymentCount ?? d.pendingPaymentCount ?? this.statsByPeriod[period].pendingPaymentCount,
            completionRate: d.CompletionRate ?? d.completionRate ?? this.statsByPeriod[period].completionRate,
            averageRating: d.AverageRating ?? d.averageRating ?? this.statsByPeriod[period].averageRating,
            totalReviews: d.TotalReviews ?? d.totalReviews ?? this.statsByPeriod[period].totalReviews,
          };
        }
      },
      error: () => {
        // Falls back to localized period stats
      }
    });
  }

  // ─── Business Logic (Residing in Component as requested) ──────────────────
  onPatientAdded(formData: NewPatientFormData): void {
    const newIdNum = 1040 + this.patients.length + 1;
    const patientCode = `PT-${newIdNum}`;

    const phoneVal = formData.mobile || formData.phone || '';
    const condition = formData.primaryCondition || 'General Physiotherapy';

    const newPatient: DoctorPatient = {
      id: patientCode,
      patientCode: patientCode,
      fullName: formData.fullName,
      age: formData.age || 30,
      gender: formData.gender as 'Male' | 'Female' | 'Other',
      dob: formData.dob,
      phone: phoneVal,
      mobile: formData.mobile || phoneVal,
      email: formData.email || `${formData.fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      photoUrl: formData.photoPreview,
      userId: formData.userId || 1,
      roleId: formData.roleId || 3,
      primaryCondition: condition,
      status: 'Active',
      currentPlan: `${condition} Rehabilitation Plan`,
      sessionsCompleted: 0,
      totalSessions: 10,
      lastVisit: 'Just Registered',
      nextAppointment: 'Pending Schedule',
      emergencyContact: formData.emergencyContact,
      redFlags: formData.redFlags,
      relevantMedicalHistory: formData.relevantMedicalHistory,
      allergies: formData.allergies,
      existingConditions: formData.existingConditions,
      initialComplaint: formData.initialComplaint,
      initialNotes: formData.initialNotes,
      precautionNotes: formData.precautionNotes,
      notes: formData.initialComplaint ? `Initial Complaint: ${formData.initialComplaint}. ${formData.notes || ''}` : formData.notes
    };

    // Add to patient state
    this.patients = [newPatient, ...this.patients];

    // Create corresponding clinical treatment plan
    const newPlan: DoctorTreatmentPlan = {
      id: `PLN-${300 + this.treatmentPlans.length + 1}`,
      planCode: `PLN-${300 + this.treatmentPlans.length + 1}`,
      title: `${condition} Rehabilitation Plan`,
      patientId: patientCode,
      patientName: formData.fullName,
      diagnosis: condition,
      totalSessions: 10,
      completedSessions: 0,
      frequency: '3x weekly',
      durationWeeks: 4,
      status: 'In Progress',
      statusType: 'in-progress',
      startDate: '05 Sep 2026',
      targetEndDate: '03 Oct 2026',
      progressPercent: 0,
      isExpanded: true,
      clinicalNotes: formData.precautionNotes && formData.precautionNotes.length
        ? `Precautions: ${formData.precautionNotes.join('; ')}. ${formData.initialNotes || ''}`
        : (formData.initialNotes || 'Clinical baseline registered.'),
      phases: [
        {
          phaseNumber: 1,
          phaseName: 'Acute Relief & Symptom Reduction',
          description: 'Pain desensitization, gentle ROM exercises, modalities as needed.',
          status: 'Current',
          targetDuration: 'Weeks 1-2'
        },
        {
          phaseNumber: 2,
          phaseName: 'Strength & Stabilization',
          description: 'Targeted strengthening of stabilizing musculature and posture correction.',
          status: 'Upcoming',
          targetDuration: 'Weeks 3-4'
        }
      ]
    };

    this.treatmentPlans = [newPlan, ...this.treatmentPlans];

    // Fire API call via Pure Service
    this.doctorService.AddPatient(newPatient).subscribe({
      next: () => { },
      error: () => { }
    });

    // Navigate to patients directory tab to view the added patient
    this.selectTab('patients');
  }

  onStartConsultationWith(patient: DoctorPatient): void {
    // If patient is not yet in patients list, add them
    if (!this.patients.some(p => p.id === patient.id || p.patientCode === patient.patientCode)) {
      this.patients = [patient, ...this.patients];
      this.doctorService.AddPatient(patient).subscribe({
        next: () => { },
        error: () => { }
      });
    }

    // Pre-select patient in consultations tab
    this.preSelectedPatientId.set(patient.id);
    this.selectTab('Consultations');
  }

  onViewPatientProfile(patient: DoctorPatient): void {
    this.selectTab('patients');
  }

  updateAppointmentStatus(appointmentId: string, status: 'Scheduled' | 'In-Progress' | 'Completed'): void {
    const apt = this.todayAppointments.find(a => a.id === appointmentId);
    if (apt) {
      apt.status = status;
      if (status === 'Completed') {
        // Increment sessions completed for patient
        const pt = this.patients.find(p => p.id === apt.patientId || p.patientCode === apt.patientId);
        if (pt && pt.sessionsCompleted < pt.totalSessions) {
          pt.sessionsCompleted++;
          pt.lastVisit = 'Today';
        }
        // Update treatment plan progress
        const plan = this.treatmentPlans.find(p => p.patientId === apt.patientId);
        if (plan && plan.completedSessions < plan.totalSessions) {
          plan.completedSessions++;
          plan.progressPercent = Math.round((plan.completedSessions / plan.totalSessions) * 100);
        }
      }

      // API call via Pure Service
      this.doctorService.UpdateAppointmentStatus({ appointmentId, status }).subscribe({
        next: () => { },
        error: () => { }
      });
    }
  }

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  onConsultationAdded(consultation: DoctorConsultationRecord): void {
    const exists = this.patients.some(p => p.id === consultation.patientId || p.patientCode === consultation.patientCode);
    if (!exists && consultation.patientName) {
      const newPt: DoctorPatient = {
        id: consultation.patientCode,
        patientCode: consultation.patientCode,
        fullName: consultation.patientName,
        age: consultation.age || 30,
        gender: consultation.gender,
        phone: consultation.phone,
        email: consultation.email || '',
        primaryCondition: consultation.primaryCondition,
        status: 'Active',
        currentPlan: consultation.recommendedPlan || 'Custom Care Plan',
        sessionsCompleted: 1,
        totalSessions: 10,
        lastVisit: 'Today',
        notes: consultation.chiefComplaint
      };
      this.patients = [newPt, ...this.patients];
    }
  }

  onAppointmentAdded(item: DoctorInquiryOrAppointment): void {
    if (item.entryType === 'appointment') {
      const newApt: DoctorAppointment = {
        id: item.id,
        bookingCode: item.bookingCode,
        patientId: item.patientId || item.patientCode || 'PT-NEW',
        patientName: item.patientName,
        timeSlot: item.timeSlot || '09:30 AM - 10:15 AM',
        date: item.date,
        visitType: (item.visitType as any) || 'In-Clinic',
        condition: item.conditionOrInterest,
        sessionNumber: 1,
        totalSessions: 10,
        status: (item.status as any) || 'Scheduled',
        phone: item.phone
      };
      this.todayAppointments = [newApt, ...this.todayAppointments];
    }
  }
}
