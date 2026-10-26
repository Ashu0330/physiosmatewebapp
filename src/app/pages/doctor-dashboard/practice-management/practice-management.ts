import { Component, OnInit, signal } from '@angular/core';
import { BaseComponent } from '../../../helper/base-component';
import { ApiEndPoints } from '../../../helper/api-endpoints';
import { Availability, slots } from '../../../models/practitioner.model';
import { SharedModule } from '../../../shared/shared-module';
import { PlanBenefit, ProviderAddon, ProviderPlan } from '../../../models/mastermodel';

export interface AvailabilitySlot {
  id: number;
  providerType: string;
  providerId: number;
  dayOfWeekName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isActive: boolean;
}

@Component({
  selector: 'app-practice-management',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './practice-management.html',
  styleUrl: './practice-management.css',
})
export class PracticeManagement extends BaseComponent implements OnInit {
  activeTab: string = 'Availability';
  availabilitySlots = signal<Availability[]>([]);

  // ── Appointment Slots ──────────────────────────────────────────────
  appointmentSlots = signal<AvailabilitySlot[]>([]);
  appointmentSlotsByDay: { dayName: string; dayOfWeek: number; slots: AvailabilitySlot[] }[] = [];
  showAppointmentSlotForm: boolean = true;
  editingAppointmentSlotId: number = 0;
  apptSlotDay: number = 1;
  apptSlotStartTime: string = '09:00:00';
  apptSlotEndTime: string = '10:00:00';
  apptSlotMaxCapacity: number = 1;
  apptSlotIsActive: boolean = true;
  isLoadingAppointmentSlots: boolean = false;
  isSavingAppointmentSlot: boolean = false;

  // ── Subscription Plans ─────────────────────────────────────────────
  providerPlans: ProviderPlan[] = [];
  showPlanForm: boolean = true;
  editingPlanId: number = 0;
  planName: string = '';
  planTotalSessions: number = 10;
  planValidityDays: number = 30;
  planPrice: number = 0;
  planIsPopular: boolean = false;
  planIsActive: boolean = true;
  planBenefitsInput: string = '';  // newline-separated input
  isLoadingPlans: boolean = false;
  isSavingPlan: boolean = false;

  // ── Add-on Services ────────────────────────────────────────────────
  addons: ProviderAddon[] = [];
  showAddonForm: boolean = true;
  editingAddonId: number = 0;
  addonName: string = '';
  addonPrice: number = 0;
  isLoadingAddons: boolean = false;
  isSavingAddon: boolean = false;

  tabs: string[] = [
    'Availability',
    'Appointment Slots',
    'Subscription Plans',
    'Add-on Services'
  ];

