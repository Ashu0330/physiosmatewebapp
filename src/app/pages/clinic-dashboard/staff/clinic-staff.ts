import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClinicRelationshipService } from '../../../services/clinic-relationship.service';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import {
  AddClinicUserViewModel,
  ClinicBranchDto,
  ClinicPractitionerDto,
  ClinicUserDto,
  ClinicUserRoles,
  RemoveClinicUserViewModel
} from '../../../models/clinic.model';

const LEFT_PRACTITIONERS_FILTER = 'left-practitioners';

@Component({
  selector: 'app-clinic-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clinic-staff.html',
  styleUrl: './clinic-staff.css'
})
export class ClinicStaff implements OnInit {
  private relationshipService = inject(ClinicRelationshipService);
  private alert = inject(SweetAlertService);
  private router = inject(Router);

  readonly clinicId = signal<number>(0);
  readonly clinicName = signal<string>('');
  readonly staffList = signal<ClinicUserDto[]>([]);
  readonly leftPractitioners = signal<ClinicPractitionerDto[]>([]);
  readonly branches = signal<ClinicBranchDto[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly removingId = signal<number | null>(null);
  readonly rejoiningId = signal<number | null>(null);

  readonly searchTerm = signal<string>('');
  readonly activeRoleFilter = signal<string>('all');
  readonly selectedBranchId = signal<number | null>(null);

  readonly isLeftPractitionersTab = computed(() => this.activeRoleFilter() === LEFT_PRACTITIONERS_FILTER);
  readonly totalCount = computed(() => this.branchScopedStaff().length);
  readonly managerCount = computed(() =>
    this.branchScopedStaff().filter(u => u.role === ClinicUserRoles.Manager).length
  );
  readonly practitionerCount = computed(() =>
    this.branchScopedStaff().filter(u => u.role === ClinicUserRoles.Practitioner).length
  );
  readonly receptionistCount = computed(() =>
    this.branchScopedStaff().filter(u => u.role === ClinicUserRoles.Receptionist).length
  );
  readonly staffCount = computed(() =>
    this.branchScopedStaff().filter(u => u.role === ClinicUserRoles.Staff).length
  );
  readonly leftPractitionerCount = computed(() => this.branchScopedLeftPractitioners().length);

  readonly roleFilterOptions = computed(() => [
    { value: 'all', label: 'All Team', count: this.totalCount() },
    { value: ClinicUserRoles.Manager, label: 'Managers', count: this.managerCount() },
    { value: ClinicUserRoles.Practitioner, label: 'Practitioners', count: this.practitionerCount() },
    { value: ClinicUserRoles.Receptionist, label: 'Receptionists', count: this.receptionistCount() },
    { value: ClinicUserRoles.Staff, label: 'Staff', count: this.staffCount() },
    { value: LEFT_PRACTITIONERS_FILTER, label: 'Left Practitioners', count: this.leftPractitionerCount() },
  ]);

  private readonly branchScopedStaff = computed(() => {
    const branchId = this.selectedBranchId();
    const list = this.staffList();
    if (!branchId || branchId <= 0) {
      return list;
    }
    return list.filter(u => u.clinicBranchId === branchId);
  });

  private readonly branchScopedLeftPractitioners = computed(() => {
    const branchId = this.selectedBranchId();
    const list = this.leftPractitioners();
    if (!branchId || branchId <= 0) {
      return list;
    }
    return list.filter(p => p.clinicBranchId === branchId);
  });

  readonly filteredStaff = computed(() => {
    let list = this.branchScopedStaff();
    const roleFilter = this.activeRoleFilter();
    const term = this.searchTerm().trim().toLowerCase();

    if (roleFilter !== 'all' && roleFilter !== LEFT_PRACTITIONERS_FILTER) {
      list = list.filter(u => u.role.toLowerCase() === roleFilter.toLowerCase());
    }

    if (term) {
      list = list.filter(u =>
        (u.userName && u.userName.toLowerCase().includes(term)) ||
        (u.userPhone && u.userPhone.toLowerCase().includes(term)) ||
        (u.userEmail && u.userEmail.toLowerCase().includes(term)) ||
        (u.branchName && u.branchName.toLowerCase().includes(term)) ||
        (u.role && u.role.toLowerCase().includes(term))
      );
    }

    return list;
  });

  readonly filteredLeftPractitioners = computed(() => {
    let list = this.branchScopedLeftPractitioners();
    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      list = list.filter(p =>
        (p.practitionerName && p.practitionerName.toLowerCase().includes(term)) ||
        (p.userPhone && p.userPhone.toLowerCase().includes(term)) ||
        (p.userEmail && p.userEmail.toLowerCase().includes(term)) ||
        (p.specialization && p.specialization.toLowerCase().includes(term)) ||
        (p.branchName && p.branchName.toLowerCase().includes(term))
      );
    }
    return list;
  });

  async ngOnInit(): Promise<void> {
    const id = await this.relationshipService.resolveCurrentClinicId();
    this.clinicId.set(id);

    if (id > 0) {
      await Promise.all([this.loadStaff(), this.loadLeftPractitioners(), this.loadBranches()]);
    } else {
      this.alert.toastWarning('No active clinic detected for this account.');
    }
  }

