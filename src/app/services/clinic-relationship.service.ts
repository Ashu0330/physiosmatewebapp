import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Authservice } from './authservice';
import { ApiEndPoints } from '../helper/api-endpoints';
import { ApiResponse } from '../models/apiresponse';
import {
  AddClinicUserViewModel,
  ClinicBranchDto,
  ClinicBranchViewModel,
  ClinicPractitionerDto,
  ClinicUserDto,
  RemoveClinicUserViewModel,
  SetBranchStatusViewModel,
  UserWorkspaceItemDto,
  WorkspaceResolutionDto
} from '../models/clinic.model';

@Injectable({
  providedIn: 'root'
})
export class ClinicRelationshipService {
  private apiService = inject(ApiService);
  private authService = inject(Authservice);

  /**
   * Resolves the active clinic ID from stored session or backend workspace discovery.
   */
  async resolveCurrentClinicId(): Promise<number> {
    const directClinicId = Number(this.authService.getClinicId() || 0);
    if (directClinicId > 0) {
      return directClinicId;
    }

    const user = this.authService.getCurrentUser();
    const userClinicId = Number(user?.clinicId || user?.ClinicId || 0);
    if (userClinicId > 0) {
      return userClinicId;
    }

    const professionalId = Number(this.authService.getCurrentProfessionalId() || 0);
    if (this.authService.getRoleId() === 3 && professionalId > 0) {
      return professionalId;
    }

    try {
      const res = await this.resolveWorkspaces();
      if (res.isSuccess && res.data?.workspaces?.length) {
        const clinicWs = res.data.workspaces.find(w => w.clinicId && Number(w.clinicId) > 0);
        if (clinicWs?.clinicId) {
          const resolvedId = Number(clinicWs.clinicId);
          this.authService.setClinicId(resolvedId);
          return resolvedId;
        }
      }
    } catch {
      // Fall through to user ID check for clinic role
    }

    if (this.authService.getRoleId() === 3) {
      const userId = Number(this.authService.getuserid() || user?.id || user?.Id || 0);
      if (userId > 0) {
        return userId;
      }
    }

    return 0;
  }

  /**
   * Retrieves all branches for a given clinic with active practitioners & staff counts.
   */
  async getClinicBranches(clinicId: number): Promise<ApiResponse<ClinicBranchDto[]>> {
    return await this.apiService.Get<ClinicBranchDto[]>(
      `${ApiEndPoints.ClinicBranches}?clinicId=${clinicId}`
    );
  }

  /**
   * Retrieves single branch details by ID.
   */
  async getBranchById(branchId: number): Promise<ApiResponse<ClinicBranchDto>> {
    return await this.apiService.Get<ClinicBranchDto>(
      `${ApiEndPoints.BranchById}?branchId=${branchId}`
    );
  }

  /**
   * Creates or updates a physical clinic branch (upsert).
   */
  async saveClinicBranch(model: ClinicBranchViewModel): Promise<ApiResponse<number>> {
    return await this.apiService.Post<number>(
      ApiEndPoints.SaveClinicBranch,
      model
    );
  }

  /**
   * Sets active/inactive status of a branch.
   */
  async setBranchStatus(branchId: number, isActive: boolean): Promise<ApiResponse<boolean>> {
    const payload: SetBranchStatusViewModel = { branchId, isActive };
    return await this.apiService.Post<boolean>(
      ApiEndPoints.SetBranchStatus,
      payload
    );
  }

  /**
   * Resolves authorized workspaces (solo practice & clinics/branches).
   */
  async resolveWorkspaces(): Promise<ApiResponse<WorkspaceResolutionDto>> {
    return await this.apiService.Get<WorkspaceResolutionDto>(
      ApiEndPoints.ResolveWorkspaces
    );
  }

  /**
   * Lists all authorized managers, receptionists, staff, and practitioners for a clinic, optionally filtered by branch.
   */
  async getClinicUsers(clinicId: number, branchId?: number | null): Promise<ApiResponse<ClinicUserDto[]>> {
    const branchQuery = branchId && branchId > 0 ? `&branchId=${branchId}` : '';
    return await this.apiService.Get<ClinicUserDto[]>(
      `${ApiEndPoints.ClinicUsers}?clinicId=${clinicId}${branchQuery}`
    );
  }

  /**
   * Assigns or updates a manager, staff, receptionist, or practitioner within a clinic (and optional branch).
   */
  async addClinicUser(model: AddClinicUserViewModel): Promise<ApiResponse<number>> {
    return await this.apiService.Post<number>(
      ApiEndPoints.AddClinicUser,
      model
    );
  }

  /**
   * Deactivates a clinic user or removes a specific branch assignment.
   */
  async removeClinicUser(model: RemoveClinicUserViewModel): Promise<ApiResponse<boolean>> {
    return await this.apiService.Post<boolean>(
      ApiEndPoints.RemoveClinicUser,
      model
    );
  }

  /**
   * Retrieves practitioners linked to a clinic, optionally filtered by status and branch.
   */
  async getClinicPractitioners(
    clinicId: number,
    status: string = 'Active',
    branchId?: number | null
  ): Promise<ApiResponse<ClinicPractitionerDto[]>> {
    const params = new URLSearchParams({ clinicId: String(clinicId) });
    if (status) {
      params.set('status', status);
    }
    if (branchId && branchId > 0) {
      params.set('branchId', String(branchId));
    }
    return await this.apiService.Get<ClinicPractitionerDto[]>(
      `${ApiEndPoints.ClinicPractitioners}?${params.toString()}`
    );
  }

  /**
   * Toggles independent Solo Practice mode for the logged-in practitioner.
   */
  async toggleSoloPractice(isEnabled: boolean): Promise<ApiResponse<boolean>> {
    return await this.apiService.Post<boolean>(
      ApiEndPoints.ToggleSoloPractice,
      { isEnabled }
    );
  }

  /**
   * Enables solo practice for an already-completed practitioner profile, refreshes workspaces,
   * and activates the Solo workspace locally.
   */
  async activateExistingSoloWorkspace(userData?: any): Promise<UserWorkspaceItemDto | null> {
    const toggleRes = await this.toggleSoloPractice(true);
    if (!toggleRes.isSuccess) {
      return null;
    }

    const wsRes = await this.resolveWorkspaces();
    if (!wsRes.isSuccess || !wsRes.data) {
      return null;
    }

    const options = this.authService.buildProfileOptions(wsRes.data, userData ?? this.authService.getCurrentUser());
    const soloWs = options.find(w => w.workspaceType === 'Solo') ?? {
      workspaceType: 'Solo',
      accessLevel: 'Solo',
      clinicId: null,
      clinicName: null,
      branchId: null,
      branchName: null,
      branchCode: null,
      city: null,
      isPrimary: false,
    };
    this.authService.setActiveWorkspace(soloWs, userData ?? this.authService.getCurrentUser());
    return soloWs;
  }

  /**
   * Prepares client auth state to enter the Solo Professional Profile setup flow
   * without losing the user's authenticated token.
   */
  prepareSoloProfileSetup(userData?: any, emailOverride?: string): void {
    const user = userData ?? this.authService.getCurrentUser();
    const email = emailOverride || user?.email || '';
    this.authService.setActiveWorkspace(null, user);
    this.authService.setPendingVerification({
      email,
      isOtpVerified: true,
      isProfileCompleted: false,
      user,
      soloSetupMode: true,
    });
  }
}