  daysList = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    { id: 7, name: 'Sunday' },
  ];

  timeOptions = [
    { label: '08:00 AM', value: '08:00:00' },
    { label: '08:30 AM', value: '08:30:00' },
    { label: '09:00 AM', value: '09:00:00' },
    { label: '09:30 AM', value: '09:30:00' },
    { label: '10:00 AM', value: '10:00:00' },
    { label: '10:30 AM', value: '10:30:00' },
    { label: '11:00 AM', value: '11:00:00' },
    { label: '11:30 AM', value: '11:30:00' },
    { label: '12:00 PM', value: '12:00:00' },
    { label: '12:30 PM', value: '12:30:00' },
    { label: '01:00 PM', value: '13:00:00' },
    { label: '01:30 PM', value: '13:30:00' },
    { label: '02:00 PM', value: '14:00:00' },
    { label: '02:30 PM', value: '14:30:00' },
    { label: '03:00 PM', value: '15:00:00' },
    { label: '03:30 PM', value: '15:30:00' },
    { label: '04:00 PM', value: '16:00:00' },
    { label: '04:30 PM', value: '16:30:00' },
    { label: '05:00 PM', value: '17:00:00' },
    { label: '05:30 PM', value: '17:30:00' },
    { label: '06:00 PM', value: '18:00:00' },
    { label: '06:30 PM', value: '18:30:00' },
    { label: '07:00 PM', value: '19:00:00' },
    { label: '07:30 PM', value: '19:30:00' },
    { label: '08:00 PM', value: '20:00:00' },
  ];

  showAddForm: boolean = true;
  editingSlotId: number = 0;
  selectedDay: number = 1;
  startTime: string = '09:30:00';
  endTime: string = '10:00:00';
  isActive: boolean = true;

  isLoading: boolean = false;
  isSaving: boolean = false;

  get practitionerId(): number {
    const user = this.currentUser;
    const profId = this.authService.getCurrentProfessionalId();
    return Number(user?.practitionerId || profId || user?.id || 1);
  }

  ngOnInit(): void {
    this.loadAvailability();
    this.loadAppointmentSlots();
    this.loadProviderPlans();
    this.loadAddons();
  }

  // ─── Availability ──────────────────────────────────────────────────

  async loadAvailability(): Promise<void> {
    this.isLoading = true;
    try {
      const pid = this.practitionerId;
      const res = await this.apiService.Get<any>(
        `${ApiEndPoints.GetAvailability}?practitionerId=${pid}`
      );
      if (res && res.isSuccess) {
        const raw = res.data;
        if (Array.isArray(raw)) {
          this.availabilitySlots.set(raw);
        } else if (raw && Array.isArray(raw.slots)) {
          this.availabilitySlots.set(raw.slots);
        } else {
          this.availabilitySlots.set([]);
        }
      } else {
        this.availabilitySlots.set([]);
      }
    } catch (e) {
      console.error('Error loading availability', e);
      this.availabilitySlots.set([]);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.editingSlotId = 0;
    this.selectedDay = 1;
    this.startTime = '09:30:00';
    this.endTime = '10:00:00';
    this.isActive = true;
  }

  async onSaveSlot(): Promise<void> {
    if (!this.selectedDay || !this.startTime || !this.endTime) {
      this.showError('Please select day, start time and end time.');
      return;
    }
    if (this.startTime >= this.endTime) {
      this.showError('End time must be after start time.');
      return;
    }
    this.isSaving = true;
    try {
      const payload = {
        practitionerId: this.practitionerId,
        id: Number(this.editingSlotId || 0),
        dayOfWeek: Number(this.selectedDay),
        startTime: this.startTime,
        endTime: this.endTime,
        isActive: this.isActive
      };
      const res = await this.apiService.Post<any>(ApiEndPoints.AddAvailability, payload);
      if (res && (res.isSuccess || res.data)) {
        this.showSuccess('Availability slot saved successfully!');
        await this.loadAvailability();
        this.resetForm();
      } else {
        this.showError(res?.message || 'Failed to save availability slot.');
      }
    } catch (e: any) {
      console.error('Save slot error', e);
      this.showError('Error saving slot. Please try again.');
    } finally {
      this.isSaving = false;
    }
  }

  onEditSlot(day: Availability, slot: slots): void {
    this.editingSlotId = slot.id || 0;
    this.selectedDay = day.dayOfWeek;
    this.startTime = this.normalizeTime(slot.startTime);
    this.endTime = this.normalizeTime(slot.endTime);
    this.isActive = slot.isActive !== false;
    this.showAddForm = true;
  }

  getDayName(dayNumber: number): string {
    const day = this.daysList.find(d => d.id === Number(dayNumber));
    if (day) return day.name;
    if (dayNumber === 0 || dayNumber === 7) return 'Sunday';
    return 'Monday';
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] || '00';
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hrsStr = hours < 10 ? '0' + hours : '' + hours;
    return `${hrsStr}:${minutes} ${ampm}`;
  }

  calculateDuration(startTime: string, endTime: string): string {
    if (!startTime || !endTime) return '30 min';
    const s = startTime.split(':').map(Number);
    const e = endTime.split(':').map(Number);
    let startMin = (s[0] || 0) * 60 + (s[1] || 0);
    let endMin = (e[0] || 0) * 60 + (e[1] || 0);
    let diff = endMin - startMin;
    if (diff <= 0) return '30 min';
    if (diff < 60) return `${diff} min`;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
  }

  private normalizeTime(t: string): string {
    if (!t) return '09:30:00';
    const parts = t.split(':');
    const hh = (parts[0] || '00').padStart(2, '0');
    const mm = (parts[1] || '00').padStart(2, '0');
    const ss = (parts[2] || '00').padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  // ─── Appointment Slots ─────────────────────────────────────────────

  async loadAppointmentSlots(): Promise<void> {
    this.isLoadingAppointmentSlots = true;
    try {
      const pid = this.practitionerId;
      const res = await this.apiService.Get<any>(
        `${ApiEndPoints.GetAppointmentSlots}?providerId=${pid}&providerType=Practitioner`
      );
      if (res && res.isSuccess && Array.isArray(res.data)) {
        this.appointmentSlots.set(res.data);
        this.groupAppointmentSlotsByDay(res.data);
      } else {
        this.appointmentSlots.set([]);
        this.appointmentSlotsByDay = [];
      }
    } catch (e) {
      console.error('Error loading appointment slots', e);
      this.appointmentSlots.set([]);
      this.appointmentSlotsByDay = [];
    } finally {
      this.isLoadingAppointmentSlots = false;
      this.cdr.detectChanges();
    }
  }

  private groupAppointmentSlotsByDay(slots: AvailabilitySlot[]): void {
    const map = new Map<number, AvailabilitySlot[]>();
    for (const slot of slots) {
      if (!map.has(slot.dayOfWeek)) map.set(slot.dayOfWeek, []);
      map.get(slot.dayOfWeek)!.push(slot);
    }
    this.appointmentSlotsByDay = Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([day, daySlots]) => ({
        dayOfWeek: day,
        dayName: daySlots[0]?.dayOfWeekName || this.getDayName(day),
        slots: daySlots
      }));
  }

  async createAppointmentSlot(): Promise<void> {
    if (!this.apptSlotDay || !this.apptSlotStartTime || !this.apptSlotEndTime) {
      this.showError('Please select day, start time and end time.');
      return;
    }
    if (this.apptSlotStartTime >= this.apptSlotEndTime) {
      this.showError('End time must be after start time.');
      return;
    }
    if (this.apptSlotMaxCapacity < 1) {
      this.showError('Max capacity must be at least 1.');
      return;
    }
    this.isSavingAppointmentSlot = true;
    try {
      const now = new Date().toISOString();
      const payload = {
        id: this.editingAppointmentSlotId,
        dayOfWeek: Number(this.apptSlotDay),
        startTime: this.apptSlotStartTime,
        endTime: this.apptSlotEndTime,
        maxCapacity: Number(this.apptSlotMaxCapacity),
        isActive: this.apptSlotIsActive,
        createdAt: now,
        updatedAt: now,
        providerType: 'Practitioner',
        providerId: this.practitionerId
      };
      const res = await this.apiService.Post<any>(ApiEndPoints.CreateAppointmentSlot, payload);
      if (res && res.isSuccess) {
        this.showSuccess(res.message || (this.editingAppointmentSlotId ? 'Slot updated.' : 'Slot created.'));
        await this.loadAppointmentSlots();
        this.resetAppointmentSlotForm();
      } else {
        this.showError(res?.message || 'Failed to save appointment slot.');
      }
    } catch (e: any) {
      console.error('Create appointment slot error', e);
      this.showError('Error saving slot. Please try again.');
    } finally {
      this.isSavingAppointmentSlot = false;
    }
  }

  toggleAppointmentSlotForm(): void {
    this.showAppointmentSlotForm = !this.showAppointmentSlotForm;
    if (this.showAppointmentSlotForm && this.editingAppointmentSlotId === 0) {
      this.resetAppointmentSlotForm();
    }
  }

  resetAppointmentSlotForm(): void {
    this.editingAppointmentSlotId = 0;
    this.apptSlotDay = 1;
    this.apptSlotStartTime = '09:00:00';
    this.apptSlotEndTime = '10:00:00';
    this.apptSlotMaxCapacity = 1;
    this.apptSlotIsActive = true;
  }

  onEditAppointmentSlot(slot: AvailabilitySlot): void {
    this.editingAppointmentSlotId = slot.id;
    this.apptSlotDay = slot.dayOfWeek;
    this.apptSlotStartTime = this.normalizeTime(slot.startTime);
    this.apptSlotEndTime = this.normalizeTime(slot.endTime);
    this.apptSlotMaxCapacity = slot.maxCapacity;
    this.apptSlotIsActive = slot.isActive;
    this.showAppointmentSlotForm = true;
  }

  // ─── Subscription Plans ────────────────────────────────────────────

  async loadProviderPlans(): Promise<void> {
    this.isLoadingPlans = true;
    try {
      const res = await this.apiService.Get<any>(
        `${ApiEndPoints.GetProviderPlans}`
      );
      if (res && res.isSuccess) {
        this.providerPlans = res.data;
      } else {
        this.providerPlans = [];
      }
    } catch (e) {
      console.error('Error loading provider plans', e);
      this.providerPlans = [];
    } finally {
      this.isLoadingPlans = false;
    }
  }

  async addProviderPlan(): Promise<void> {
    if (!this.planName?.trim()) {
      this.showError('Please enter a plan name.');
      return;
    }
    if (this.planPrice < 0) {
      this.showError('Price cannot be negative.');
      return;
    }
    if (this.planTotalSessions < 1) {
      this.showError('Total sessions must be at least 1.');
      return;
    }
    this.isSavingPlan = true;
    try {
      const benefits: string[] = this.planBenefitsInput
        .split('\n')
        .map((b: string) => b.trim())
        .filter((b: string) => b.length > 0);

      const payload = {
        id: this.editingPlanId,
        planName: this.planName.trim(),
        totalSessions: Number(this.planTotalSessions),
        validityDays: Number(this.planValidityDays),
        price: Number(this.planPrice),
        isPopular: this.planIsPopular,
        isActive: this.planIsActive,
        benefits
      };
      const res = await this.apiService.Post<any>(ApiEndPoints.AddProviderPlans, payload);
      if (res && res.isSuccess) {
        this.showSuccess(res.message || (this.editingPlanId ? 'Plan updated.' : 'Plan created.'));
        await this.loadProviderPlans();
        this.resetPlanForm();
      } else {
        this.showError(res?.message || 'Failed to save plan.');
      }
    } catch (e: any) {
      console.error('Add provider plan error', e);
      this.showError('Error saving plan. Please try again.');
    } finally {
      this.isSavingPlan = false;
    }
  }

  togglePlanForm(): void {
    this.showPlanForm = !this.showPlanForm;
    if (this.showPlanForm && this.editingPlanId === 0) {
      this.resetPlanForm();
    }
  }

  resetPlanForm(): void {
    this.editingPlanId = 0;
    this.planName = '';
    this.planTotalSessions = 10;
    this.planValidityDays = 30;
    this.planPrice = 0;
    this.planIsPopular = false;
    this.planIsActive = true;
    this.planBenefitsInput = '';
  }

  onEditPlan(plan: ProviderPlan): void {
    this.editingPlanId = plan.id;
    this.planName = plan.planName;
    this.planTotalSessions = plan.totalSessions;
    this.planValidityDays = plan.validityDays;
    this.planPrice = plan.price;
    this.planIsPopular = plan.isPopular;
    this.planIsActive = plan.isActive;
    this.planBenefitsInput = (plan.benefits || []).map((b: PlanBenefit) => b.benefitName).join('\n');
    this.showPlanForm = true;
  }

  // ─── Add-on Services ────────────────────────────────────────────

  async loadAddons(): Promise<void> {
    this.isLoadingAddons = true;
    try {
      const res = await this.apiService.Get<any>(ApiEndPoints.GetAllAddOns);
      if (res && res.isSuccess && res.data) {
        this.addons = res.data;
      } else {
        this.addons = [];
      }
    } catch (e) {
      console.error('Error loading add-ons', e);
      this.addons = [];
    } finally {
      this.isLoadingAddons = false;
    }
  }

  async addAddon(): Promise<void> {
    if (!this.addonName?.trim()) {
      this.showError('Please enter an add-on name.');
      return;
    }
    if (this.addonPrice < 0) {
      this.showError('Price cannot be negative.');
      return;
    }
    this.isSavingAddon = true;
    try {
      const payload = {
        id: this.editingAddonId,
        addOnName: this.addonName.trim(),
        price: Number(this.addonPrice),
      };
      const res = await this.apiService.Post<any>(ApiEndPoints.AddAddons, payload);
      if (res && res.isSuccess) {
        this.showSuccess(res.message || (this.editingAddonId ? 'Add-on updated.' : 'Add-on created.'));
        await this.loadAddons();
        this.resetAddonForm();
      } else {
        this.showError(res?.message || 'Failed to save add-on.');
      }
    } catch (e: any) {
      console.error('Add addon error', e);
      this.showError('Error saving add-on. Please try again.');
    } finally {
      this.isSavingAddon = false;
    }
  }

  toggleAddonForm(): void {
    this.showAddonForm = !this.showAddonForm;
    if (this.showAddonForm && this.editingAddonId === 0) {
      this.resetAddonForm();
    }
  }

  resetAddonForm(): void {
    this.editingAddonId = 0;
    this.addonName = '';
    this.addonPrice = 0;
  }

  onEditAddon(addon: ProviderAddon): void {
    this.editingAddonId = addon.id;
    this.addonName = addon.addOnName;
    this.addonPrice = addon.price;
    this.showAddonForm = true;
  }
}
