import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DoctorPatient, DoctorTreatmentPlan } from '../../../models/doctor-dashboard.model';
import { SweetAlertService } from '../../../services/sweet-alert.service';

export interface TimeSlot {
  id: string;
  time: string;
  capacity: number;
  booked: number;
  isAvailable: boolean;
}

export interface ScheduledBooking {
  id: string;
  bookingCode: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  phone: string;
  date: string;
  timeSlot: string;
  treatmentName: string;
  therapist: string;
  fee: number;
  advancePaid: number;
  balanceDue: number;
  paymentStatus: 'Paid' | 'Advance' | 'Due';
  paymentMode: 'UPI' | 'Cash' | 'Card' | 'NetBanking';
  planId?: string;
  planName?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface WeeklyDraftSession {
  id: string;
  date: string;
  timeSlot: string;
  therapist: string;
}

@Component({
  selector: 'app-schedule-treatment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './schedule-treatment.html',
  styleUrl: './schedule-treatment.css',
})
export class ScheduleTreatment implements OnInit {
  private alertService = inject(SweetAlertService);
  private route = inject(ActivatedRoute);

  // ─── Active Tab ────────────────────────────────────────────────────────────
  activeTab = signal<'daily' | 'weekly' | 'assign-plan' | 'list'>('daily');

  // ─── Patient Search & Directory ────────────────────────────────────────────
  patientSearchQuery = signal<string>('');
  selectedPatientId = signal<string | null>(null);
  selectedPatient = signal<DoctorPatient | null>(null);
  isSearchDropdownOpen = signal<boolean>(false);

  // ─── Daily Treatment Form ──────────────────────────────────────────────────
  treatmentName = signal<string>('Physiotherapy Session');
  treatmentDate = signal<string>(this.getTodayDateString());
  selectedSlot = signal<TimeSlot | null>(null);
  attendingTherapist = signal<string>('Dr. Himanshu Suman (PT)');
  treatmentFee = signal<number>(600);
  paymentType = signal<'advance' | 'due'>('advance');
  advanceAmount = signal<number>(600);
  paymentMode = signal<'UPI' | 'Cash' | 'Card' | 'NetBanking'>('UPI');
  paymentRef = signal<string>('');
  clinicalNotes = signal<string>('');

  therapists: string[] = [
    'Dr. Himanshu Suman (PT)',
    'Dr. Priya Sharma (PT)',
    'Dr. Rajesh Nair (PT)'
  ];

  // ─── Weekly Plan Scheduler (Accordion) ─────────────────────────────────────
  expandedPlanId = signal<string | null>(null);
  weeklyDraftSessions = signal<WeeklyDraftSession[]>([]);

  // ─── Assign Plan Form ──────────────────────────────────────────────────────
  newPlanTitle = signal<string>('Lumbar Spine Protocol');
  newPlanSessions = signal<number>(10);
  newPlanWeeks = signal<number>(4);
  newPlanPrice = signal<number>(4500);
  newPlanPaymentType = signal<'full' | 'advance' | 'due'>('full');
  newPlanAdvance = signal<number>(4500);
  newPlanPaymentMode = signal<'UPI' | 'Cash' | 'Card' | 'NetBanking'>('UPI');

