import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { authmodel } from '../models/authmodel';
import { UserWorkspaceItemDto } from '../models/clinic.model';
import { environment } from '../environment/environment';
import { ApiResponse } from '../models/apiresponse';
import { ApiEndPoints } from '../helper/api-endpoints';
import {
  decodeJwtPayload,
  getJwtUserId,
  getStoredToken,
  isJwtTokenValid,
  normalizeTokenString,
} from '../helper/jwt.helper';

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
  private verifiedTokenCache: string | null = null;
  private inFlightVerifyPromise: Promise<boolean> | null = null;

  readonly activeWorkspace = signal<UserWorkspaceItemDto | null>(null);
  readonly availableWorkspaces = signal<UserWorkspaceItemDto[]>([]);
  readonly isSoloPracticeEnabled = signal<boolean>(false);
  readonly isProfileCompleted = signal<boolean>(false);

  private hydrateWorkspaceSignals(): void {
    if (typeof localStorage === 'undefined') return;
    if (!this.hasValidToken()) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('parentId');
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
      localStorage.removeItem(AVAILABLE_WORKSPACES_KEY);
      return;
    }
    try {
      const activeRaw = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
      if (activeRaw) {
        this.activeWorkspace.set(JSON.parse(activeRaw));
      }
      const listRaw = localStorage.getItem(AVAILABLE_WORKSPACES_KEY);
      if (listRaw) {
        const list = JSON.parse(listRaw) as UserWorkspaceItemDto[];
        this.availableWorkspaces.set(list);
        if (list.some(w => w.workspaceType === 'Solo')) {
          this.isSoloPracticeEnabled.set(true);
        }
      }
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user?.isSoloPracticeEnabled !== undefined) {
          this.isSoloPracticeEnabled.set(Boolean(user.isSoloPracticeEnabled));
        }
        if (user?.isProfileCompleted !== undefined) {
          this.isProfileCompleted.set(Boolean(user.isProfileCompleted));
        }
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



  hasValidToken(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const token = this.getToken();
    if (!isJwtTokenValid(token)) return false;

    const payload = decodeJwtPayload(token);
    const tokenUserId = getJwtUserId(payload);
    const user = this.getCurrentUser();
    if (user) {
      const storedId = user.id ?? user.Id;
      if (storedId !== undefined && storedId !== null && String(storedId) !== tokenUserId) {
        return false;
      }
    }
    return true;
  }

  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  getToken(): string | null {
    return getStoredToken();
  }

  async verifyAuthorizedToken(): Promise<boolean> {
    if (!this.hasValidToken()) {
      return false;
    }

    const token = this.getToken()!;
    if (this.verifiedTokenCache === token) {
      return true;
    }

    if (this.inFlightVerifyPromise) {
      return this.inFlightVerifyPromise;
    }

    const verifyPromise = firstValueFrom(
      this.http.get<ApiResponse<any>>(`${environment.baseUrl}${ApiEndPoints.GetUserProfile}`)
    )
      .then(res => {
        if (res?.isSuccess && res.data) {
          this.verifiedTokenCache = token;
          return true;
        }
        this.logout();
        return false;
      })
      .catch((err: any) => {
        const status = Number(err?.status ?? 0);
        if (status === 401 || status === 403 || status === 404) {
          this.logout();
        }
        return false;
      });

    this.inFlightVerifyPromise = verifyPromise;
    return verifyPromise.finally(() => {
      if (this.inFlightVerifyPromise === verifyPromise) {
        this.inFlightVerifyPromise = null;
      }
    });
  }

  getCurrentUser(): any {
    if (typeof localStorage === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
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

  getActiveClinicBranchId(routeBranchId?: unknown): number | null {
    const ws = this.activeWorkspace();
    if (ws && ws.workspaceType !== 'Clinic') {
      return null;
    }
    const user = this.getCurrentUser();
    if (!ws && !this.canAssignPractitioner() && !this.isReceptionistWorkspace() && user?.workspaceType !== 'Clinic') {
      return null;
    }
    const queryId = Number(routeBranchId || 0);
    if (queryId > 0) {
      return queryId;
    }
    const direct = Number(this.getBranchId() || 0);
    if (direct > 0) {
      return direct;
    }
    if (this.isReceptionistWorkspace()) {
      const assigned = this.getAssignedBranchIdsForActiveClinic();
      if (assigned.length > 0 && assigned[0] > 0) {
        return assigned[0];
      }
    }
    return null;
  }

  getActiveWorkspace(): UserWorkspaceItemDto | null {
    return this.activeWorkspace();
  }

  getAvailableWorkspaces(): UserWorkspaceItemDto[] {
    return this.availableWorkspaces();
  }

  buildProfileOptions(resolution: { roleId?: number | null; practitionerId?: number | null; isProfileCompleted?: boolean; isSoloPracticeEnabled?: boolean; workspaces?: UserWorkspaceItemDto[] }, userData: any): UserWorkspaceItemDto[] {
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
    this.syncResolutionState(resolution, userData);
    this.setAvailableWorkspaces(options, resolution?.practitionerId);
    return options;
  }

  syncResolutionState(resolution?: { practitionerId?: number | null; isProfileCompleted?: boolean; isSoloPracticeEnabled?: boolean } | null, userData?: any): void {
    const soloEnabled = Boolean(resolution?.isSoloPracticeEnabled ?? userData?.isSoloPracticeEnabled);
    const profileDone = Boolean(resolution?.isProfileCompleted ?? userData?.isProfileCompleted);
    this.isSoloPracticeEnabled.set(soloEnabled);
    this.isProfileCompleted.set(profileDone);

    if (typeof localStorage === 'undefined') return;
    const stored = this.getCurrentUser() ?? (userData ? { ...userData } : null);
    if (stored) {
      stored.isSoloPracticeEnabled = soloEnabled;
      stored.isProfileCompleted = profileDone;
      if (resolution?.practitionerId && resolution.practitionerId > 0) {
        stored.practitionerId = resolution.practitionerId;
      }
      localStorage.setItem('user', JSON.stringify(stored));
    }
    if (userData && userData !== stored) {
      userData.isSoloPracticeEnabled = soloEnabled;
      userData.isProfileCompleted = profileDone;
      if (resolution?.practitionerId && resolution.practitionerId > 0) {
        userData.practitionerId = resolution.practitionerId;
      }
    }
  }

  hasSoloWorkspace(): boolean {
    return this.availableWorkspaces().some(w => w.workspaceType === 'Solo');
  }

  canSetupSoloProfile(): boolean {
    if (!this.isLoggedIn()) return false;
    const roleId = this.getRoleId();
    const pracId = Number(this.getPractitionerId() ?? 0);
    return (roleId === 2 || pracId > 0) && !this.hasSoloWorkspace();
  }

  setAvailableWorkspaces(workspaces: UserWorkspaceItemDto[], practitionerId?: number | null): void {
    const list = workspaces ?? [];
    this.availableWorkspaces.set(list);
    if (list.some(w => w.workspaceType === 'Solo')) {
      this.isSoloPracticeEnabled.set(true);
    }
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

  isReceptionistWorkspace(): boolean {
    const ws = this.activeWorkspace();
    if (ws) {
      return (
        ws.workspaceType === 'Clinic' &&
        (ws.accessLevel || '').toLowerCase() === 'receptionist'
      );
    }
    const user = this.getCurrentUser();
    return (
      user?.workspaceType === 'Clinic' &&
      (user?.workspaceAccessLevel || '').toLowerCase() === 'receptionist'
    );
  }

  getAssignedBranchIdsForActiveClinic(): number[] {
    const active = this.activeWorkspace();
    const targetClinicId = Number(active?.clinicId ?? this.getClinicId() ?? 0);
    const ids = new Set<number>();

    if (active?.branchId && Number(active.branchId) > 0) {
      ids.add(Number(active.branchId));
    }

    for (const ws of this.availableWorkspaces()) {
      if (
        ws.workspaceType === 'Clinic' &&
        (ws.accessLevel || '').toLowerCase() === 'receptionist' &&
        (targetClinicId <= 0 || Number(ws.clinicId || 0) === targetClinicId) &&
        ws.branchId &&
        Number(ws.branchId) > 0
      ) {
        ids.add(Number(ws.branchId));
      }
    }

    return Array.from(ids);
  }

  /**
   * Returns true only when the user is operating in a Clinic front-desk/management
   * context (Clinic Owner, Receptionist, Manager, or Staff) where assigning a
   * treating practitioner is applicable. Returns false for Solo Practitioners.
   */
  canAssignPractitioner(): boolean {
    const ws = this.activeWorkspace();
    if (ws) {
      if (ws.workspaceType !== 'Clinic') {
        return false;
      }
      const level = (ws.accessLevel || '').toLowerCase();
      return level === 'owner' || level === 'receptionist' || level === 'manager' || level === 'staff';
    }

    const user = this.getCurrentUser();
    const wsType = user?.workspaceType;
    if (wsType) {
      if (wsType !== 'Clinic') {
        return false;
      }
      const level = (user?.workspaceAccessLevel || '').toLowerCase();
      return level === 'owner' || level === 'receptionist' || level === 'manager' || level === 'staff';
    }

    const roleId = Number(this.getRoleId() ?? user?.roleId ?? 0);
    if (roleId === 3) {
      return true;
    }

    return Number(user?.clinicId ?? 0) > 0 && !Number(user?.practitionerId ?? 0);
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
    this.verifiedTokenCache = null;
    this.inFlightVerifyPromise = null;
    localStorage.removeItem('parentId');
    localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    localStorage.removeItem(AVAILABLE_WORKSPACES_KEY);
    this.activeWorkspace.set(null);
    this.availableWorkspaces.set([]);
    this.isSoloPracticeEnabled.set(Boolean(userData?.isSoloPracticeEnabled));
    this.isProfileCompleted.set(Boolean(userData?.isProfileCompleted));
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    const resolvedToken = normalizeTokenString(token) ?? normalizeTokenString(userData?.token);
    if (resolvedToken) {
      localStorage.setItem('token', resolvedToken);
      if (isJwtTokenValid(resolvedToken)) {
        this.verifiedTokenCache = resolvedToken;
      }
    } else {
      localStorage.removeItem('token');
    }
  }

  logout(): void {
    this.clearPendingUserId();
    this.verifiedTokenCache = null;
    this.inFlightVerifyPromise = null;
    this.activeWorkspace.set(null);
    this.availableWorkspaces.set([]);
    this.isSoloPracticeEnabled.set(false);
    this.isProfileCompleted.set(false);
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
