import { Component, OnInit, OnDestroy, ElementRef, HostListener, PLATFORM_ID, signal, computed, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import {
  DoctorPatient,
  DoctorTreatmentPlan,
  PatientSearchItem,
  BookAppointmentRequest,
  AppointmentBookedResponse
} from '../../../models/doctor-dashboard.model';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { ApiService } from '../../../services/api.service';
import { Authservice } from '../../../services/authservice';
import { ApiEndPoints } from '../../../helper/api-endpoints';

export interface TreatmentSlot {
  slotId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
  remainingSpots: number;
  isOpen: boolean;
}

export interface PractitionerOption {
  id: number;
  name: string;
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
  visitType?: string;
  fee: number;
  advancePaid: number;
  balanceDue: number;
  paymentStatus: 'Paid' | 'Advance' | 'Due';
  paymentMode: 'UPI' | 'Cash' | 'Card' | 'NetBanking';
  planId?: string;
  planName?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
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
export class ScheduleTreatment implements OnInit, OnDestroy {
  private alertService = inject(SweetAlertService);
  private apiService = inject(ApiService);
  private auth = inject(Authservice);
  private route = inject(ActivatedRoute);
  private elRef = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);

  // ─── Active Tab ────────────────────────────────────────────────────────────
  activeTab = signal<'daily' | 'weekly' | 'assign-plan' | 'list'>('daily');

  // ─── Patient Search & Directory ────────────────────────────────────────────
  patientSearchQuery = signal<string>('');
  selectedPatientId = signal<string | null>(null);
  selectedPatient = signal<DoctorPatient | null>(null);
  isSearchDropdownOpen = signal<boolean>(false);
  patientSearchResults = signal<PatientSearchItem[]>([]);
  isSearchingPatients = signal<boolean>(false);
  selectedPatientItem = signal<PatientSearchItem | null>(null);
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private searchRequestSeq = 0;

  // ─── Daily Treatment Form (Booking Details Only) ───────────────────────────
  practitioners = signal<PractitionerOption[]>([]);
  selectedPractitionerId = signal<number | null>(null);
  isLoadingPractitioners = signal<boolean>(false);

  treatmentDate = signal<string>(this.getTodayDateString());
  availableSlots = signal<TreatmentSlot[]>([]);
  isLoadingSlots = signal<boolean>(false);
  selectedSlot = signal<TreatmentSlot | null>(null);

  visitType = signal<'Clinic' | 'Home'>('Clinic');
  homeVisitAddress = signal<string>('');

  treatmentFee = signal<number>(600);
  paymentType = signal<'advance' | 'due'>('advance');
  advanceAmount = signal<number>(600);
  paymentMode = signal<'UPI' | 'Cash' | 'Card' | 'NetBanking'>('UPI');
  isBookingTreatment = signal<boolean>(false);

  private slotsRequestSeq = 0;

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
  patients = signal<DoctorPatient[]>([]);

  // ─── Treatment Plans Data ──────────────────────────────────────────────────
  treatmentPlans = signal<DoctorTreatmentPlan[]>([]);

  // ─── Scheduled Bookings Ledger ─────────────────────────────────────────────
  scheduledBookings = signal<ScheduledBooking[]>([]);

  // ─── Computed Properties ───────────────────────────────────────────────────

  patientBookings = computed<ScheduledBooking[]>(() => {
    const p = this.selectedPatient();
    if (!p) return [];
    return this.scheduledBookings().filter(b => b.patientId === p.id);
  });

  patientPendingAmount = computed<number>(() => {
    return this.patientBookings().reduce((sum, b) => sum + (b.balanceDue || 0), 0);
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

  get currentPractitionerId(): number {
    const user = this.auth.getCurrentUser();
    const roleId = Number(this.auth.getRoleId() || user?.roleId || 0);
    if (roleId === 3) {
      return Number(user?.practitionerId || 0);
    }
    const profId = this.auth.getCurrentProfessionalId();
    return Number(user?.practitionerId || profId || 0);
  }

  get currentClinicId(): number {
    const user = this.auth.getCurrentUser();
    const roleId = Number(this.auth.getRoleId() || user?.roleId || 0);
    if (roleId === 3) {
      const profId = this.auth.getCurrentProfessionalId();
      return Number(user?.clinicId || profId || 0);
    }
    return Number(user?.clinicId || 0);
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.loadStorage();
    this.loadPractitioners();

    const qp = this.route.snapshot.queryParams;
    if (qp['patientId']) {
      const pt = this.patients().find(p => p.id === qp['patientId'] || p.patientCode === qp['patientId']);
      if (pt) this.selectPatient(pt);
    }
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
    this.searchRequestSeq++;
    this.slotsRequestSeq++;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const searchRow = this.elRef.nativeElement.querySelector('.top-search-row');
    if (searchRow && !searchRow.contains(event.target as Node)) {
      this.isSearchDropdownOpen.set(false);
    }
  }

  // ─── Live Patient Search via Backend API (GetMyPatients, no digit limit) ──

  onPatientSearchChange(query: string): void {
    this.patientSearchQuery.set(query);
    this.isSearchDropdownOpen.set(true);

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }

    const trimmed = query.trim();
    const currentSeq = ++this.searchRequestSeq;

    if (!trimmed) {
      this.patientSearchResults.set([]);
      this.isSearchingPatients.set(false);
      return;
    }

    this.isSearchingPatients.set(true);
    this.searchDebounceTimer = setTimeout(() => {
      this.executePatientSearch(trimmed, currentSeq);
    }, 250);
  }

  private async executePatientSearch(trimmed: string, seq: number): Promise<void> {
    try {
      const res = await this.apiService.Post<any>(ApiEndPoints.GetMyPatients, {
        search: trimmed,
        page: 1,
        pageSize: 20
      });
      if (seq !== this.searchRequestSeq) return;

      const items = Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res?.data)
          ? res.data
          : [];

      if (res?.isSuccess && items.length > 0) {
        this.patientSearchResults.set(items as PatientSearchItem[]);
      } else {
        this.patientSearchResults.set([]);
      }
    } catch (e) {
      if (seq !== this.searchRequestSeq) return;
      console.error('Patient search error', e);
      this.patientSearchResults.set([]);
    } finally {
      if (seq === this.searchRequestSeq) {
        this.isSearchingPatients.set(false);
      }
    }
  }

  selectPatientFromSearch(item: PatientSearchItem): void {
    const ptCode = `PT-${item.patientId}`;
    const existing = this.patients().find(p => p.id === ptCode || p.patientCode === ptCode);
    const age = item.age && item.age > 0 ? item.age : this.calculateAge(item.dob);
    const lastVisit =
      item.lastVisitDate &&
      !item.lastVisitDate.startsWith('0001-01-01') &&
      !isNaN(new Date(item.lastVisitDate).getTime())
        ? new Date(item.lastVisitDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : 'N/A';

    const patient: DoctorPatient = {
      id: ptCode,
      patientCode: ptCode,
      fullName: item.fullName || '',
      age,
      gender: item.gender || '',
      phone: item.mobile || '',
      mobile: item.mobile || '',
      email: item.email || '',
      dob: item.dob || undefined,
      address: item.address || undefined,
      city: item.city || undefined,
      state: item.state || undefined,
      photoUrl: item.profileImage || undefined,
      primaryCondition: existing?.primaryCondition,
      currentPlan: existing?.currentPlan,
      status: existing?.status || 'Active',
      sessionsCompleted: existing?.sessionsCompleted ?? 0,
      totalSessions: existing?.totalSessions ?? 0,
      lastVisit
    };

    if (existing) {
      this.patients.update(list => list.map(p => (p.id === existing.id ? patient : p)));
    } else {
      this.patients.update(list => [patient, ...list]);
    }

    this.selectedPatientItem.set(item);
    this.selectPatient(patient);
  }

  private calculateAge(dob?: string | null): number {
    if (!dob) return 0;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  }

  // ─── Patient Selection ─────────────────────────────────────────────────────

  selectPatient(pt: DoctorPatient): void {
    this.selectedPatientId.set(pt.id);
    this.selectedPatient.set(pt);
    this.patientSearchQuery.set('');
    this.patientSearchResults.set([]);
    this.isSearchDropdownOpen.set(false);
    this.homeVisitAddress.set(this.selectedPatientItem()?.address || pt.address || '');

    // Expand plan if exists
    const plan = this.patientActivePlan();
    if (plan) {
      this.expandedPlanId.set(plan.id);
      this.initWeeklyDraft();
    }
  }

  clearSearch(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
    this.searchRequestSeq++;
    this.patientSearchQuery.set('');
    this.patientSearchResults.set([]);
    this.isSearchingPatients.set(false);
    this.isSearchDropdownOpen.set(false);
  }

  getInitials(name: string): string {
    if (!name) return 'PT';
    return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  }

  // ─── Daily Treatment Methods (Practitioners, Slots & Book API) ────────────

  async loadPractitioners(): Promise<void> {
    this.isLoadingPractitioners.set(true);
    let loaded: PractitionerOption[] = [];
    try {
      const res = await this.apiService.Post<any>(ApiEndPoints.GetPractitioners, {
        page: 1,
        pageSize: 100
      });
      if (res?.isSuccess && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.items ?? []);
        loaded = list
          .map((p: any) => ({
            id: Number(p.id ?? p.practitionerId ?? 0),
            name: String(p.fullName ?? p.name ?? `Dr. ${p.id}`).trim()
          }))
          .filter((p: PractitionerOption) => p.id > 0);
      }
    } catch (e) {
      console.error('Error loading practitioners', e);
    } finally {
      const currentPid = this.currentPractitionerId;
      if (currentPid > 0 && !loaded.some(p => p.id === currentPid)) {
        const currentName = this.auth.getUserName() || 'Assigned Doctor';
        loaded = [{ id: currentPid, name: currentName }, ...loaded];
      }

      this.practitioners.set(loaded);

      if (!this.selectedPractitionerId() && loaded.length > 0) {
        const defaultId =
          currentPid > 0 && loaded.some(p => p.id === currentPid)
            ? currentPid
            : loaded[0].id;
        this.selectedPractitionerId.set(defaultId);
      }

      this.isLoadingPractitioners.set(false);
      await this.loadAvailableSlots();
    }
  }

  async loadAvailableSlots(): Promise<void> {
    const seq = ++this.slotsRequestSeq;
    const date = this.treatmentDate();
    const today = this.getTodayDateString();

    if (!date || date < today) {
      this.availableSlots.set([]);
      this.selectedSlot.set(null);
      this.isLoadingSlots.set(false);
      return;
    }

    const pid = this.selectedPractitionerId();
    const cid = this.currentClinicId;
    const user = this.auth.getCurrentUser();
    const roleId = Number(this.auth.getRoleId() || user?.roleId || 0);

    if ((!pid || pid <= 0) && cid <= 0) {
      this.availableSlots.set([]);
      this.selectedSlot.set(null);
      this.isLoadingSlots.set(false);
      return;
    }

    this.isLoadingSlots.set(true);
    try {
      let slots: TreatmentSlot[] = [];

      if (pid && pid > 0) {
        slots = await this.fetchSlotsByQuery(`practitionerId=${pid}&date=${encodeURIComponent(date)}`);
      }

      if (slots.length === 0 && cid > 0 && (!pid || pid <= 0 || roleId === 3)) {
        slots = await this.fetchSlotsByQuery(`clinicId=${cid}&date=${encodeURIComponent(date)}`);
      }

      if (seq !== this.slotsRequestSeq) return;

      this.availableSlots.set(slots);

      const prevSlotId = this.selectedSlot()?.slotId;
      const retained = prevSlotId
        ? slots.find(s => s.slotId === prevSlotId && s.isOpen && s.remainingSpots > 0)
        : undefined;
      const firstOpen = retained ?? slots.find(s => s.isOpen && s.remainingSpots > 0) ?? null;
      this.selectedSlot.set(firstOpen);
    } catch (e) {
      if (seq !== this.slotsRequestSeq) return;
      console.error('Error loading treatment slots', e);
      this.availableSlots.set([]);
      this.selectedSlot.set(null);
    } finally {
      if (seq === this.slotsRequestSeq) {
        this.isLoadingSlots.set(false);
      }
    }
  }

  private async fetchSlotsByQuery(query: string): Promise<TreatmentSlot[]> {
    const res = await this.apiService.Get<any>(
      `${ApiEndPoints.GetAvailableAppointmentSlots}?${query}`
    );
    if (res?.isSuccess && res.data) {
      const raw = Array.isArray(res.data) ? res.data : [res.data];
      return raw
        .map((s: any) => ({
          slotId: Number(s.slotId ?? s.SlotId ?? 0),
          slotDate: String(s.slotDate ?? s.SlotDate ?? ''),
          startTime: String(s.startTime ?? s.StartTime ?? ''),
          endTime: String(s.endTime ?? s.EndTime ?? ''),
          maxCapacity: Number(s.maxCapacity ?? s.MaxCapacity ?? 0),
          currentBookings: Number(s.currentBookings ?? s.CurrentBookings ?? 0),
          remainingSpots: Number(s.remainingSpots ?? s.RemainingSpots ?? 0),
          isOpen: Boolean(s.isOpen ?? s.IsOpen ?? true)
        }))
        .filter((s: TreatmentSlot) => s.slotId > 0);
    }
    return [];
  }

  onTreatmentDateChange(date: string): void {
    this.treatmentDate.set(date);
    this.selectedSlot.set(null);
    this.loadAvailableSlots();
  }

  onPractitionerChange(practitionerId: number | string | null): void {
    const numericId = practitionerId !== null && practitionerId !== '' ? Number(practitionerId) : null;
    this.selectedPractitionerId.set(numericId && !isNaN(numericId) ? numericId : null);
    this.selectedSlot.set(null);
    this.loadAvailableSlots();
  }

  onVisitTypeChange(type: 'Clinic' | 'Home'): void {
    this.visitType.set(type);
    if (type === 'Home' && !this.homeVisitAddress().trim()) {
      const addr = this.selectedPatientItem()?.address || this.selectedPatient()?.address || '';
      if (addr) {
        this.homeVisitAddress.set(addr);
      }
    }
  }

  formatSlotTime(t: string): string {
    if (!t) return '';
    const parts = t.split(':');
    let h = parseInt(parts[0], 10);
    if (isNaN(h)) return t;
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  getSelectedPractitionerName(): string {
    const pid = this.selectedPractitionerId();
    if (!pid) return this.auth.getUserName() || 'Assigned Doctor';
    return this.practitioners().find(p => p.id === pid)?.name || this.auth.getUserName() || 'Assigned Doctor';
  }

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

  selectSlot(slot: TreatmentSlot): void {
    if (!slot.isOpen || slot.remainingSpots <= 0) return;
    this.selectedSlot.set(slot);
  }

  async submitDailyTreatment(): Promise<void> {
    if (this.isBookingTreatment()) return;

    const pt = this.selectedPatient();
    const ptItem = this.selectedPatientItem();
    const rawPatientId = ptItem?.patientId ?? Number(String(pt?.patientCode || pt?.id || '').replace(/\D/g, ''));
    if (!pt || !rawPatientId || isNaN(rawPatientId)) {
      this.alertService.toastError('Please select a patient.');
      return;
    }

    const date = this.treatmentDate();
    if (!date) {
      this.alertService.toastError('Please select a treatment date.');
      return;
    }
    if (date < this.getTodayDateString()) {
      this.alertService.toastError('Treatment date cannot be in the past.');
      return;
    }

    const slot = this.selectedSlot();
    if (!slot || !slot.isOpen || slot.remainingSpots <= 0) {
      this.alertService.toastError('Please select an available time slot.');
      return;
    }

    const practitionerId = this.selectedPractitionerId();
    if (!practitionerId && this.practitioners().length > 0) {
      this.alertService.toastError('Please select an assigned practitioner.');
      return;
    }

    const visitMode = this.visitType();
    const trimmedAddress = this.homeVisitAddress().trim();
    if (visitMode === 'Home' && !trimmedAddress) {
      this.alertService.toastError('Please enter home visit address.');
      return;
    }

    const fee = Number(this.treatmentFee()) || 0;
    if (fee < 0) {
      this.alertService.toastError('Treatment fee cannot be negative.');
      return;
    }

    const isAdvance = this.paymentType() === 'advance';
    const adv = isAdvance ? (Number(this.advanceAmount()) || 0) : 0;

    if (isAdvance && adv < 0) {
      this.alertService.toastError('Advance paid cannot be negative.');
      return;
    }
    if (isAdvance && adv > fee) {
      this.alertService.toastError('Advance paid cannot exceed the treatment fee.');
      return;
    }
    if (isAdvance && fee > 0 && adv <= 0) {
      this.alertService.toastError('Enter advance amount greater than 0 or switch to Payment Due.');
      return;
    }

    const due = Math.max(0, fee - adv);

    let apiPaymentStatus: 'Paid' | 'PartiallyPaid' | 'Due' = 'Due';
    let uiPaymentStatus: 'Paid' | 'Advance' | 'Due' = 'Due';
    let payloadAmount = fee;
    let payloadPaymentMode: string | null = null;

    if (isAdvance && adv > 0) {
      payloadAmount = adv;
      payloadPaymentMode = this.paymentMode();
      if (due === 0) {
        apiPaymentStatus = 'Paid';
        uiPaymentStatus = 'Paid';
      } else {
        apiPaymentStatus = 'PartiallyPaid';
        uiPaymentStatus = 'Advance';
      }
    }

    const pid = practitionerId && practitionerId > 0 ? practitionerId : 0;
    const payload: BookAppointmentRequest = {
      patientId: rawPatientId,
      userId: 0,
      userSubscriptionId: 0,
      appointmentSlotId: slot.slotId,
      appointmentDate: date,
      visitType: visitMode,
      homeVisitAddress: visitMode === 'Home' ? trimmedAddress : null,
      practitionerId: pid,
      clinicId: this.currentClinicId,
      assignedPractitionerId: pid > 0 ? pid : null,
      bookingType: 'Treatment',
      amount: payloadAmount,
      paymentMode: payloadPaymentMode,
      paymentStatus: apiPaymentStatus
    };

    this.isBookingTreatment.set(true);
    try {
      const res = await this.apiService.Post<AppointmentBookedResponse>(
        ApiEndPoints.BookAppointment,
        payload
      );

      if (res?.isSuccess) {
        const booked = res.data;
        const slotLabel =
          booked?.startTime && booked?.endTime
            ? `${this.formatSlotTime(booked.startTime)} - ${this.formatSlotTime(booked.endTime)}`
            : `${this.formatSlotTime(slot.startTime)} - ${this.formatSlotTime(slot.endTime)}`;

        const booking: ScheduledBooking = {
          id: `bk-${booked?.appointmentId || Date.now()}`,
          bookingCode: booked?.appointmentId
            ? `APT-${booked.appointmentId}`
            : `TRT-${Math.floor(1000 + Math.random() * 9000)}`,
          patientId: pt.id,
          patientName: pt.fullName,
          patientCode: pt.patientCode,
          phone: pt.phone || pt.mobile || '',
          date,
          timeSlot: slotLabel,
          treatmentName: `${visitMode} Visit`,
          therapist: booked?.doctorName || this.getSelectedPractitionerName(),
          visitType: visitMode,
          fee,
          advancePaid: adv,
          balanceDue: due,
          paymentStatus: uiPaymentStatus,
          paymentMode: this.paymentMode(),
          status: (booked?.status as 'Scheduled' | 'Completed' | 'Cancelled') || 'Scheduled'
        };

        this.scheduledBookings.update(list => [booking, ...list]);
        this.saveStorage();

        this.alertService.toastSuccess(res.message || `Treatment scheduled (${booking.bookingCode})`);
        await this.loadAvailableSlots();
        this.activeTab.set('list');
      } else if (res?.responseCode !== 500) {
        this.alertService.toastError(res?.message || 'Failed to schedule treatment.');
      }
    } catch (e) {
      console.error('Book appointment error', e);
      this.alertService.toastError('Unable to book appointment. Please try again.');
    } finally {
      this.isBookingTreatment.set(false);
    }
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
        date: this.formatLocalDate(d),
        timeSlot: i === 1 ? '10:00 AM - 10:45 AM' : '02:00 PM - 02:45 PM',
        therapist: this.getSelectedPractitionerName()
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
        date: this.formatLocalDate(nextDate),
        timeSlot: '10:00 AM - 10:45 AM',
        therapist: this.getSelectedPractitionerName()
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
    return this.formatLocalDate(new Date());
  }

  private formatLocalDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getVisitDay(dateStr: string): string {
    const d = this.parseLocalDate(dateStr);
    return d ? String(d.getDate()).padStart(2, '0') : '--';
  }

  getVisitMonth(dateStr: string): string {
    const d = this.parseLocalDate(dateStr);
    return d ? d.toLocaleDateString('en-US', { month: 'short' }) : '';
  }

  private parseLocalDate(dateStr?: string | null): Date | null {
    if (!dateStr) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private saveStorage(): void {
    try {
      localStorage.setItem('pm_st_bookings', JSON.stringify(this.scheduledBookings()));
      localStorage.setItem('pm_st_plans', JSON.stringify(this.treatmentPlans()));
    } catch {}
  }

  private loadStorage(): void {
    const dummyBookingIds = new Set(['seed-1', 'seed-2']);
    const dummyPlanIds = new Set(['PLN-301', 'PLN-302', 'PLN-303']);
    const dummyPatientIds = new Set(['PT-1041', 'PT-1042', 'PT-1043', 'PT-1044', 'PT-1045', 'PT-1064']);

    try {
      const b = localStorage.getItem('pm_st_bookings');
      if (b) {
        const parsed: ScheduledBooking[] = JSON.parse(b);
        if (Array.isArray(parsed)) {
          this.scheduledBookings.set(
            parsed.filter(item => !dummyBookingIds.has(item.id) && !dummyPatientIds.has(item.patientId))
          );
        }
      }

      const p = localStorage.getItem('pm_st_plans');
      if (p) {
        const parsedPlans: DoctorTreatmentPlan[] = JSON.parse(p);
        if (Array.isArray(parsedPlans)) {
          this.treatmentPlans.set(
            parsedPlans.filter(plan => !dummyPlanIds.has(plan.id) && !dummyPatientIds.has(plan.patientId))
          );
        }
      }
    } catch {
      this.scheduledBookings.set([]);
      this.treatmentPlans.set([]);
    }
  }
}
