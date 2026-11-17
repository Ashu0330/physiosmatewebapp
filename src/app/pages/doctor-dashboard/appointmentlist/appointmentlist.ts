import { Component, OnInit, inject, signal, computed, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { ApiEndPoints } from '../../../helper/api-endpoints';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import {
  TodayAppointmentScheduleItem,
  AppointmentAddOnItem,
  PaymentSelectableItem,
  PaymentModel,
  PaymentAddOnModel
} from '../../../models/doctor-dashboard.model';
import { SharedModule } from '../../../shared/shared-module';

@Component({
  selector: 'app-appointmentlist',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './appointmentlist.html',
  styleUrl: './appointmentlist.css',
})
export class Appointmentlist implements OnInit {
  readonly Math = Math;
  private apiService = inject(ApiService);
  private alertService = inject(SweetAlertService);
  private router = inject(Router);

  // Events emitted to parent (if hosted inside tabs)
  readonly backToDashboard = output<void>();

  // Data signals
  appointments = signal<TodayAppointmentScheduleItem[]>([]);
  isLoading = signal<boolean>(false);
  isUpdatingPayment = signal<boolean>(false);

  // Filters
  searchQuery = signal<string>('');
  statusFilter = signal<string>('all');
  paymentFilter = signal<string>('all');
  dateRangePreset = signal<'today' | 'week' | 'month' | 'all'>('all');

  // Selected item for payment modal
  selectedPaymentItem = signal<TodayAppointmentScheduleItem | null>(null);
  paymentItems = signal<PaymentSelectableItem[]>([]);
  isPaymentDropdownOpen = signal<boolean>(false);
  activePaymentTarget = signal<'main' | 'addon'>('main');
  activePaymentId = signal<number | null>(null);
  activeServiceLabel = signal<string>('Treatment');
  paymentAmount = signal<number>(0);
  paymentMode = signal<string>('Cash');
  paymentStatusInput = signal<string>('Paid');

  isAllSelected = computed(() => {
    const unpaid = this.paymentItems().filter(x => !x.isAlreadyPaid);
    return unpaid.length > 0 && unpaid.every(x => x.selected);
  });

  selectedCount = computed(() => {
    return this.paymentItems().filter(x => x.selected).length;
  });

  totalUnpaidAmount = computed(() => {
    return this.paymentItems().filter(x => !x.isAlreadyPaid).reduce((s, x) => s + x.amount, 0);
  });

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Status & payment helpers
  isMainDue(item: TodayAppointmentScheduleItem): boolean {
    const s = item.paymentStatus?.trim().toLowerCase();
    return !s || s === 'due' || s === 'pending' || s === 'unpaid' || s === 'partiallypaid';
  }

  isIndividualAddOnDue(addon: AppointmentAddOnItem): boolean {
    const s = (addon.paymentStatus || '').trim().toLowerCase();
    return !s || s === 'due' || s === 'pending' || s === 'unpaid';
  }

  isAddOnDue(item: TodayAppointmentScheduleItem): boolean {
    if (item.addOns && item.addOns.length > 0) {
      return item.addOns.some(a => this.isIndividualAddOnDue(a));
    }
    if (!item.hasAddOnTreatment) return false;
    const s = item.addOnPaymentStatus?.trim().toLowerCase();
    return !s || s === 'due' || s === 'pending' || s === 'unpaid';
  }

  isBothPaid(item: TodayAppointmentScheduleItem): boolean {
    const mainPaid = item.paymentStatus?.trim().toLowerCase() === 'paid' || item.paymentStatus?.trim().toLowerCase() === 'success';
    if (!mainPaid) return false;
    if (item.addOns && item.addOns.length > 0) {
      return item.addOns.every(a => {
        const s = (a.paymentStatus || '').trim().toLowerCase();
        return s === 'paid' || s === 'success';
      });
    }
    if (!item.hasAddOnTreatment) {
      return !!mainPaid;
    }
    const addOnPaid = item.addOnPaymentStatus?.trim().toLowerCase() === 'paid' || item.addOnPaymentStatus?.trim().toLowerCase() === 'success';
    return !!mainPaid && !!addOnPaid;
  }

  // Computed filtered list
  filteredAppointments = computed<TodayAppointmentScheduleItem[]>(() => {
    const list = this.appointments();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const payment = this.paymentFilter();

    return list.filter(item => {
      // Search match (name, mobile, patient ID, appointment ID)
      const nameMatch = !query ||
        (item.fullName && item.fullName.toLowerCase().includes(query)) ||
        (item.mobile && item.mobile.includes(query)) ||
        (item.patientId && String(item.patientId).includes(query)) ||
        (item.appointmentId && String(item.appointmentId).includes(query));

      // Status match
      let statusMatch = true;
      if (status !== 'all') {
        statusMatch = (item.appointmentStatus || '').toLowerCase() === status.toLowerCase();
      }

      // Payment match
      let paymentMatch = true;
      if (payment === 'paid') {
        paymentMatch = this.isBothPaid(item);
      } else if (payment === 'unpaid') {
        paymentMatch = !this.isBothPaid(item);
      } else if (payment === 'addon-due') {
        paymentMatch = this.isAddOnDue(item);
      }

      return nameMatch && statusMatch && paymentMatch;
    });
  });

  // KPI Metrics computed
  totalCount = computed(() => this.appointments().length);

  todayCount = computed(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return this.appointments().filter(a => a.appointmentDate && a.appointmentDate.slice(0, 10) === todayStr).length;
  });

  completedCount = computed(() => {
    return this.appointments().filter(a => (a.appointmentStatus || '').toLowerCase() === 'completed').length;
  });

  pendingPaymentAmount = computed(() => {
    return this.appointments().reduce((sum, a) => {
      let extra = 0;
      if (this.isMainDue(a)) {
        extra += (a.fees || 0);
      }
      if (this.isAddOnDue(a)) {
        extra += (a.addOnFees || 0);
      }
      return sum + extra;
    }, 0);
  });

  pendingPaymentCount = computed(() => {
    return this.appointments().filter(a => !this.isBothPaid(a)).length;
  });

  // Paged list
  totalPages = computed(() => {
    const count = this.filteredAppointments().length;
    return Math.max(1, Math.ceil(count / this.pageSize()));
  });

  pagedAppointments = computed(() => {
    const list = this.filteredAppointments();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadAppointments();
  }

  setDatePreset(preset: 'today' | 'week' | 'month' | 'all'): void {
    this.dateRangePreset.set(preset);
    this.currentPage.set(1);
    this.loadAppointments();
  }

  async loadAppointments(): Promise<void> {
    this.isLoading.set(true);

    let fromDate: string | undefined;
    let toDate: string | undefined;

    const preset = this.dateRangePreset();
    const now = new Date();

    if (preset === 'today') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    } else if (preset === 'week') {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      fromDate = monday.toISOString();
      toDate = sunday.toISOString();
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      fromDate = firstDay.toISOString();
      toDate = lastDay.toISOString();
    }

    const payload = {
      page: 1,
      pageSize: 100,
      fromDate,
      toDate,
    };

    try {
      const res = await this.apiService.Post<TodayAppointmentScheduleItem[]>(
        ApiEndPoints.GetPractitionerAppointments,
        payload
      );

      if (res && res.isSuccess && Array.isArray(res.data)) {
        this.appointments.set(res.data);
      } else {
        this.appointments.set([]);
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
      this.alertService.toastError('Failed to load appointments list.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getInitials(name: string): string {
    if (!name) return 'PT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  goToDashboard(): void {
    this.backToDashboard.emit();
    this.router.navigate(['/doctor-dashboard/dashboard']);
  }

  toggleSelectAll(checked: boolean): void {
    this.paymentItems.update(items =>
      items.map(it => it.isAlreadyPaid ? it : { ...it, selected: checked })
    );
    this.recalculatePaymentAmount();
  }

  toggleItem(item: PaymentSelectableItem): void {
    if (item.isAlreadyPaid) return;
    this.paymentItems.update(items =>
      items.map(it => it.id === item.id && it.isTreatment === item.isTreatment ? { ...it, selected: !it.selected } : it)
    );
    this.recalculatePaymentAmount();
  }

  recalculatePaymentAmount(): void {
    const total = this.paymentItems().filter(x => x.selected).reduce((s, x) => s + x.amount, 0);
    this.paymentAmount.set(total);
  }

  getDropdownTriggerText(): string {
    const items = this.paymentItems();
    if (!items || items.length === 0) return 'Select item to update';
    if (this.isAllSelected()) {
      return `All Pending Payments (₹${this.totalUnpaidAmount().toLocaleString()})`;
    }
    const selected = items.filter(x => x.selected);
    if (selected.length === 1) {
      const it = selected[0];
      return `${it.name} – ₹${it.amount.toLocaleString()} (${it.isAlreadyPaid ? 'Paid' : 'Due'})`;
    }
    if (selected.length > 1) {
      return `${selected.length} items selected (₹${this.paymentAmount().toLocaleString()})`;
    }
    return 'Select item to update';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isPaymentDropdownOpen()) {
      const target = event.target as HTMLElement;
      if (target && !target.closest('.payment-select-container')) {
        this.isPaymentDropdownOpen.set(false);
      }
    }
  }

  openPayment(
    item: TodayAppointmentScheduleItem,
    target: 'main' | 'addon' | 'all' = 'main',
    specificAddon?: AppointmentAddOnItem
  ): void {
    this.selectedPaymentItem.set(item);
    this.isPaymentDropdownOpen.set(false);

    const items: PaymentSelectableItem[] = [];

    // Main treatment fee
    const isMainPaid = !this.isMainDue(item);
    items.push({
      id: item.paymentId ?? 0,
      name: 'Treatment Fee',
      amount: item.fees ?? 0,
      isTreatment: true,
      isAlreadyPaid: isMainPaid,
      selected: false
    });

    // Addons
    if (item.addOns && item.addOns.length > 0) {
      item.addOns.forEach(addon => {
        const isAddonPaid = !this.isIndividualAddOnDue(addon);
        items.push({
          id: addon.paymentId ?? 0,
          name: addon.addOnName || 'Add-on Treatment',
          amount: addon.amount ?? 0,
          isTreatment: false,
          isAlreadyPaid: isAddonPaid,
          selected: false
        });
      });
    } else if (item.hasAddOnTreatment && (item.addOnFees ?? 0) > 0) {
      const isAddonPaid = !this.isAddOnDue(item);
      items.push({
        id: item.addOnPaymentId ?? 0,
        name: 'Add-on Treatment',
        amount: item.addOnFees ?? 0,
        isTreatment: false,
        isAlreadyPaid: isAddonPaid,
        selected: false
      });
    }

    // Set initial selection
    if (target === 'all') {
      items.forEach(it => { if (!it.isAlreadyPaid) it.selected = true; });
    } else if (target === 'addon' && specificAddon) {
      const match = items.find(it => !it.isTreatment && it.id === specificAddon.paymentId);
      if (match) match.selected = true;
      else {
        const firstUnpaidAddon = items.find(it => !it.isTreatment && !it.isAlreadyPaid);
        if (firstUnpaidAddon) firstUnpaidAddon.selected = true;
      }
    } else if (target === 'addon') {
      const firstUnpaidAddon = items.find(it => !it.isTreatment && !it.isAlreadyPaid);
      if (firstUnpaidAddon) firstUnpaidAddon.selected = true;
    } else {
      const mainIt = items.find(it => it.isTreatment);
      if (mainIt && !mainIt.isAlreadyPaid) {
        mainIt.selected = true;
      } else {
        const firstUnpaid = items.find(it => !it.isAlreadyPaid);
        if (firstUnpaid) firstUnpaid.selected = true;
      }
    }

    this.paymentItems.set(items);

    const isAddon = target === 'addon';
    const paymentId = isAddon
      ? (specificAddon?.paymentId ?? item.addOnPaymentId)
      : item.paymentId;
    const currentStatus = isAddon
      ? (specificAddon?.paymentStatus ?? item.addOnPaymentStatus)
      : item.paymentStatus;
    const serviceLabel = items.length > 1 ? 'Treatment & Add-ons' : 'Treatment';

    this.activePaymentTarget.set(isAddon ? 'addon' : 'main');
    this.activePaymentId.set(paymentId ?? null);
    this.activeServiceLabel.set(serviceLabel);
    this.paymentStatusInput.set('Paid');
    this.paymentMode.set(specificAddon?.paymentMethod || item.paymentMethod || 'Cash');

    this.recalculatePaymentAmount();
  }

  async confirmPayment(): Promise<void> {
    const item = this.selectedPaymentItem();
    const pItems = this.paymentItems();
    const status = this.paymentStatusInput()?.trim();

    if (!status) {
      this.alertService.toastWarning('Please select a payment status.');
      return;
    }

    const method = this.paymentMode();
    let payload: PaymentModel;

    if (item && pItems.length > 1) {
      const selected = pItems.filter(x => x.selected);
      if (selected.length === 0) {
        this.alertService.toastWarning('Please select at least one item to update.');
        return;
      }

      const treatmentItem = selected.find(x => x.isTreatment);
      const addOnItems = selected.filter(x => !x.isTreatment);

      if (treatmentItem) {
        payload = {
          paymentId: treatmentItem.id,
          amount: treatmentItem.amount,
          status: status,
          paymentMethod: method,
          addOns: addOnItems.map(ao => ({
            paymentId: ao.id,
            amount: ao.amount,
            status: status,
            paymentMethod: method
          }))
        };
      } else {
        const firstAddon = addOnItems[0];
        const remainingAddons = addOnItems.slice(1);
        payload = {
          paymentId: firstAddon.id,
          amount: firstAddon.amount,
          status: status,
          paymentMethod: method,
          addOns: remainingAddons.map(ao => ({
            paymentId: ao.id,
            amount: ao.amount,
            status: status,
            paymentMethod: method
          }))
        };
      }
    } else {
      const paymentId = this.activePaymentId();
      if (!paymentId) {
        this.alertService.toastError('No linked payment transaction found.');
        return;
      }
      const amount = this.paymentAmount();
      payload = {
        paymentId: paymentId,
        amount: amount > 0 ? amount : (item?.fees ?? 0),
        status: status,
        paymentMethod: method,
        addOns: []
      };
    }

    this.isUpdatingPayment.set(true);
    try {
      const res = await this.apiService.Post<any>(
        ApiEndPoints.UpdatePayment,
        payload
      );

      if (res && res.isSuccess) {
        const updatedIds = new Set<number>();
        if (payload.paymentId) updatedIds.add(payload.paymentId);
        if (payload.addOns) {
          payload.addOns.forEach(ao => { if (ao.paymentId) updatedIds.add(ao.paymentId); });
        }

        this.appointments.update(list =>
          list.map(a => {
            let updatedA = { ...a };
            if (a.paymentId && updatedIds.has(a.paymentId)) {
              updatedA = { ...updatedA, paymentStatus: status, paymentMethod: method };
            }
            if (a.addOnPaymentId && updatedIds.has(a.addOnPaymentId)) {
              updatedA = { ...updatedA, addOnPaymentStatus: status };
            }
            if (a.addOns && a.addOns.length > 0) {
              updatedA = {
                ...updatedA,
                addOns: a.addOns.map(ao =>
                  ao.paymentId && updatedIds.has(ao.paymentId)
                    ? { ...ao, paymentStatus: status, paymentMethod: method }
                    : ao
                )
              };
            }
            return updatedA;
          })
        );

        this.alertService.toastSuccess('Payment status updated successfully!');
        this.loadAppointments();
      } else {
        this.alertService.toastError(res?.message || 'Failed to update payment.');
      }
    } catch (err) {
      console.error('Error updating payment:', err);
      this.alertService.toastError('Unable to update payment. Please try again.');
    } finally {
      this.isUpdatingPayment.set(false);
    }
  }
}