  async loadStaff(): Promise<void> {
    const id = this.clinicId();
    if (id <= 0) return;

    this.isLoading.set(true);
    try {
      const res = await this.relationshipService.getClinicUsers(id);
      if (res.isSuccess) {
        const users = res.data || [];
        this.staffList.set(users);
        if (users.length > 0 && users[0].clinicName) {
          this.clinicName.set(users[0].clinicName);
        }
      } else {
        this.staffList.set([]);
        this.alert.toastError(res.message || 'Failed to load clinic team & staff.');
      }
    } catch {
      this.alert.toastError('Failed to load clinic team & staff.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadLeftPractitioners(): Promise<void> {
    const id = this.clinicId();
    if (id <= 0) return;

    try {
      const res = await this.relationshipService.getClinicPractitioners(id, 'Left');
      if (res.isSuccess) {
        this.leftPractitioners.set(res.data || []);
      } else {
        this.leftPractitioners.set([]);
      }
    } catch {
      this.leftPractitioners.set([]);
    }
  }

  async loadBranches(): Promise<void> {
    const id = this.clinicId();
    if (id <= 0) return;

    try {
      const res = await this.relationshipService.getClinicBranches(id);
      if (res.isSuccess && res.data) {
        this.branches.set(res.data.filter(b => b.isActive));
      }
    } catch {
      // Branch list is optional filter metadata
    }
  }

  setRoleFilter(role: string): void {
    this.activeRoleFilter.set(role);
  }

  onBranchFilterChange(value: string | number | null): void {
    const parsed = value ? Number(value) : null;
    this.selectedBranchId.set(parsed && parsed > 0 ? parsed : null);
  }

  editMember(member: ClinicUserDto): void {
    this.router.navigate(['/clinic-dashboard/staff/edit', member.id], {
      state: { staff: member }
    });
  }

  async removeMember(member: ClinicUserDto): Promise<void> {
    const displayName = member.userName || member.userPhone || 'this staff member';
    const confirm = await this.alert.confirmDelete(
      'Remove Staff Member?',
      `This will deactivate ${displayName}'s access (${member.role}) from the clinic.`
    );
    if (!confirm?.isConfirmed) {
      return;
    }

    this.removingId.set(member.id);
    try {
      const payload = new RemoveClinicUserViewModel({
        clinicUserId: member.id,
        clinicBranchId: null
      });
      const res = await this.relationshipService.removeClinicUser(payload);
      if (res.isSuccess) {
        this.staffList.update(list => list.filter(u => u.id !== member.id));
        if (member.role === ClinicUserRoles.Practitioner) {
          await this.loadLeftPractitioners();
        }
        this.alert.toastSuccess(`${displayName} removed from clinic team.`);
      } else {
        this.alert.toastError(res.message || 'Failed to remove staff member.');
      }
    } catch {
      this.alert.toastError('Failed to remove staff member.');
    } finally {
      this.removingId.set(null);
    }
  }

  async rejoinPractitioner(prac: ClinicPractitionerDto): Promise<void> {
    const displayName = prac.practitionerName || prac.userEmail || prac.userPhone || 'this practitioner';
    const confirm = await this.alert.confirm(
      'Rejoin Clinic Team?',
      `Reactivate ${displayName} as an active Practitioner in your clinic${prac.branchName ? ` (${prac.branchName})` : ''}?`,
      'Yes, Reactivate',
      'Cancel'
    );
    if (!confirm?.isConfirmed) {
      return;
    }

    this.rejoiningId.set(prac.practitionerId);
    try {
      const payload = new AddClinicUserViewModel({
        clinicId: this.clinicId(),
        clinicBranchId: prac.clinicBranchId ?? null,
        userId: prac.userId ?? 0,
        practitionerId: prac.practitionerId,
        fullName: prac.practitionerName || '',
        email: prac.userEmail || '',
        mobile: prac.userPhone || '',
        role: ClinicUserRoles.Practitioner
      });
      const res = await this.relationshipService.addClinicUser(payload);
      if (res.isSuccess) {
        this.alert.toastSuccess(`${displayName} is now active in your clinic again.`);
        await Promise.all([this.loadStaff(), this.loadLeftPractitioners()]);
      } else {
        this.alert.toastError(res.message || 'Failed to reactivate practitioner.');
      }
    } catch {
      this.alert.toastError('Failed to reactivate practitioner.');
    } finally {
      this.rejoiningId.set(null);
    }
  }

  getInitials(name?: string | null): string {
    const clean = (name || '').trim();
    if (!clean) return 'ST';
    const parts = clean.split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : clean.slice(0, 2).toUpperCase();
  }

  getRoleBadgeClass(role?: string | null): string {
    switch ((role || '').toLowerCase()) {
      case 'manager':
        return 'role-badge-manager';
      case 'practitioner':
        return 'role-badge-practitioner';
      case 'receptionist':
        return 'role-badge-receptionist';
      default:
        return 'role-badge-staff';
    }
  }
}
