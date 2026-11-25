export interface ClinicBranchViewModel {
  id?: number | null;
  clinicId: number;
  branchName: string;
  branchCode?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  stateName?: string | null;
  pincode?: string | null;
  isActive: boolean;
  defaultConsultationFee?: number | null;
  operatingHours?: string | null;
}

export interface SetBranchStatusViewModel {
  branchId: number;
  isActive: boolean;
}

export interface ClinicBranchDto {
  id: number;
  clinicId: number;
  clinicName?: string | null;
  branchName: string;
  branchCode?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  stateName?: string | null;
  pincode?: string | null;
  isActive: boolean;
  activePractitionersCount: number;
  activeStaffCount: number;
  createdAt: string;
}

export interface WorkspaceResolutionDto {
  userId: number;
  fullName?: string | null;
  roleId?: number | null;
  practitionerId?: number | null;
  isProfileCompleted?: boolean;
  isSoloPracticeEnabled: boolean;
  workspaces: UserWorkspaceItemDto[];
}

export interface UserWorkspaceItemDto {
  workspaceType: string;
  accessLevel: string;
  clinicId?: number | null;
  clinicName?: string | null;
  branchId?: number | null;
  branchName?: string | null;
  branchCode?: string | null;
  city?: string | null;
  isPrimary: boolean;
}

// ─── Clinic User / Team & Staff Models ────────────────────────────────────────

export const ClinicUserRoles = {
  Manager: 'Manager',
  Staff: 'Staff',
  Receptionist: 'Receptionist',
  Practitioner: 'Practitioner',
} as const;

export type ClinicUserRoleType = (typeof ClinicUserRoles)[keyof typeof ClinicUserRoles];

/** Request payload matching C# AddClinicUserViewModel */
export class AddClinicUserViewModel {
  clinicId: number = 0;
  clinicBranchId?: number | null = null;
  userId: number = 0;
  practitionerId?: number | null = null;
  fullName?: string | null = '';
  email?: string | null = '';
  mobile?: string | null = '';
  role: string = ClinicUserRoles.Staff;

  constructor(init?: Partial<AddClinicUserViewModel>) {
    if (init) {
      Object.assign(this, init);
    }
  }
}

/** Request payload matching C# RemoveClinicUserViewModel */
export class RemoveClinicUserViewModel {
  clinicUserId: number = 0;
  clinicBranchId?: number | null = null;

  constructor(init?: Partial<RemoveClinicUserViewModel>) {
    if (init) {
      Object.assign(this, init);
    }
  }
}

/** Response item matching C# ClinicUserDto */
export interface ClinicUserDto {
  id: number;
  clinicId: number;
  clinicName?: string | null;
  clinicBranchId?: number | null;
  branchName?: string | null;
  userId: number;
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

/** Response item matching C# ClinicPractitionerDto */
export interface ClinicPractitionerDto {
  id: number;
  clinicId: number;
  clinicName?: string | null;
  clinicBranchId?: number | null;
  branchName?: string | null;
  practitionerId: number;
  userId?: number | null;
  practitionerName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  specialization?: string | null;
  experienceYears?: number | null;
  consultationFee?: number | null;
  avgRating?: number | null;
  status: string;
  requestedAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  leftAt?: string | null;
}