  // ─── Patients Data ─────────────────────────────────────────────────────────
  patients = signal<DoctorPatient[]>([
    {
      id: 'PT-1041',
      patientCode: 'PT-1041',
      fullName: 'Ananya Iyer',
      age: 34,
      gender: 'Female',
      phone: '+91 98234 56789',
      mobile: '+91 98234 56789',
      email: 'ananya.iyer@example.com',
      city: 'Delhi NCR',
      primaryCondition: 'Lumbar Disc Herniation & Sciatica',
      status: 'Active',
      currentPlan: 'Spine Decompression & Core Stabilization',
      sessionsCompleted: 6,
      totalSessions: 12,
      lastVisit: '24 Oct 2026'
    },
    {
      id: 'PT-1042',
      patientCode: 'PT-1042',
      fullName: 'Vikramaditya Rao',
      age: 28,
      gender: 'Male',
      phone: '+91 98450 12345',
      mobile: '+91 98450 12345',
      email: 'vikram.rao@example.com',
      city: 'Gurugram',
      primaryCondition: 'Right Knee ACL Reconstruction',
      status: 'Active',
      currentPlan: 'Knee ACL Accelerated Rehab Protocol',
      sessionsCompleted: 10,
      totalSessions: 16,
      lastVisit: '23 Oct 2026'
    },
    {
      id: 'PT-1043',
      patientCode: 'PT-1043',
      fullName: 'Meera Nambiar',
      age: 52,
      gender: 'Female',
      phone: '+91 97112 34567',
      mobile: '+91 97112 34567',
      email: 'meera.nambiar@example.com',
      city: 'Noida',
      primaryCondition: 'Frozen Shoulder - Left',
      status: 'Active',
      currentPlan: 'Glenohumeral Joint Mobilization & ROM',
      sessionsCompleted: 4,
      totalSessions: 10,
      lastVisit: '22 Oct 2026'
    },
    {
      id: 'PT-1044',
      patientCode: 'PT-1044',
      fullName: 'Rohan Deshmukh',
      age: 41,
      gender: 'Male',
      phone: '+91 99201 87654',
      mobile: '+91 99201 87654',
      email: 'rohan.deshmukh@example.com',
      city: 'South Delhi',
      primaryCondition: 'Cervical Radiculopathy',
      status: 'Active',
      sessionsCompleted: 0,
      totalSessions: 0,
      lastVisit: '20 Oct 2026'
    },
    {
      id: 'PT-1045',
      patientCode: 'PT-1045',
      fullName: 'Siddharth Verma',
      age: 23,
      gender: 'Male',
      phone: '+91 96500 43210',
      mobile: '+91 96500 43210',
      email: 'siddharth.v@example.com',
      city: 'Faridabad',
      primaryCondition: 'Lateral Ankle Sprain',
      status: 'Completed',
      sessionsCompleted: 8,
      totalSessions: 8,
      lastVisit: '15 Oct 2026'
    }
  ]);

  // ─── Treatment Plans Data ──────────────────────────────────────────────────
  treatmentPlans = signal<DoctorTreatmentPlan[]>([
    {
      id: 'PLN-301',
      planCode: 'PLN-301',
      title: 'Spine Decompression & Core Stabilization Protocol',
      patientId: 'PT-1041',
      patientName: 'Ananya Iyer',
      diagnosis: 'L4-L5 Disc Protrusion',
      totalSessions: 12,
      completedSessions: 6,
      frequency: '3x weekly',
      durationWeeks: 4,
      status: 'In Progress',
      statusType: 'in-progress',
      startDate: '01 Oct 2026',
      targetEndDate: '30 Oct 2026',
      progressPercent: 50,
      clinicalNotes: 'Neutral spine core activation.',
      phases: []
    },
    {
      id: 'PLN-302',
      planCode: 'PLN-302',
      title: 'Knee ACL Accelerated Rehab Protocol',
      patientId: 'PT-1042',
      patientName: 'Vikramaditya Rao',
      diagnosis: 'Post-Op Knee ACL',
      totalSessions: 16,
      completedSessions: 10,
      frequency: '3x weekly',
      durationWeeks: 6,
      status: 'In Progress',
      statusType: 'in-progress',
      startDate: '20 Sep 2026',
      targetEndDate: '05 Nov 2026',
      progressPercent: 63,
      clinicalNotes: 'Quadriceps strength training.',
      phases: []
    },
    {
      id: 'PLN-303',
      planCode: 'PLN-303',
      title: 'Glenohumeral Joint Mobilization & ROM',
      patientId: 'PT-1043',
      patientName: 'Meera Nambiar',
      diagnosis: 'Frozen Shoulder',
      totalSessions: 10,
      completedSessions: 4,
      frequency: '2x weekly',
      durationWeeks: 5,
      status: 'In Progress',
      statusType: 'in-progress',
      startDate: '05 Oct 2026',
      targetEndDate: '10 Nov 2026',
      progressPercent: 40,
      clinicalNotes: 'Passive stretch & glides.',
      phases: []
    }
  ]);

  // ─── Scheduled Bookings Ledger ─────────────────────────────────────────────
  scheduledBookings = signal<ScheduledBooking[]>([]);

  // ─── Computed Properties ───────────────────────────────────────────────────

