import { Component, OnInit, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { ApiEndPoints } from '../../../helper/api-endpoints';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { PatientConsultancyDetails } from '../../../models/doctor-dashboard.model';

@Component({
  selector: 'app-consultancy-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './consultancy-list.html',
  styleUrl: './consultancy-list.css',
})
export class ConsultancyList implements OnInit {
  readonly Math = Math;
  private apiService = inject(ApiService);
  private alertService = inject(SweetAlertService);
  private router = inject(Router);

  // Events emitted to parent (if hosted inside doctordashboard tabs)
  readonly backToDashboard = output<void>();
  readonly startConsultation = output<PatientConsultancyDetails>();

  // Data signals
  consultancies = signal<PatientConsultancyDetails[]>([]);
  isLoading = signal<boolean>(false);

  // Filters
  searchQuery = signal<string>('');
  statusFilter = signal<string>('all');
  paymentFilter = signal<string>('all');
  dateRangePreset = signal<'today' | 'week' | 'month' | 'all'>('all');
  customFromDate = signal<string>('');
  customToDate = signal<string>('');

  // Selected item for payment modal
  selectedPaymentItem = signal<PatientConsultancyDetails | null>(null);
  paymentAmount = signal<number>(1000);
  paymentMode = signal<string>('Cash');
  paymentStatusInput = signal<string>('Paid');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Computed filtered list
  filteredConsultancies = computed<PatientConsultancyDetails[]>(() => {
    const list = this.consultancies();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const payment = this.paymentFilter();

    return list.filter(item => {
      // Search match
      const nameMatch = !query ||
        (item.fullName && item.fullName.toLowerCase().includes(query)) ||
        (item.mobile && item.mobile.includes(query)) ||
        (item.patientId && String(item.patientId).includes(query));

      // Status match
      let statusMatch = true;
      if (status !== 'all') {
        statusMatch = (item.consultancyStatus || '').toLowerCase() === status.toLowerCase();
      }

      // Payment match
      let paymentMatch = true;
      if (payment !== 'all') {
        const itemPay = (item.paymentStatus || 'pending').toLowerCase();
        if (payment === 'paid') paymentMatch = itemPay === 'paid';
        else if (payment === 'unpaid' || payment === 'pending') paymentMatch = itemPay !== 'paid';
      }

      return nameMatch && statusMatch && paymentMatch;
    });
  });

  // KPI Metrics computed
  totalCount = computed(() => this.consultancies().length);
  todayCount = computed(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return this.consultancies().filter(c => c.consultancyDate && c.consultancyDate.slice(0, 10) === todayStr).length;
  });
  completedCount = computed(() => {
    return this.consultancies().filter(c => (c.consultancyStatus || '').toLowerCase() === 'completed').length;
  });
  pendingPaymentAmount = computed(() => {
    return this.consultancies()
      .filter(c => (c.paymentStatus || '').toLowerCase() !== 'paid')
      .reduce((sum, c) => sum + (c.fees || 0), 0);
  });
  pendingPaymentCount = computed(() => {
    return this.consultancies().filter(c => (c.paymentStatus || '').toLowerCase() !== 'paid').length;
  });

  // Paged list
  totalPages = computed(() => {
    const count = this.filteredConsultancies().length;
    return Math.max(1, Math.ceil(count / this.pageSize()));
  });

  pagedConsultancies = computed(() => {
    const list = this.filteredConsultancies();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadConsultancies();
  }

  setDatePreset(preset: 'today' | 'week' | 'month' | 'all'): void {
    this.dateRangePreset.set(preset);
    this.currentPage.set(1);
    this.loadConsultancies();
  }

  async loadConsultancies(): Promise<void> {
    this.isLoading.set(true);

    let fromDate: string | undefined;
    let toDate: string | undefined;

    const now = new Date();

    const payload = {
      page: 1,
      pageSize: 500, // retrieve list for filtering & sorting
      fromDate,
      toDate,
    };

    try {
      const res = await this.apiService.Post<PatientConsultancyDetails[]>(
        ApiEndPoints.ConsultancyPatient,
        payload
      );

      if (res && res.isSuccess && Array.isArray(res.data)) {
        this.consultancies.set(res.data);
      } else {
        this.consultancies.set([]);
      }
    } catch (err) {
      console.error('Error loading consultancies:', err);
      this.alertService.toastError('Failed to load consultancy list.');
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
    this.router.navigate(['/doctor-dashboard']);
  }

  openPayment(item: PatientConsultancyDetails): void {
    this.selectedPaymentItem.set(item);
    this.paymentAmount.set(item.fees || 1000);
    this.paymentStatusInput.set(item.paymentStatus || 'Paid');
  }

  confirmPayment(): void {
    const item = this.selectedPaymentItem();
    if (!item) return;

    // Update in local state
    this.consultancies.update(list =>
      list.map(c =>
        c.patientId === item.patientId
          ? { ...c, paymentStatus: this.paymentStatusInput(), fees: this.paymentAmount() }
          : c
      )
    );
    this.alertService.toastSuccess('Payment status updated successfully!');
  }
}
