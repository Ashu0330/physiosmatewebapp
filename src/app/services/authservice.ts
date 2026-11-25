import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { authmodel } from '../models/authmodel';
import { UserWorkspaceItemDto } from '../models/clinic.model';
import { environment } from '../environment/environment';
import { ApiResponse } from '../models/apiresponse';

const ACTIVE_WORKSPACE_KEY = 'activeWorkspace';
const AVAILABLE_WORKSPACES_KEY = 'availableWorkspaces';

@Injectable({
  providedIn: 'root',
})
export class Authservice {

  constructor(private http: HttpClient) {
    this.hydrateWorkspaceSignals();
  }

  // ── In-memory pending user ID (OTP verification step only) ────────────────
  private pendingUserId: number | string | null = null;

  readonly activeWorkspace = signal<UserWorkspaceItemDto | null>(null);
  readonly availableWorkspaces = signal<UserWorkspaceItemDto[]>([]);

  private hydrateWorkspaceSignals(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const activeRaw = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
      if (activeRaw) {
        this.activeWorkspace.set(JSON.parse(activeRaw));
      }
      const listRaw = localStorage.getItem(AVAILABLE_WORKSPACES_KEY);
      if (listRaw) {
        this.availableWorkspaces.set(JSON.parse(listRaw));
      }
    } catch {
      this.activeWorkspace.set(null);
      this.availableWorkspaces.set([]);
    }
  }

  setPendingUserId(id: number | string | null): void {
    this.pendingUserId = id;
  }

  getPendingUserId(): number | string | null {
    return this.pendingUserId;
  }

  clearPendingUserId(): void {
    this.pendingUserId = null;
  }

  login(model: any) {
    return this.http.post<ApiResponse<authmodel>>(environment.baseUrl + 'Auth/Login', model);
  }

  register(model: any) {
    return this.http.post<ApiResponse<authmodel>>(environment.baseUrl + 'Auth/Register', model);
  }


  sendRegistrationOtp(email: string) {
    const formData = new FormData();
    formData.append("Email", email);
    formData.append("IsLogin", "true");
    return this.http.post<ApiResponse<any>>(`${environment.baseUrl}Auth/Register`, formData);
  }


  verifyOtp(payload: any) {
    return this.http.post<ApiResponse<any>>(environment.baseUrl + 'Auth/VerifyOtp', payload);
  }

  resendOtp(payload: any) {
    return this.http.post<ApiResponse<any>>(environment.baseUrl + 'Auth/ResendOtp', payload);
  }

  addPractitioner(model: any) {
    return this.http.post<ApiResponse<any>>(environment.baseUrl + 'Practitioner/AddPractitioner', model);
  }

  addClinic(formData: FormData, params?: any) {
    return this.http.post<ApiResponse<any>>(environment.baseUrl + 'Clinic/AddClinic', formData, { params });
  }

  getuserid() {
    const user = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
    if (user) {
      return JSON.parse(user).id;
    }
    return null;
  }

  setPendingVerification(model: any) {
    const data = model;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pendingVerification', JSON.stringify(data));
    }
  }

  getPendingVerification() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pendingVerification') : null;
    return saved ? JSON.parse(saved) : null;
  }

  clearPendingVerification() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('pendingVerification');
    }
  }
  getUserName() {
    const user = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
    if (user) {
      return JSON.parse(user).fullName;
    }
    return null;
  }
  getRoleId() {
    const user = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
    if (user) {
      return JSON.parse(user).roleId;
    }
    return null;
  }
  getUserProfilePic() {
    const user = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
    if (user) {
      return JSON.parse(user).profilePictureUrl;
    }
    return null;
  }



  isLoggedIn(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token || user);
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('token');
  }

  getCurrentUser(): any {
    if (typeof localStorage === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getCurrentProfessionalId(): any {
    const roleid = this.getRoleId();
    const user = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
    if (user) {
      const parsedUser = JSON.parse(user);
      if (roleid === 1) {
        return parsedUser.Id || parsedUser.id;
      }
      else if (roleid === 2) {
        return parsedUser.practitionerId ?? parsedUser.PractitionerId ?? null;
      }
      else if (roleid === 3) {
        return parsedUser.clinicId ?? parsedUser.ClinicId ?? null;
      }
    }
    else {
      return null;
    }
  }

  getClinicId(): number | null {
    const user = this.getCurrentUser();
    return user ? (user.clinicId ?? user.ClinicId ?? null) : null;
  }

  setClinicId(clinicId: number): void {
    if (typeof localStorage === 'undefined') return;
    const user = this.getCurrentUser();
    if (user) {
      user.clinicId = clinicId;
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getPractitionerId(): number | null {
    const user = this.getCurrentUser();
    return user ? (user.practitionerId ?? user.PractitionerId ?? null) : null;
  }

  setPractitionerId(practitionerId: number): void {
    if (typeof localStorage === 'undefined') return;
    const user = this.getCurrentUser();
    if (user) {
      user.practitionerId = practitionerId;
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getBranchId(): number | null {
    const ws = this.activeWorkspace();
    if (ws?.branchId !== undefined) {
      return ws.branchId ?? null;
    }
    const user = this.getCurrentUser();
    return user ? (user.branchId ?? user.clinicBranchId ?? null) : null;
  }

  getActiveWorkspace(): UserWorkspaceItemDto | null {
    return this.activeWorkspace();
  }

  getAvailableWorkspaces(): UserWorkspaceItemDto[] {
    return this.availableWorkspaces();
  }

  buildProfileOptions(resolution: { roleId?: number | null; practitionerId?: number | null; workspaces?: UserWorkspaceItemDto[] }, userData: any): UserWorkspaceItemDto[] {
    const options: UserWorkspaceItemDto[] = [...(resolution?.workspaces ?? [])];
    if (
      (resolution?.roleId === 1 || userData?.roleId === 1) &&
      options.length > 0 &&
      (userData?.isProfileCompleted || (userData?.patientId ?? 0) > 0)
    ) {
      options.unshift({
        workspaceType: 'Patient',
        accessLevel: 'Patient',
        clinicId: null,
        clinicName: null,
        branchId: null,
        branchName: null,
        branchCode: null,
        city: null,
        isPrimary: false,
      });
    }
    this.setAvailableWorkspaces(options, resolution?.practitionerId);
    return options;
  }

  setAvailableWorkspaces(workspaces: UserWorkspaceItemDto[], practitionerId?: number | null): void {
    const list = workspaces ?? [];
    this.availableWorkspaces.set(list);
    if (practitionerId && practitionerId > 0) {
      this.setPractitionerId(practitionerId);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AVAILABLE_WORKSPACES_KEY, JSON.stringify(list));
    }
  }

  setActiveWorkspace(workspace: UserWorkspaceItemDto | null, baseUser?: any): void {
    this.activeWorkspace.set(workspace);
    if (typeof localStorage === 'undefined') return;

    localStorage.removeItem('parentId');

    if (workspace) {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, JSON.stringify(workspace));
    } else {
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    }

    const user = baseUser ? { ...baseUser } : (this.getCurrentUser() ?? {});
    if (workspace?.workspaceType === 'Clinic') {
      user.clinicId = workspace.clinicId ?? 0;
      user.branchId = workspace.branchId ?? null;
      user.clinicName = workspace.clinicName ?? null;
      user.branchName = workspace.branchName ?? null;
      user.workspaceType = 'Clinic';
      user.workspaceAccessLevel = workspace.accessLevel;
    } else if (workspace?.workspaceType === 'Solo') {
      user.clinicId = 0;
      user.branchId = null;
      user.clinicName = null;
      user.branchName = null;
      user.workspaceType = 'Solo';
      user.workspaceAccessLevel = 'Solo';
    } else if (workspace?.workspaceType === 'Patient') {
      user.clinicId = 0;
      user.branchId = null;
      user.clinicName = null;
      user.branchName = null;
      user.workspaceType = 'Patient';
      user.workspaceAccessLevel = 'Patient';
    }
    localStorage.setItem('user', JSON.stringify(user));
  }

  isSameWorkspace(a?: UserWorkspaceItemDto | null, b?: UserWorkspaceItemDto | null): boolean {
    if (!a || !b) return false;
    return (
      a.workspaceType === b.workspaceType &&
      a.accessLevel === b.accessLevel &&
      (a.clinicId ?? null) === (b.clinicId ?? null) &&
      (a.branchId ?? null) === (b.branchId ?? null)
    );
  }

  formatWorkspaceLabel(ws?: UserWorkspaceItemDto | null): string {
    if (!ws) return '';
    if (ws.workspaceType === 'Solo') return 'Solo Practitioner';
    if (ws.workspaceType === 'Patient') return 'Patient Account';
    const branch = ws.branchName ? ` · ${ws.branchName}` : '';
    return `${ws.clinicName || 'Clinic'}${branch} (${ws.accessLevel})`;
  }

  isClinicPractitionerWorkspace(): boolean {
    const ws = this.activeWorkspace();
    if (ws) {
      return (
        ws.workspaceType === 'Clinic' &&
        (ws.accessLevel || '').toLowerCase() === 'practitioner'
      );
    }
    const user = this.getCurrentUser();
    return (
      user?.workspaceType === 'Clinic' &&
      (user?.workspaceAccessLevel || '').toLowerCase() === 'practitioner'
    );
  }

  getWorkspaceNavigationRoute(workspace?: UserWorkspaceItemDto | null, roleId?: number | null): string {
    const effectiveRole = roleId ?? this.getRoleId();
    if (workspace?.workspaceType === 'Solo') {
      return '/doctor-dashboard/dashboard';
    }
    if (workspace?.workspaceType === 'Patient') {
      return '/user-dashboard/medical-records';
    }
    if (workspace?.workspaceType === 'Clinic') {
      if ((workspace.accessLevel || '').toLowerCase() === 'practitioner') {
        return effectiveRole === 3 ? '/clinic-dashboard/consultations' : '/doctor-dashboard/consultations';
      }
      return effectiveRole === 3 ? '/clinic-dashboard/dashboard' : '/doctor-dashboard/dashboard';
    }
    if (effectiveRole === 2) {
      return '/doctor-dashboard/dashboard';
    }
    if (effectiveRole === 3) {
      return '/clinic-dashboard/dashboard';
    }
    return '/user-dashboard/medical-records';
  }

  saveUserSession(userData: any, token?: string): void {
    if (typeof localStorage === 'undefined') return;
    this.clearPendingUserId();
    localStorage.removeItem('parentId');
    localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    localStorage.removeItem(AVAILABLE_WORKSPACES_KEY);
    this.activeWorkspace.set(null);
    this.availableWorkspaces.set([]);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    if (token) {
      localStorage.setItem('token', token);
    } else if (userData?.token) {
      localStorage.setItem('token', userData.token);
    }
  }

  logout(): void {
    this.clearPendingUserId();
    this.activeWorkspace.set(null);
    this.availableWorkspaces.set([]);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('pendingVerification');
      localStorage.removeItem('parentId');
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
      localStorage.removeItem(AVAILABLE_WORKSPACES_KEY);
    }
  }
}
