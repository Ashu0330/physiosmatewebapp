import { Component, OnInit, OnDestroy, ElementRef, HostListener, PLATFORM_ID, signal, computed, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import {
  DoctorPatient,
  DoctorTreatmentPlan,
  PatientSearchItem,
  BookAppointmentRequest,
  AppointmentBookedResponse,
  UserSubscriptionViewModel,
  ProviderSubscriptionPlanItem,
  WeeklyAppointmentSelectionViewModel,
  CreateWeeklyAppointmentsViewModel,
  WeeklyAppointmentsBookedViewModel,
  SubscriptionSummaryDto,
  SlotTemplateDto,
  PatientAppointmentDetailsDto,
  TreatmentSlot,
  PractitionerOption,
  ScheduledBooking,
  WeeklyDraftSession
} from '../../../models/doctor-dashboard.model';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { ApiService } from '../../../services/api.service';
import { Authservice } from '../../../services/authservice';
import { ApiEndPoints } from '../../../helper/api-endpoints';
import { SharedModule } from '../../../shared/shared-module';

@Component({
  selector: 'app-schedule-treatment',
  standalone: true,
  imports: [SharedModule],
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
  isSavingWeeklySchedule = signal<boolean>(false);
  slotTemplates = signal<SlotTemplateDto[]>([]);
  isLoadingSlotTemplates = signal<boolean>(false);
  activeSubscriptionSummary = signal<SubscriptionSummaryDto | null>(null);
  isLoadingPatientData = signal<boolean>(false);

  // ─── Assign Plan Form ──────────────────────────────────────────────────────
  availablePlans = signal<ProviderSubscriptionPlanItem[]>([]);
  isLoadingPlans = signal<boolean>(false);
  selectedPlanId = signal<number | null>(null);
  isAssigningPlan = signal<boolean>(false);
  selectedPlan = computed(() => this.availablePlans().find(p => p.id === this.selectedPlanId()) || null);

  newPlanTitle = signal<string>('');
  newPlanSessions = signal<number>(1);
  newPlanWeeks = signal<number>(4);
  newPlanPrice = signal<number>(0);
  newPlanPaymentType = signal<'full' | 'advance' | 'due'>('full');
  newPlanAdvance = signal<number>(0);
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

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.loadPractitioners();
    this.loadProviderPlans();
    this.loadSlotTemplates();

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
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
    const trimmed = query.trim();
    const currentSeq = ++this.searchRequestSeq;
    if (!trimmed) {
      this.patientSearchResults.set([]);
      this.isSearchingPatients.set(false);
      this.isSearchDropdownOpen.set(false);
      return;
    }
    this.isSearchingPatients.set(true);
    this.isSearchDropdownOpen.set(true);
    this.searchDebounceTimer = setTimeout(async () => {
      try {
        const res = await this.apiService.Post<any>(ApiEndPoints.GetMyPatients, {
          search: trimmed, page: 1, pageSize: 20
        });
        if (currentSeq !== this.searchRequestSeq) return;
        const items = Array.isArray(res?.data?.items) ? res.data.items : Array.isArray(res?.data) ? res.data : [];
        if (res?.isSuccess && items.length > 0) {
          this.patientSearchResults.set(items as PatientSearchItem[]);
        } else {
          this.patientSearchResults.set([]);
        }
      } catch (e) {
        if (currentSeq !== this.searchRequestSeq) return;
        console.error('Patient search error', e);
        this.patientSearchResults.set([]);
      } finally {
        if (currentSeq === this.searchRequestSeq) {
          this.isSearchingPatients.set(false);
        }
      }
    }, 500);
  }

  selectPatientFromSearch(item: PatientSearchItem): void {
    debugger;
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
      lastVisit,
      notes: (item as any).notes || existing?.notes || undefined
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

    let rawPatientId = this.selectedPatientItem()?.patientId;
    if (!rawPatientId && pt.id) {
      const match = pt.id.match(/\d+/);
      if (match) rawPatientId = parseInt(match[0], 10);
    }

    if (rawPatientId && rawPatientId > 0) {
      this.loadPatientSubscription(rawPatientId);
      this.loadPatientAppointments(rawPatientId);
    } else {
      const plan = this.patientActivePlan();
      if (plan) {
        this.expandedPlanId.set(plan.id);
        this.initWeeklyDraft();
      }
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
      this.practitioners.set(loaded);

      if (!this.selectedPractitionerId() && loaded.length > 0) {
        this.selectedPractitionerId.set(loaded[0].id);
      }

      this.isLoadingPractitioners.set(false);
      await this.loadAvailableSlots();
    }
  }

  get roleId(): number | null {
    return this.auth.getRoleId() ?? this.auth.getCurrentUser()?.roleId ?? null;
  }

  get isClinic(): boolean {
    const user = this.auth.getCurrentUser();
    return this.roleId === 3 || (!user?.practitionerId && !!(user?.clinicId || this.auth.getClinicId()));
  }

  get clinicId(): number {
    const profId = this.auth.getCurrentProfessionalId();
    const user = this.auth.getCurrentUser();
    const id = this.auth.getClinicId() || user?.clinicId || user?.ClinicId || (this.isClinic ? profId : null);
    return Number(id || 0);
  }

  get practitionerId(): number {
    const profId = this.auth.getCurrentProfessionalId();
    const user = this.auth.getCurrentUser();
    const id = this.selectedPractitionerId() || this.auth.getPractitionerId() || user?.practitionerId || user?.PractitionerId || (!this.isClinic ? profId : null);
    return Number(id || 0);
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

    this.isLoadingSlots.set(true);
    try {
      let query: string;
      if (this.isClinic) {
        const cid = this.clinicId;
        query = `clinicId=${cid}&date=${encodeURIComponent(date)}`;
      } else {
        const pid = this.selectedPractitionerId() || this.practitionerId;
        query = pid && pid > 0
          ? `practitionerId=${pid}&date=${encodeURIComponent(date)}`
          : `date=${encodeURIComponent(date)}`;
      }

      const slots = await this.fetchSlotsByQuery(query);

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
      clinicId: this.isClinic ? this.clinicId : 0,
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

  async loadSlotTemplates(): Promise<void> {
    this.isLoadingSlotTemplates.set(true);
    try {
      const res = await this.apiService.Get<SlotTemplateDto[]>(ApiEndPoints.GetAppointmentSlots);
      if (res?.isSuccess && Array.isArray(res.data)) {
        this.slotTemplates.set(res.data.filter(s => s.isActive));
      }
    } catch (e) {
      console.error('Error loading slot templates', e);
    } finally {
      this.isLoadingSlotTemplates.set(false);
    }
  }

  async loadPatientSubscription(patientId: number): Promise<void> {
    try {
      const res = await this.apiService.Get<SubscriptionSummaryDto>(
        `${ApiEndPoints.GetSubscriptionCurrent}?userId=${patientId}`
      );
      if (res?.isSuccess && res.data) {
        const sub = res.data;
        const planCode = `PLN-${sub.planId}`;
        const plan: DoctorTreatmentPlan = {
          id: planCode,
          planCode,
          title: sub.planName,
          patientId: `PT-${patientId}`,
          patientName: this.selectedPatient()?.fullName || '',
          diagnosis: this.selectedPatient()?.primaryCondition || 'Physiotherapy Treatment',
          totalSessions: sub.totalSessions,
          completedSessions: sub.completedSessions,
          frequency: `${Math.round(sub.totalSessions / 4)}x weekly`,
          durationWeeks: 4,
          status: sub.status === 'Active' ? 'In Progress' : 'Pending Approval',
          statusType: sub.status === 'Active' ? 'in-progress' : 'pending',
          startDate: sub.startDate ? sub.startDate.split('T')[0] : this.getTodayDateString(),
          targetEndDate: sub.expiryDate ? sub.expiryDate.split('T')[0] : this.getTodayDateString(),
          progressPercent: sub.totalSessions > 0 ? Math.round((sub.completedSessions / sub.totalSessions) * 100) : 0,
          clinicalNotes: '',
          phases: [],
          userSubscriptionId: sub.id
        };

        this.activeSubscriptionSummary.set(sub);
        this.treatmentPlans.update(list => {
          const filtered = list.filter(p => p.patientId !== `PT-${patientId}` && p.id !== planCode);
          return [plan, ...filtered];
        });

        this.expandedPlanId.set(planCode);
        this.initWeeklyDraft();
      }
    } catch (e) {
      console.error('Error loading patient subscription', e);
    }
  }

  async loadPatientAppointments(patientId: number): Promise<void> {
    this.isLoadingPatientData.set(true);
    try {
      const res = await this.apiService.Get<PatientAppointmentDetailsDto[]>(
        `${ApiEndPoints.PatientAppointmentDetails}?patientId=${patientId}`
      );
      if (res?.isSuccess && Array.isArray(res.data)) {
        const pt = this.selectedPatient();
        const activePlan = this.patientActivePlan();
        const mapped: ScheduledBooking[] = res.data.map(a => {
          const datePart = a.appointmentDate ? a.appointmentDate.split('T')[0] : '';
          const slotLabel = a.timeSlot
            ? a.timeSlot
            : (a.startTime && a.endTime ? `${this.formatSlotTime(a.startTime)} - ${this.formatSlotTime(a.endTime)}` : a.appointmentTime || '');

          const isPlanSession = (a.userSubscriptionId && a.userSubscriptionId > 0) || (a.sessionNumber && a.sessionNumber > 0);
          const treatmentTitle = isPlanSession
            ? (activePlan?.title || 'Treatment Plan')
            : (a.visitType ? `${a.visitType} Visit` : 'Clinic Visit');

          const fee = a.amount ?? (isPlanSession ? 0 : 600);
          const isPaid = a.paymentStatus === 'Paid' || a.paymentStatus === 'Success' || (isPlanSession && fee === 0);
          const adv = isPaid ? fee : 0;
          const due = isPaid ? 0 : fee;

          return {
            id: `apt-${a.id}`,
            bookingCode: `TRT-${a.id}`,
            patientId: `PT-${a.patientId || patientId}`,
            patientName: a.patientName || pt?.fullName || 'Patient',
            patientCode: `PT-${a.patientId || patientId}`,
            phone: pt?.phone || pt?.mobile || '',
            date: datePart,
            timeSlot: slotLabel,
            treatmentName: treatmentTitle,
            therapist: a.assignedPractitionerName || a.practitionerName || this.getSelectedPractitionerName(),
            visitType: a.visitType,
            fee: fee,
            advancePaid: adv,
            balanceDue: due,
            paymentStatus: isPaid ? 'Paid' : 'Due',
            paymentMode: (a.paymentMethod as any) || 'Cash',
            status: (a.status as any) || 'Scheduled',
            planId: a.userSubscriptionId ? `PLN-${a.userSubscriptionId}` : undefined,
            planName: isPlanSession ? treatmentTitle : undefined
          };
        });

        this.scheduledBookings.update(currentList => {
          const otherBookings = currentList.filter(b => b.patientId !== `PT-${patientId}` && b.patientId !== String(patientId));
          return [...mapped, ...otherBookings];
        });
      }
    } catch (e) {
      console.error('Error loading patient appointments', e);
    } finally {
      this.isLoadingPatientData.set(false);
    }
  }

  initWeeklyDraft(): void {
    const today = new Date();
    const draft: WeeklyDraftSession[] = [];
    const templates = this.slotTemplates();
    const therapistName = this.getSelectedPractitionerName();

    for (let i = 1; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + (i * 2 - 1));
      const dateStr = this.formatLocalDate(d);
      const dow = d.getDay();
      const daySlots = templates.filter(s => s.dayOfWeek === dow && s.isActive);

      const chosenSlot = i === 1
        ? (daySlots.find(s => s.startTime.startsWith('10:')) || daySlots[0] || templates[0])
        : (daySlots.find(s => s.startTime.startsWith('14:')) || daySlots[0] || templates[0]);

      const slotId = chosenSlot?.id;
      const timeSlot = chosenSlot
        ? `${this.formatSlotTime(chosenSlot.startTime)} - ${this.formatSlotTime(chosenSlot.endTime)}`
        : '';

      draft.push({
        id: `draft-${Date.now()}-${i}`,
        date: dateStr,
        timeSlot: timeSlot,
        therapist: therapistName,
        slotId: slotId,
        daySlots: daySlots.length > 0 ? daySlots : templates
      });
    }
    this.weeklyDraftSessions.set(draft);
  }

  addWeeklySession(): void {
    const current = this.weeklyDraftSessions();
    let nextDate = new Date();
    if (current.length > 0) {
      const last = current[current.length - 1];
      nextDate = new Date(last.date + 'T00:00:00');
      nextDate.setDate(nextDate.getDate() + 2);
    } else {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    const dateStr = this.formatLocalDate(nextDate);
    const dow = nextDate.getDay();
    const templates = this.slotTemplates();
    const daySlots = templates.filter(s => s.dayOfWeek === dow && s.isActive);
    const chosenSlot = daySlots.find(s => s.startTime.startsWith('10:')) || daySlots[0] || templates[0];
    const slotId = chosenSlot?.id;
    const timeSlot = chosenSlot
      ? `${this.formatSlotTime(chosenSlot.startTime)} - ${this.formatSlotTime(chosenSlot.endTime)}`
      : '';

    this.weeklyDraftSessions.update(list => [
      ...list,
      {
        id: `draft-${Date.now()}`,
        date: dateStr,
        timeSlot: timeSlot,
        therapist: this.getSelectedPractitionerName(),
        slotId: slotId,
        daySlots: daySlots.length > 0 ? daySlots : templates
      }
    ]);
  }

  removeWeeklySession(idx: number): void {
    this.weeklyDraftSessions.update(list => list.filter((_, i) => i !== idx));
  }

  onDraftDateChange(sess: WeeklyDraftSession, newDate: string): void {
    sess.date = newDate;
    if (!newDate) return;
    const d = new Date(newDate + 'T00:00:00');
    if (isNaN(d.getTime())) return;
    const dow = d.getDay();
    const daySlots = this.slotTemplates().filter(s => s.dayOfWeek === dow && s.isActive);
    sess.daySlots = daySlots;
    if (daySlots.length > 0) {
      const match = daySlots.find(s => s.id === sess.slotId) || daySlots[0];
      sess.slotId = match.id;
      sess.timeSlot = `${this.formatSlotTime(match.startTime)} - ${this.formatSlotTime(match.endTime)}`;
    }
  }

  onDraftSlotChange(sess: WeeklyDraftSession, slotIdOrTime: any): void {
    const numericId = Number(slotIdOrTime);
    const found = (sess.daySlots || this.slotTemplates()).find(s => s.id === numericId);
    if (found) {
      sess.slotId = found.id;
      sess.timeSlot = `${this.formatSlotTime(found.startTime)} - ${this.formatSlotTime(found.endTime)}`;
    } else {
      sess.timeSlot = String(slotIdOrTime);
    }
  }

  async submitWeeklySchedule(plan: DoctorTreatmentPlan): Promise<void> {
    if (this.isSavingWeeklySchedule()) return;

    const pt = this.selectedPatient();
    const patientItem = this.selectedPatientItem();
    let rawPatientId = patientItem?.patientId;
    if (!rawPatientId && pt?.id) {
      const match = pt.id.match(/\d+/);
      if (match) rawPatientId = parseInt(match[0], 10);
    }

    if (!rawPatientId || rawPatientId <= 0) {
      this.alertService.toastError('Please select a patient first.');
      return;
    }

    const draft = this.weeklyDraftSessions();
    if (draft.length === 0) {
      this.alertService.toastWarning('Add at least 1 session date.');
      return;
    }

    let userSubscriptionId = plan.userSubscriptionId || this.activeSubscriptionSummary()?.id;
    if (!userSubscriptionId) {
      await this.loadPatientSubscription(rawPatientId);
      userSubscriptionId = this.activeSubscriptionSummary()?.id || plan.userSubscriptionId;
    }

    if (!userSubscriptionId || userSubscriptionId <= 0) {
      this.alertService.toastError('No active subscription found for this patient. Please assign a plan first.');
      return;
    }

    const appointments: WeeklyAppointmentSelectionViewModel[] = [];
    for (let idx = 0; idx < draft.length; idx++) {
      const s = draft[idx];
      if (!s.date) {
        this.alertService.toastError(`Please select a valid date for Day ${idx + 1}.`);
        return;
      }
      const d = new Date(s.date + 'T00:00:00');
      if (isNaN(d.getTime())) {
        this.alertService.toastError(`Invalid date for Day ${idx + 1}.`);
        return;
      }
      const dow = d.getDay();

      let slotId = s.slotId;
      if (!slotId) {
        const match = this.slotTemplates().find(t => t.dayOfWeek === dow && t.isActive);
        slotId = match ? match.id : 0;
      }

      if (!slotId || slotId <= 0) {
        this.alertService.toastError(`No available slot found for Day ${idx + 1} (${s.date}).`);
        return;
      }

      appointments.push({
        appointmentSlotId: slotId,
        appointmentDate: `${s.date}T12:00:00`
      });
    }

    const payload: CreateWeeklyAppointmentsViewModel = {
      userSubscriptionId: userSubscriptionId,
      patientId: rawPatientId,
      appointments: appointments
    };

    this.isSavingWeeklySchedule.set(true);
    try {
      const res = await this.apiService.Post<WeeklyAppointmentsBookedViewModel>(
        ApiEndPoints.CreateWeeklyAppointments,
        payload
      );

      if (res?.isSuccess) {
        this.alertService.toastSuccess(
          res.message || `${res.data?.totalBooked || draft.length} weekly sessions scheduled successfully!`
        );

        // Refresh appointments and subscription from backend
        await this.loadPatientAppointments(rawPatientId);
        await this.loadPatientSubscription(rawPatientId);

        // Switch to scheduled list tab
        this.activeTab.set('list');
      } else {
        this.alertService.toastError(res?.message || 'Failed to schedule weekly appointments.');
      }
    } catch (err: any) {
      console.error('Error in CreateWeeklyAppointments', err);
      this.alertService.toastError(err?.message || 'Failed to schedule weekly appointments. Please try again.');
    } finally {
      this.isSavingWeeklySchedule.set(false);
    }
  }

  // ─── Assign Plan Methods ───────────────────────────────────────────────────

  async loadProviderPlans(): Promise<void> {
    this.isLoadingPlans.set(true);
    try {
      const res = await this.apiService.Get<any>(ApiEndPoints.GetProviderPlans);
      if (res?.isSuccess && Array.isArray(res.data)) {
        this.availablePlans.set(res.data);
        if (res.data.length > 0 && !this.selectedPlanId()) {
          this.onPlanSelect(res.data[0].id);
        }
      } else {
        this.availablePlans.set([]);
      }
    } catch (e) {
      console.error('Error loading provider plans', e);
      this.availablePlans.set([]);
    } finally {
      this.isLoadingPlans.set(false);
    }
  }

  onPlanSelect(planId: number | string | null): void {
    if (planId === null || planId === undefined) {
      this.selectedPlanId.set(null);
      return;
    }
    const numericId = Number(planId);
    this.selectedPlanId.set(numericId);
    if (numericId === 0) {
      return;
    }
    const plan = this.availablePlans().find(p => p.id === numericId);
    if (plan) {
      this.newPlanTitle.set(plan.planName);
      this.newPlanSessions.set(plan.totalSessions || 1);
      this.newPlanWeeks.set(Math.ceil((plan.validityDays || 28) / 7) || 4);
      this.newPlanPrice.set(plan.price || 0);
      this.setNewPlanPaymentType('full');
    }
  }

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

  async submitAssignPlan(): Promise<void> {
    const pt = this.selectedPatient();
    const patientItem = this.selectedPatientItem();
    let patientId = patientItem?.patientId;
    if (!patientId && pt?.id) {
      const match = pt.id.match(/\d+/);
      if (match) patientId = parseInt(match[0], 10);
    }

    if (!patientId || patientId <= 0) {
      this.alertService.toastError('Please search and select a patient first.');
      return;
    }

    let planId = this.selectedPlanId();
    let plan = this.availablePlans().find(p => p.id === planId);

    // If custom/new plan entered without selecting existing one, create provider plan first
    if (!planId || planId <= 0) {
      const title = this.newPlanTitle()?.trim();
      if (!title) {
        this.alertService.toastError('Please enter a plan name.');
        return;
      }

      try {
        const createPlanPayload = {
          id: 0,
          planName: title,
          totalSessions: this.newPlanSessions() || 1,
          validityDays: (this.newPlanWeeks() || 4) * 7,
          price: this.newPlanPrice() || 0,
          isActive: true,
          isPopular: false
        };
        const createRes = await this.apiService.Post<any>(ApiEndPoints.AddProviderPlans, createPlanPayload);
        if (createRes?.isSuccess) {
          await this.loadProviderPlans();
          plan = this.availablePlans().find(p => p.planName.toLowerCase() === title.toLowerCase()) || this.availablePlans()[0];
          if (plan) planId = plan.id;
        }
      } catch (e) {
        console.error('Error creating new provider plan', e);
      }
    }

    if (!planId || planId <= 0) {
      this.alertService.toastError('Please select a valid treatment plan.');
      return;
    }

    const planPrice = plan?.price ?? this.newPlanPrice();
    const payType = this.newPlanPaymentType();
    const payMethod = this.newPlanPaymentMode();
    const adv = this.newPlanAdvance();
    const due = this.assignBalanceDue();

    let paymentStatus = 'Due';
    let paidAmount = 0;
    if (payType === 'full') {
      paymentStatus = 'Paid';
      paidAmount = planPrice;
    } else if (payType === 'advance') {
      paymentStatus = due === 0 ? 'Paid' : 'PartiallyPaid';
      paidAmount = adv;
    } else {
      paymentStatus = 'Due';
      paidAmount = 0;
    }

    const payload: UserSubscriptionViewModel = {
      id: 0,
      userId: (patientItem as any)?.userId ?? 0,
      providerId: plan?.providerId ?? 0,
      clinicId: 0,
      practitionerId: 0,
      providerType: plan?.providerType || 'Practitioner',
      planId: planId,
      planName: plan?.planName || this.newPlanTitle(),
      price: planPrice,
      validityDays: plan?.validityDays ?? ((this.newPlanWeeks() || 4) * 7),
      providerName: this.auth.getCurrentUser()?.fullName || '',
      totalSessions: plan?.totalSessions ?? this.newPlanSessions(),
      completedSessions: 0,
      remainingSessions: plan?.totalSessions ?? this.newPlanSessions(),
      isCurrent: true,
      status: 'Active',
      startDate: new Date().toISOString(),
      endDate: null,
      daysRemaining: plan?.validityDays ?? ((this.newPlanWeeks() || 4) * 7),
      patientId: patientId,
      paymentType: payType,
      paymentMethod: payMethod,
      paymentMode: payMethod,
      paymentStatus: paymentStatus,
      amount: paidAmount > 0 ? paidAmount : planPrice
    };

    this.isAssigningPlan.set(true);
    try {
      const res = await this.apiService.Post<any>(ApiEndPoints.AddUserSubscription, payload);
      if (res?.isSuccess) {
        this.alertService.toastSuccess('Subscription plan assigned to patient successfully.');

        const planCode = `PLN-${planId}`;
        const title = payload.planName || 'Treatment Plan';
        const totalSessions = payload.totalSessions || 1;
        const durationWeeks = Math.ceil((payload.validityDays || 28) / 7);

        const localPlan: DoctorTreatmentPlan = {
          id: planCode,
          planCode,
          title,
          patientId: pt ? pt.id : `PT-${patientId}`,
          patientName: pt?.fullName || patientItem?.fullName || '',
          diagnosis: pt?.primaryCondition || 'Physiotherapy Treatment',
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

        this.treatmentPlans.update(list => [localPlan, ...list]);
        if (pt) {
          this.patients.update(list =>
            list.map(p => p.id === pt.id ? { ...p, currentPlan: title, totalSessions, sessionsCompleted: 0 } : p)
          );
          this.selectedPatient.set({ ...pt, currentPlan: title, totalSessions, sessionsCompleted: 0 });
        }

        await this.loadPatientSubscription(patientId);
        await this.loadPatientAppointments(patientId);
        this.expandedPlanId.set(localPlan.id);
        this.initWeeklyDraft();
        this.activeTab.set('weekly');
      } else {
        this.alertService.toastError(res?.message || 'Failed to assign plan.');
      }
    } catch (err: any) {
      console.error('Error in AddUserSubscription', err);
      this.alertService.toastError(err?.message || 'Unable to assign subscription. Please try again.');
    } finally {
      this.isAssigningPlan.set(false);
    }
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
}
