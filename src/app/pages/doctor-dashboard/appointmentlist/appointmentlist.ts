import { Component, OnInit, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { ApiEndPoints } from '../../../helper/api-endpoints';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { TodayAppointmentScheduleItem } from '../../../models/doctor-dashboard.model';
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
  activePaymentTarget = signal<'main' | 'addon'>('main');
  activePaymentId = signal<number | null>(null);
  activeServiceLabel = signal<string>('Treatment');
  paymentAmount = signal<number>(0);
  paymentMode = signal<string>('Cash');
  paymentStatusInput = signal<string>('Paid');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Status & payment helpers
  isMainDue(item: TodayAppointmentScheduleItem): boolean {
    const s = item.paymentStatus?.trim().toLowerCase();
    return !s || s === 'due' || s === 'pending' || s === 'unpaid' || s === 'partiallypaid';
  }

  isAddOnDue(item: TodayAppointmentScheduleItem): boolean {
    if (!item.hasAddOnTreatment) return false;
    const s = item.addOnPaymentStatus?.trim().toLowerCase();
    return !s || s === 'due' || s === 'pending' || s === 'unpaid';
  }

  isBothPaid(item: TodayAppointmentScheduleItem): boolean {
    const mainPaid = item.paymentStatus?.trim().toLowerCase() === 'paid' || item.paymentStatus?.trim().toLowerCase() === 'success';
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

  openPayment(item: TodayAppointmentScheduleItem, target: 'main' | 'addon' = 'main'): void {
    this.selectedPaymentItem.set(item);
    this.activePaymentTarget.set(target);

    const isAddon = target === 'addon';
    const paymentId = isAddon ? item.addOnPaymentId : item.paymentId;
    const currentStatus = isAddon ? item.addOnPaymentStatus : item.paymentStatus;
    const currentFees = isAddon ? (item.addOnFees ?? 0) : (item.fees ?? 0);
    const serviceLabel = isAddon ? 'Add-on Treatment' : 'Treatment';

    this.activePaymentId.set(paymentId ?? null);
    this.activeServiceLabel.set(serviceLabel);
    this.paymentAmount.set(currentFees);
    this.paymentStatusInput.set(currentStatus && currentStatus !== 'Pending' ? currentStatus : 'Paid');
    this.paymentMode.set('Cash');
  }

  async confirmPayment(): Promise<void> {
    const item = this.selectedPaymentItem();
    const paymentId = this.activePaymentId();
    const status = this.paymentStatusInput();
    const amount = this.paymentAmount();
    const target = this.activePaymentTarget();

    if (!paymentId) {
      this.alertService.toastError('No linked payment transaction found.');
      return;
    }

    if (!status) {
      this.alertService.toastWarning('Please select a payment status.');
      return;
    }

    this.isUpdatingPayment.set(true);
    try {
      const params = new URLSearchParams();
      params.set('paymentId', String(paymentId));
      params.set('paymentStatus', status);

      if (this.paymentMode()) {
        params.set('paymentMethod', this.paymentMode());
      }

      if (amount > 0) {
        params.set('amount', String(amount));
      }

      const res = await this.apiService.Put<any>(
        `${ApiEndPoints.UpdatePayment}?${params.toString()}`,
        {}
      );

      if (res && res.isSuccess) {
        // Update item in local state immediately
        this.appointments.update(list =>
          list.map(a => {
            if (target === 'addon' && a.addOnPaymentId === paymentId) {
              return { ...a, addOnPaymentStatus: status, addOnFees: amount };
            }
            if (target === 'main' && a.paymentId === paymentId) {
              return { ...a, paymentStatus: status, fees: amount };
            }
            return a;
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
