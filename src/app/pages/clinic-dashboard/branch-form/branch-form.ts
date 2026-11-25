import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ClinicRelationshipService } from '../../../services/clinic-relationship.service';
import { Authservice } from '../../../services/authservice';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { ClinicBranchViewModel } from '../../../models/clinic.model';

@Component({
  selector: 'app-branch-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './branch-form.html',
  styleUrl: './branch-form.css'
})
export class BranchFormComponent implements OnInit {
  private relationshipService = inject(ClinicRelationshipService);
  private authService = inject(Authservice);
  private alert = inject(SweetAlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode: boolean = false;
  branchId: number = 0;
  clinicId: number = 0;
  isSaving: boolean = false;
  isLoading: boolean = false;

  branch: ClinicBranchViewModel = {
    id: 0,
    clinicId: 0,
    branchName: '',
    branchCode: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    stateName: '',
    pincode: '',
    isActive: true,
    defaultConsultationFee: null,
    operatingHours: ''
  };

  async ngOnInit(): Promise<void> {
    await this.resolveClinicInfo();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && Number(idParam) > 0) {
      this.isEditMode = true;
      this.branchId = Number(idParam);
      await this.loadBranchDetails(this.branchId);
    }
  }

  private async resolveClinicInfo(): Promise<void> {
    const directClinicId = this.authService.getClinicId();
    if (directClinicId) {
      this.clinicId = Number(directClinicId);
      this.branch.clinicId = this.clinicId;
      return;
    }

    const professionalId = this.authService.getCurrentProfessionalId();
    if (this.authService.getRoleId() === 3 && professionalId) {
      this.clinicId = Number(professionalId);
      this.branch.clinicId = this.clinicId;
      return;
    }

    const user = this.authService.getCurrentUser();
    if (user?.clinicId || user?.ClinicId) {
      this.clinicId = Number(user.clinicId || user.ClinicId);
      this.branch.clinicId = this.clinicId;
      return;
    }

    // Fallback: Resolve via workspace resolver
    try {
      const res = await this.relationshipService.resolveWorkspaces();
      if (res.isSuccess && res.data?.workspaces?.length) {
        const clinicWs = res.data.workspaces.find(w => w.clinicId && w.clinicId > 0);
        if (clinicWs?.clinicId) {
          this.clinicId = clinicWs.clinicId;
          this.branch.clinicId = this.clinicId;
          this.authService.setClinicId(this.clinicId);
        }
      }
    } catch {
      // silently proceed
    }
  }

  async loadBranchDetails(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const res = await this.relationshipService.getBranchById(id);
      if (res.isSuccess && res.data) {
        const d = res.data;
        this.branch = {
          id: d.id,
          clinicId: d.clinicId,
          branchName: d.branchName,
          branchCode: d.branchCode || '',
          phone: d.phone || '',
          email: d.email || '',
          address: d.address || '',
          city: d.city || '',
          stateName: d.stateName || '',
          pincode: d.pincode || '',
          isActive: d.isActive,
          defaultConsultationFee: null,
          operatingHours: ''
        };
        if (d.clinicId) {
          this.clinicId = d.clinicId;
        }
      } else {
        this.alert.toastError(res.message || 'Failed to load branch details.');
      }
    } catch {
      this.alert.toastError('Failed to load branch details.');
    } finally {
      this.isLoading = false;
    }
  }

  validate(): boolean {
    if (!this.branch.branchName || this.branch.branchName.trim() === '') {
      this.alert.toastWarning('Please enter the branch name.');
      return false;
    }
    if (!this.branch.phone || this.branch.phone.trim() === '') {
      this.alert.toastWarning('Please enter primary phone number.');
      return false;
    }
    if (!this.branch.address || this.branch.address.trim() === '') {
      this.alert.toastWarning('Please enter the street address.');
      return false;
    }
    if (!this.branch.city || this.branch.city.trim() === '') {
      this.alert.toastWarning('Please enter the city.');
      return false;
    }
    if (!this.branch.stateName || this.branch.stateName.trim() === '') {
      this.alert.toastWarning('Please enter the state.');
      return false;
    }
    if (!this.branch.pincode || this.branch.pincode.trim() === '') {
      this.alert.toastWarning('Please enter the pincode.');
      return false;
    }
    if (!this.clinicId || this.clinicId <= 0) {
      this.alert.toastError('No valid clinic associated with this account.');
      return false;
    }
    return true;
  }

  async onSubmit(): Promise<void> {
    if (!this.validate()) return;

    this.branch.clinicId = this.clinicId;
    this.branch.id = this.isEditMode ? this.branchId : 0;
    this.isSaving = true;

    try {
      const res = await this.relationshipService.saveClinicBranch(this.branch);
      if (res.isSuccess) {
        this.alert.toastSuccess(
          this.isEditMode ? 'Branch updated successfully!' : 'Branch created successfully!'
        );
        this.router.navigate(['/clinic-dashboard/branches']);
      } else {
        this.alert.toastError(res.message || 'Failed to save branch.');
      }
    } catch {
      this.alert.toastError('An error occurred while saving the branch.');
    } finally {
      this.isSaving = false;
    }
  }

  clearForm(): void {
    if (this.isEditMode) {
      this.loadBranchDetails(this.branchId);
    } else {
      this.branch = {
        id: 0,
        clinicId: this.clinicId,
        branchName: '',
        branchCode: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        stateName: '',
        pincode: '',
        isActive: true,
        defaultConsultationFee: null,
        operatingHours: ''
      };
    }
  }
}