  filteredPatients = computed(() => {
    const q = this.patientSearchQuery().toLowerCase().trim();
    if (!q) return this.patients();
    return this.patients().filter(p =>
      p.fullName.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q)) ||
      p.patientCode.toLowerCase().includes(q)
    );
  });

  patientActivePlan = computed<DoctorTreatmentPlan | null>(() => {
    const p = this.selectedPatient();
    if (!p) return null;
    return this.treatmentPlans().find(plan => plan.patientId === p.id && plan.status === 'In Progress') || null;
  });

  patientAllPlans = computed<DoctorTreatmentPlan[]>(() => {
    const p = this.selectedPatient();
    if (!p) return [];
    return this.treatmentPlans().filter(plan => plan.patientId === p.id);
  });

  remainingSessions = computed<number>(() => {
    const plan = this.patientActivePlan();
    if (!plan) return 0;
    return Math.max(0, plan.totalSessions - plan.completedSessions);
  });

  balanceDue = computed<number>(() => {
    if (this.paymentType() === 'due') return this.treatmentFee();
    return Math.max(0, this.treatmentFee() - this.advanceAmount());
  });

  assignBalanceDue = computed<number>(() => {
    if (this.newPlanPaymentType() === 'due') return this.newPlanPrice();
    if (this.newPlanPaymentType() === 'full') return 0;
    return Math.max(0, this.newPlanPrice() - this.newPlanAdvance());
  });

  // Time Slots with Capacity Status
  availableSlots = computed<TimeSlot[]>(() => {
    const date = this.treatmentDate();
    const existing = this.scheduledBookings().filter(b => b.date === date && b.status !== 'Cancelled');

    const baseSlots = [
      { id: '1', time: '09:00 AM - 09:45 AM', capacity: 4, initialBooked: 2 },
      { id: '2', time: '10:00 AM - 10:45 AM', capacity: 4, initialBooked: 3 },
      { id: '3', time: '11:00 AM - 11:45 AM', capacity: 4, initialBooked: 4 }, // Full
      { id: '4', time: '12:00 PM - 12:45 PM', capacity: 4, initialBooked: 1 },
      { id: '5', time: '02:00 PM - 02:45 PM', capacity: 4, initialBooked: 2 },
      { id: '6', time: '03:00 PM - 03:45 PM', capacity: 4, initialBooked: 0 },
      { id: '7', time: '04:00 PM - 04:45 PM', capacity: 4, initialBooked: 3 },
      { id: '8', time: '05:00 PM - 05:45 PM', capacity: 4, initialBooked: 1 },
      { id: '9', time: '06:00 PM - 06:45 PM', capacity: 4, initialBooked: 4 }, // Full
      { id: '10', time: '07:00 PM - 07:45 PM', capacity: 4, initialBooked: 2 },
    ];

    return baseSlots.map(s => {
      const dynamicCount = existing.filter(b => b.timeSlot === s.time).length;
      const booked = Math.min(s.capacity, s.initialBooked + dynamicCount);
      const isAvailable = booked < s.capacity;
      return {
        id: s.id,
        time: s.time,
        capacity: s.capacity,
        booked,
        isAvailable
      };
    });
  });

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadStorage();

    const qp = this.route.snapshot.queryParams;
    if (qp['patientId']) {
      const pt = this.patients().find(p => p.id === qp['patientId'] || p.patientCode === qp['patientId']);
      if (pt) this.selectPatient(pt);
    } else if (this.patients().length > 0) {
      this.selectPatient(this.patients()[0]);
    }

    const first = this.availableSlots().find(s => s.isAvailable);
    if (first) this.selectedSlot.set(first);
  }

  // ─── Patient Selection ─────────────────────────────────────────────────────

  selectPatient(pt: DoctorPatient): void {
    this.selectedPatientId.set(pt.id);
    this.selectedPatient.set(pt);
    this.patientSearchQuery.set(pt.fullName);
    this.isSearchDropdownOpen.set(false);

    // Expand plan if exists
    const plan = this.patientActivePlan();
    if (plan) {
      this.expandedPlanId.set(plan.id);
      this.initWeeklyDraft();
    }
  }

  clearSearch(): void {
    this.patientSearchQuery.set('');
    this.selectedPatientId.set(null);
    this.selectedPatient.set(null);
    this.isSearchDropdownOpen.set(true);
  }

  getInitials(name: string): string {
    if (!name) return 'PT';
    return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  }

  // ─── Daily Treatment Methods ───────────────────────────────────────────────

  setPaymentType(type: 'advance' | 'due'): void {
    this.paymentType.set(type);
    if (type === 'due') {
      this.advanceAmount.set(0);
    } else {
      this.advanceAmount.set(this.treatmentFee());
    }
  }

  onFeeChange(): void {
    if (this.paymentType() === 'advance') {
      this.advanceAmount.set(this.treatmentFee());
    }
  }

  selectSlot(slot: TimeSlot): void {
    if (!slot.isAvailable) return;
    this.selectedSlot.set(slot);
  }

  submitDailyTreatment(): void {
    const pt = this.selectedPatient();
    if (!pt) {
      this.alertService.toastError('Please select a patient.');
      return;
    }

    const slot = this.selectedSlot();
    if (!slot || !slot.isAvailable) {
      this.alertService.toastError('Please select an available time slot.');
      return;
    }

    const fee = this.treatmentFee();
    const adv = this.paymentType() === 'advance' ? this.advanceAmount() : 0;
    const due = Math.max(0, fee - adv);

    let paymentStatus: 'Paid' | 'Advance' | 'Due' = 'Due';
    if (due === 0 && adv > 0) paymentStatus = 'Paid';
    else if (adv > 0 && due > 0) paymentStatus = 'Advance';

    const booking: ScheduledBooking = {
      id: `bk-${Date.now()}`,
      bookingCode: `TRT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: pt.id,
      patientName: pt.fullName,
      patientCode: pt.patientCode,
      phone: pt.phone,
      date: this.treatmentDate(),
      timeSlot: slot.time,
      treatmentName: this.treatmentName(),
      therapist: this.attendingTherapist(),
      fee,
      advancePaid: adv,
      balanceDue: due,
      paymentStatus,
      paymentMode: this.paymentMode(),
      status: 'Scheduled',
      notes: this.clinicalNotes()
    };

    this.scheduledBookings.update(list => [booking, ...list]);
    this.saveStorage();

    this.alertService.toastSuccess(`Treatment scheduled (${booking.bookingCode})`);
    this.activeTab.set('list');
  }

  // ─── Weekly Protocol Methods ───────────────────────────────────────────────

  toggleAccordion(planId: string): void {
    if (this.expandedPlanId() === planId) {
      this.expandedPlanId.set(null);
    } else {
      this.expandedPlanId.set(planId);
      this.initWeeklyDraft();
    }
  }

  initWeeklyDraft(): void {
    const today = new Date();
    const draft: WeeklyDraftSession[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + (i * 2 - 1));
      draft.push({
        id: `draft-${i}`,
        date: d.toISOString().split('T')[0],
        timeSlot: i === 1 ? '10:00 AM - 10:45 AM' : '02:00 PM - 02:45 PM',
        therapist: this.attendingTherapist()
      });
    }
    this.weeklyDraftSessions.set(draft);
  }

  addWeeklySession(): void {
    const current = this.weeklyDraftSessions();
    let nextDate = new Date();
    if (current.length > 0) {
      nextDate = new Date(current[current.length - 1].date);
      nextDate.setDate(nextDate.getDate() + 2);
    } else {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    this.weeklyDraftSessions.update(list => [
      ...list,
      {
        id: `draft-${Date.now()}`,
        date: nextDate.toISOString().split('T')[0],
        timeSlot: '10:00 AM - 10:45 AM',
        therapist: this.attendingTherapist()
      }
    ]);
  }

  removeWeeklySession(idx: number): void {
    this.weeklyDraftSessions.update(list => list.filter((_, i) => i !== idx));
  }

  submitWeeklySchedule(plan: DoctorTreatmentPlan): void {
    const pt = this.selectedPatient();
    if (!pt) return;

    const draft = this.weeklyDraftSessions();
    if (draft.length === 0) {
      this.alertService.toastWarning('Add at least 1 session date.');
      return;
    }

    const newBookings: ScheduledBooking[] = draft.map((s, idx) => ({
      id: `bk-wk-${Date.now()}-${idx}`,
      bookingCode: `TRT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: pt.id,
      patientName: pt.fullName,
      patientCode: pt.patientCode,
      phone: pt.phone,
      date: s.date,
      timeSlot: s.timeSlot,
      treatmentName: plan.title,
      therapist: s.therapist,
      fee: 0,
      advancePaid: 0,
      balanceDue: 0,
      paymentStatus: 'Paid',
      paymentMode: 'Cash',
      planId: plan.id,
      planName: plan.title,
      status: 'Scheduled'
    }));

    this.scheduledBookings.update(list => [...newBookings, ...list]);
    this.saveStorage();

    this.alertService.toastSuccess(`${draft.length} weekly sessions scheduled.`);
    this.activeTab.set('list');
  }

  // ─── Assign Plan Methods ───────────────────────────────────────────────────

  setNewPlanPaymentType(type: 'full' | 'advance' | 'due'): void {
    this.newPlanPaymentType.set(type);
    if (type === 'full') {
      this.newPlanAdvance.set(this.newPlanPrice());
    } else if (type === 'due') {
      this.newPlanAdvance.set(0);
    } else {
      this.newPlanAdvance.set(Math.round(this.newPlanPrice() / 2));
    }
  }

  submitAssignPlan(): void {
    const pt = this.selectedPatient();
    if (!pt) {
      this.alertService.toastError('Please select a patient first.');
      return;
    }

    const planCode = `PLN-${Math.floor(300 + Math.random() * 600)}`;
    const title = this.newPlanTitle();
    const totalSessions = this.newPlanSessions();
    const durationWeeks = this.newPlanWeeks();
    const price = this.newPlanPrice();

    const plan: DoctorTreatmentPlan = {
      id: planCode,
      planCode,
      title,
      patientId: pt.id,
      patientName: pt.fullName,
      diagnosis: pt.primaryCondition || 'Physiotherapy Treatment',
      totalSessions,
      completedSessions: 0,
      frequency: `${Math.round(totalSessions / durationWeeks)}x weekly`,
      durationWeeks,
      status: 'In Progress',
      statusType: 'in-progress',
      startDate: this.getTodayDateString(),
      targetEndDate: this.getTodayDateString(),
      progressPercent: 0,
      clinicalNotes: '',
      phases: []
    };

    this.treatmentPlans.update(list => [plan, ...list]);
    this.patients.update(list =>
      list.map(p => p.id === pt.id ? { ...p, currentPlan: title, totalSessions, sessionsCompleted: 0 } : p)
    );
    this.selectedPatient.set({ ...pt, currentPlan: title, totalSessions, sessionsCompleted: 0 });

    this.saveStorage();
    this.alertService.toastSuccess('Treatment plan assigned successfully.');
    this.expandedPlanId.set(plan.id);
    this.initWeeklyDraft();
    this.activeTab.set('weekly');
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private saveStorage(): void {
    try {
      localStorage.setItem('pm_st_bookings', JSON.stringify(this.scheduledBookings()));
      localStorage.setItem('pm_st_plans', JSON.stringify(this.treatmentPlans()));
      localStorage.setItem('pm_st_patients', JSON.stringify(this.patients()));
    } catch {}
  }

  private loadStorage(): void {
    try {
      const b = localStorage.getItem('pm_st_bookings');
      if (b) this.scheduledBookings.set(JSON.parse(b));
      else this.seedBookings();

      const p = localStorage.getItem('pm_st_plans');
      if (p) this.treatmentPlans.set(JSON.parse(p));

      const pts = localStorage.getItem('pm_st_patients');
      if (pts) this.patients.set(JSON.parse(pts));
    } catch {
      this.seedBookings();
    }
  }

  private seedBookings(): void {
    const today = this.getTodayDateString();
    this.scheduledBookings.set([
      {
        id: 'seed-1',
        bookingCode: 'TRT-1082',
        patientId: 'PT-1041',
        patientName: 'Ananya Iyer',
        patientCode: 'PT-1041',
        phone: '+91 98234 56789',
        date: today,
        timeSlot: '09:00 AM - 09:45 AM',
        treatmentName: 'Spinal Mobilization',
        therapist: 'Dr. Himanshu Suman (PT)',
        fee: 600,
        advancePaid: 600,
        balanceDue: 0,
        paymentStatus: 'Paid',
        paymentMode: 'UPI',
        status: 'Scheduled'
      },
      {
        id: 'seed-2',
        bookingCode: 'TRT-1083',
        patientId: 'PT-1042',
        patientName: 'Vikramaditya Rao',
        patientCode: 'PT-1042',
        phone: '+91 98450 12345',
        date: today,
        timeSlot: '10:00 AM - 10:45 AM',
        treatmentName: 'Knee ACL Rehab',
        therapist: 'Dr. Priya Sharma (PT)',
        fee: 800,
        advancePaid: 400,
        balanceDue: 400,
        paymentStatus: 'Advance',
        paymentMode: 'Card',
        status: 'Scheduled'
      }
    ]);
  }
}
