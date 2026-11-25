import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClinicRelationshipService } from '../../../services/clinic-relationship.service';
import { Authservice } from '../../../services/authservice';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { ClinicBranchDto } from '../../../models/clinic.model';

@Component({
  selector: 'app-clinic-branches',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clinic-branches.html',
  styleUrl: './clinic-branches.css'
})
export class ClinicBranches implements OnInit {
  private relationshipService = inject(ClinicRelationshipService);
  private authService = inject(Authservice);
  private alert = inject(SweetAlertService);
  private router = inject(Router);

  clinicId = signal<number>(0);
  clinicName = signal<string>('');
  branches = signal<ClinicBranchDto[]>([]);
  isLoading = signal<boolean>(false);
  searchTerm = signal<string>('');
  activeStatusFilter = signal<'all' | 'active' | 'inactive'>('all');

  totalCount = computed(() => this.branches().length);
  activeCount = computed(() => this.branches().filter(b => b.isActive).length);
  inactiveCount = computed(() => this.branches().filter(b => !b.isActive).length);

  filteredBranches = computed(() => {
    let list = this.branches();
    const filter = this.activeStatusFilter();
    const term = this.searchTerm().trim().toLowerCase();

    if (filter === 'active') {
      list = list.filter(b => b.isActive);
    } else if (filter === 'inactive') {
      list = list.filter(b => !b.isActive);
    }

    if (term) {
      list = list.filter(b =>
        (b.branchName && b.branchName.toLowerCase().includes(term)) ||
        (b.city && b.city.toLowerCase().includes(term)) ||
        (b.phone && b.phone.toLowerCase().includes(term)) ||
        (b.branchCode && b.branchCode.toLowerCase().includes(term)) ||
        (b.address && b.address.toLowerCase().includes(term))
      );
    }

    return list;
  });

  async ngOnInit(): Promise<void> {
    await this.resolveClinicInfo();
    if (this.clinicId() > 0) {
      await this.loadBranches();
    } else {
      this.alert.toastWarning('No active clinic detected for this account.');
    }
  }

  private async resolveClinicInfo(): Promise<void> {
    // 1. Direct from authService or user object (must be > 0)
    const directClinicId = Number(this.authService.getClinicId() || 0);
    if (directClinicId > 0) {
      this.clinicId.set(directClinicId);
      return;
    }

    const user = this.authService.getCurrentUser();
    const userClinicId = Number(user?.clinicId || user?.ClinicId || 0);
    if (userClinicId > 0) {
      this.clinicId.set(userClinicId);
      return;
    }

    const professionalId = Number(this.authService.getCurrentProfessionalId() || 0);
    if (this.authService.getRoleId() === 3 && professionalId > 0) {
      this.clinicId.set(professionalId);
      return;
    }

    // 2. Fallback: Always try workspace resolution from backend
    try {
      const res = await this.relationshipService.resolveWorkspaces();
      if (res.isSuccess && res.data?.workspaces?.length) {
        const clinicWs = res.data.workspaces.find(w => w.clinicId && Number(w.clinicId) > 0);
        if (clinicWs?.clinicId) {
          const resolvedId = Number(clinicWs.clinicId);
          this.clinicId.set(resolvedId);
          this.clinicName.set(clinicWs.clinicName || '');
          this.authService.setClinicId(resolvedId);
          return;
        }
      }
    } catch (e) {
      console.warn('Workspace resolution error:', e);
    }

    // 3. Last fallback: Check user's own id if role is clinic
    if (this.authService.getRoleId() === 3) {
      const userId = Number(this.authService.getuserid() || user?.id || user?.Id || 0);
      if (userId > 0) {
        this.clinicId.set(userId);
      }
    }
  }

  async loadBranches(): Promise<void> {
    const id = this.clinicId();
    if (id <= 0) return;

    this.isLoading.set(true);
    try {
      const res = await this.relationshipService.getClinicBranches(id);
      if (res.isSuccess) {
        this.branches.set(res.data || []);
        if (res.data?.length && res.data[0].clinicName) {
          this.clinicName.set(res.data[0].clinicName);
        }
      } else {
        this.alert.toastError(res.message || 'Failed to load clinic branches.');
        this.branches.set([]);
      }
    } catch {
      this.alert.toastError('Failed to load clinic branches.');
    } finally {
      this.isLoading.set(false);
    }
  }

  setFilter(filter: 'all' | 'active' | 'inactive'): void {
    this.activeStatusFilter.set(filter);
  }

  async toggleStatus(branch: ClinicBranchDto, event: Event): Promise<void> {
    event.stopPropagation();
    const newStatus = !branch.isActive;

    // Optimistically update signal
    this.branches.update(list =>
      list.map(b => b.id === branch.id ? { ...b, isActive: newStatus } : b)
    );

    try {
      const res = await this.relationshipService.setBranchStatus(branch.id, newStatus);
      if (res.isSuccess) {
        this.alert.toastSuccess(`Branch ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      } else {
        // Rollback
        this.branches.update(list =>
          list.map(b => b.id === branch.id ? { ...b, isActive: !newStatus } : b)
        );
        this.alert.toastError(res.message || 'Failed to update branch status.');
      }
    } catch {
      this.branches.update(list =>
        list.map(b => b.id === branch.id ? { ...b, isActive: !newStatus } : b)
      );
      this.alert.toastError('Failed to update branch status.');
    }
  }

  editBranch(branchId: number): void {
    this.router.navigate(['/clinic-dashboard/branches/edit', branchId]);
  }

  viewDashboard(branch: ClinicBranchDto): void {
    this.router.navigate(['/clinic-dashboard/dashboard'], {
      queryParams: { branchId: branch.id }
    });
  }

  getFormattedAddress(branch: ClinicBranchDto): string {
    const parts = [branch.address, branch.city, branch.stateName].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Address not specified';
  }
}
