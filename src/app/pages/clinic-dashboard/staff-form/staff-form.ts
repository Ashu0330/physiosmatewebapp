import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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

interface RoleOption {
  value: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './staff-form.html',
  styleUrl: './staff-form.css'
})
export class StaffFormComponent implements OnInit {
  private relationshipService = inject(ClinicRelationshipService);
  private alert = inject(SweetAlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly isEditMode = signal<boolean>(false);
  readonly clinicUserId = signal<number>(0);
  readonly clinicId = signal<number>(0);
  readonly previousBranchId = signal<number | null>(null);
  readonly isSaving = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  readonly branches = signal<ClinicBranchDto[]>([]);
  readonly practitioners = signal<ClinicPractitionerDto[]>([]);
  readonly staffModel = signal<AddClinicUserViewModel>(new AddClinicUserViewModel());

  readonly roleOptions: RoleOption[] = [
    {
      value: ClinicUserRoles.Manager,
      label: 'Manager',
      description: 'Can manage clinic operations, branches, staff, and schedules.'
    },
    {
      value: ClinicUserRoles.Receptionist,
      label: 'Receptionist',
      description: 'Front-desk access for bookings, check-ins, and patient coordination.'
    },
    {
      value: ClinicUserRoles.Staff,
      label: 'Staff',
      description: 'General clinic support access scoped to assigned branches.'
    },
    {
      value: ClinicUserRoles.Practitioner,
      label: 'Practitioner',
      description: 'Doctor / physiotherapist role synced with ClinicPractitioner records.'
    }
  ];

  readonly selectedRoleDescription = computed(() => {
    const role = this.staffModel().role;
    return this.roleOptions.find(r => r.value === role)?.description ?? '';
  });

  readonly isPractitionerRole = computed(
    () => (this.staffModel().role || '').toLowerCase() === ClinicUserRoles.Practitioner.toLowerCase()
  );

  async ngOnInit(): Promise<void> {
    const resolvedClinicId = await this.relationshipService.resolveCurrentClinicId();
    this.clinicId.set(resolvedClinicId);
    this.updateField('clinicId', resolvedClinicId);

    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedId = idParam ? Number(idParam) : 0;

    if (resolvedClinicId > 0) {
      await Promise.all([this.loadBranches(resolvedClinicId), this.loadPractitioners(resolvedClinicId)]);
    }

    if (parsedId > 0) {
      this.isEditMode.set(true);
      this.clinicUserId.set(parsedId);
      await this.loadMemberDetails(parsedId);
    }
  }

  updateField<K extends keyof AddClinicUserViewModel>(field: K, value: AddClinicUserViewModel[K]): void {
    this.staffModel.update(prev => new AddClinicUserViewModel({ ...prev, [field]: value }));
  }

  onBranchChange(value: string | number | null): void {
    const parsed = value ? Number(value) : null;
    this.updateField('clinicBranchId', parsed && parsed > 0 ? parsed : null);
  }

  onPractitionerSelect(value: string | number | null): void {
    const pracId = value ? Number(value) : null;
    if (!pracId || pracId <= 0) {
      this.updateField('practitionerId', null);
      return;
    }
    const matched = this.practitioners().find(p => p.practitionerId === pracId);
    this.staffModel.update(prev => new AddClinicUserViewModel({
      ...prev,
      practitionerId: pracId,
      userId: matched?.userId ?? prev.userId,
      fullName: matched?.practitionerName || prev.fullName,
      email: matched?.userEmail || prev.email,
      mobile: matched?.userPhone || prev.mobile,
      clinicBranchId: matched?.clinicBranchId ?? prev.clinicBranchId
    }));
  }

  private async loadBranches(clinicId: number): Promise<void> {
    try {
      const res = await this.relationshipService.getClinicBranches(clinicId);
      if (res.isSuccess && res.data) {
        this.branches.set(res.data.filter(b => b.isActive));
      }
    } catch {
      // Leave branch dropdown empty if fetch fails
    }
  }

  private async loadPractitioners(clinicId: number): Promise<void> {
    try {
      const res = await this.relationshipService.getClinicPractitioners(clinicId, 'All');
      if (res.isSuccess && res.data) {
        this.practitioners.set(res.data);
      }
    } catch {
      // Optional practitioner quick-link list
    }
  }

  private async loadMemberDetails(targetId: number): Promise<void> {
    const stateStaff = history.state?.['staff'] as ClinicUserDto | undefined;
    if (stateStaff && stateStaff.id === targetId) {
      this.populateFromDto(stateStaff);
      return;
    }

    const clinicId = this.clinicId();
    if (clinicId <= 0) return;

    this.isLoading.set(true);
    try {
      const res = await this.relationshipService.getClinicUsers(clinicId);
      const match = res.isSuccess ? res.data?.find(u => u.id === targetId) : undefined;
      if (match) {
        this.populateFromDto(match);
      } else {
        this.alert.toastError('Staff member record not found.');
        this.router.navigate(['/clinic-dashboard/staff']);
      }
    } catch {
      this.alert.toastError('Failed to load staff member details.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private populateFromDto(member: ClinicUserDto): void {
    this.clinicId.set(member.clinicId);
    this.previousBranchId.set(member.clinicBranchId ?? null);
    this.staffModel.set(new AddClinicUserViewModel({
      clinicId: member.clinicId,
      clinicBranchId: member.clinicBranchId ?? null,
      userId: member.userId,
      practitionerId: null,
      fullName: member.userName || '',
      email: member.userEmail || '',
      mobile: member.userPhone || '',
      role: member.role || ClinicUserRoles.Staff
    }));
  }

  private validate(): boolean {
    const model = this.staffModel();
    const activeClinicId = this.clinicId();

    if (!activeClinicId || activeClinicId <= 0) {
      this.alert.toastError('No valid clinic associated with this account.');
      return false;
    }

    if (!model.role || model.role.trim() === '') {
      this.alert.toastWarning('Please select a staff role.');
      return false;
    }

    const hasResolvedUser = model.userId > 0 || (model.practitionerId ?? 0) > 0;
    if (!hasResolvedUser) {
      if (!model.fullName || model.fullName.trim() === '') {
        this.alert.toastWarning('Please enter the member full name.');
        return false;
      }
      const hasMobile = !!(model.mobile && model.mobile.trim() !== '');
      const hasEmail = !!(model.email && model.email.trim() !== '');
      if (!hasMobile && !hasEmail) {
        this.alert.toastWarning('Please enter a mobile number or email address to look up or create the user account.');
        return false;
      }
    }

    return true;
  }

  async onSubmit(): Promise<void> {
    if (!this.validate()) return;

    const current = this.staffModel();
    const payload = new AddClinicUserViewModel({
      clinicId: this.clinicId(),
      clinicBranchId: current.clinicBranchId && current.clinicBranchId > 0 ? current.clinicBranchId : null,
      userId: current.userId || 0,
      practitionerId: current.practitionerId && current.practitionerId > 0 ? current.practitionerId : null,
      fullName: current.fullName?.trim() || null,
      email: current.email?.trim() || null,
      mobile: current.mobile?.trim() || null,
      role: current.role || ClinicUserRoles.Staff
    });

    this.isSaving.set(true);
    try {
      const res = await this.relationshipService.addClinicUser(payload);
      if (!res.isSuccess) {
        this.alert.toastError(res.message || 'Failed to save staff member.');
        return;
      }

      // When reassigning or clearing a branch in edit mode, deactivate the previous branch mapping
      const prevBranch = this.previousBranchId();
      if (this.isEditMode() && prevBranch && prevBranch > 0 && prevBranch !== payload.clinicBranchId) {
        await this.relationshipService.removeClinicUser(new RemoveClinicUserViewModel({
          clinicUserId: payload.userId,
          clinicBranchId: prevBranch
        }));
      }

      this.alert.toastSuccess(
        this.isEditMode() ? 'Staff assignment updated successfully!' : 'Staff member added successfully!'
      );
      this.router.navigate(['/clinic-dashboard/staff']);
    } catch {
      this.alert.toastError('An error occurred while saving the staff member.');
    } finally {
      this.isSaving.set(false);
    }
  }

  clearForm(): void {
    if (this.isEditMode()) {
      this.loadMemberDetails(this.clinicUserId());
      return;
    }
    this.staffModel.set(new AddClinicUserViewModel({ clinicId: this.clinicId() }));
  }
}
