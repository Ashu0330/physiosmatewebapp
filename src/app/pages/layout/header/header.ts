import { Component, OnInit, HostListener, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SharedModule } from '../../../shared/shared-module';
import { environment } from '../../../environment/environment';
import { Sidebar } from '../sidebar/sidebar';
import { BaseComponent } from '../../../helper/base-component';
import { MenusModel } from '../../../models/mastermodel';
import { UserWorkspaceItemDto } from '../../../models/clinic.model';
import { ApiEndPoints } from '../../../helper/api-endpoints';
import { ClinicRelationshipService } from '../../../services/clinic-relationship.service';

@Component({
  selector: 'app-header',
  imports: [SharedModule, Sidebar],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header extends BaseComponent implements OnInit {
  readonly menulist = signal<MenusModel[]>([]);
  readonly selectedParentMenuId = signal<number | null>(null);
  profileDropdownOpen = false;
  mobileMenuOpen = false;
  mobileProvidersOpen = false;
  mobileHelpOpen = false;
  mobileProfileOpen = false;
  baseImageUrl = environment.baseImageUrl;

  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);
  private relationshipService = inject(ClinicRelationshipService);

  readonly activeWorkspace = this.authService.activeWorkspace;
  readonly availableWorkspaces = this.authService.availableWorkspaces;
  readonly isProfileCompleted = this.authService.isProfileCompleted;

  get canSetupSoloProfile(): boolean {
    return this.authService.canSetupSoloProfile();
  }

  get soloSetupActionLabel(): string {
    return this.isProfileCompleted()
      ? 'Enable Solo Practitioner Profile'
      : 'Create Solo Professional Profile';
  }

  async ngOnInit(): Promise<void> {
    this.destroyRef.onDestroy(() => {
      this.unlockBodyScroll();
    });

    if (this.isLoggedIn) {
      await this.GetAllMenu();
      this.setParentMenuFromRoute();
      if (this.availableWorkspaces().length === 0) {
        this.loadAvailableWorkspaces();
      }
    }
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMobileMenu(); if (!this.isLoggedIn) {
          return;
        }
        this.setParentMenuFromRoute();
      });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) {
      this.profileDropdownOpen = false;
      this.lockBodyScroll();
    } else {
      this.unlockBodyScroll();
    }
  }

  closeMobileMenu(): void {
    if (this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
      this.mobileProfileOpen = false;
      this.unlockBodyScroll();
    }
  }

  toggleMobileProfile(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.mobileProfileOpen = !this.mobileProfileOpen;
  }

  toggleMobileProviders(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.mobileProvidersOpen = !this.mobileProvidersOpen;
  }

  toggleMobileHelp(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.mobileHelpOpen = !this.mobileHelpOpen;
  }

  private lockBodyScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.add('overflow-hidden');
    }
  }

  private unlockBodyScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('overflow-hidden');
    }
  }

  private setParentMenuFromRoute(): void {
    const currentUrl = this.cleanRoutePath(this.router.url);
    const menus = this.menulist();
    if (!menus.length || !currentUrl) {
      return;
    }

    const normalizedMenus = menus.map(menu => ({
      menu,
      path: this.cleanRoutePath(menu.path),
    }));

    // 1. Exact or child-prefix match (e.g. /doctor-dashboard/settings or /user-dashboard/appointments)
    let currentMenu = normalizedMenus.find(
      ({ path }) => !!path && (currentUrl === path || currentUrl.startsWith(path + '/'))
    )?.menu;

    // 2. Root-segment match only against dashboard entries (never let /doctor-dashboard/settings hijack shared /doctor-dashboard/* routes)
    if (!currentMenu) {
      const currentRoot = currentUrl.split('/').filter(Boolean)[0];
      if (currentRoot) {
        currentMenu = normalizedMenus.find(({ menu, path }) => {
          if (!path || path.endsWith('/settings') || (menu.menuName || '').toLowerCase().includes('setting')) {
            return false;
          }
          const menuRoot = path.split('/').filter(Boolean)[0];
          return !!menuRoot && menuRoot === currentRoot;
        })?.menu;
      }
    }

    // 3. Shared /doctor-dashboard/* routes accessed by Clinic role (RoleId = 3) keep/resolve Clinic Dashboard
    if (!currentMenu && currentUrl.startsWith('/doctor-dashboard/') && this.authService.getRoleId() === 3) {
      const currentSelected = this.selectedParentMenuId();
      if (currentSelected && currentSelected !== 12) {
        return;
      }
      currentMenu = normalizedMenus.find(
        ({ menu, path }) => menu.menuId === 22 || path.startsWith('/clinic-dashboard')
      )?.menu;
    }

    if (currentMenu) {
      this.selectedParentMenuId.set(currentMenu.menuId ?? null);
    }
  }

  get userInitials(): string {
    if (!this.currentUser?.fullName) return '?';
    const parts = this.currentUser.fullName.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  get profilePhotoUrl(): string | null {
    const pic =
      this.currentUser?.profilePictureUrl || this.currentUser?.profileImage;
    if (!pic) return null;
    if (pic.startsWith('http')) return pic;
    return this.baseImageUrl + pic;
  }

  getMenuRoutePath(item: MenusModel): string | null {
    const normalized = this.normalizeRoutePath(item.path);
    if (!normalized) {
      return null;
    }
    if (
      this.authService.isClinicPractitionerWorkspace() &&
      this.cleanRoutePath(normalized) === '/doctor-dashboard/dashboard'
    ) {
      return '/doctor-dashboard/consultations';
    }
    return normalized;
  }

  get profileRoute(): string {
    if (this.authService.isClinicPractitionerWorkspace()) {
      return '/doctor-dashboard/consultations';
    }
    if (this.authService.isReceptionistWorkspace()) {
      return this.authService.getWorkspaceNavigationRoute(
        this.authService.getActiveWorkspace(),
        this.currentUser?.roleId
      );
    }
    if (this.currentUser?.roleId === 3 || this.currentUser?.clinicId) {
      return '/clinic-dashboard/dashboard';
    }
    if (this.currentUser?.practitionerId || this.currentUser?.roleId === 2) {
      return '/doctor-dashboard';
    }
    return '/user-dashboard/medical-records';
  }

  async toggleProfileDropdown(event: Event): Promise<void> {
    event.stopPropagation();
    this.profileDropdownOpen = !this.profileDropdownOpen;
    if (this.profileDropdownOpen) {
      this.closeMobileMenu();
    }
    if (
      this.profileDropdownOpen &&
      this.isLoggedIn &&
      this.menulist().length === 0
    ) {
      await this.GetAllMenu();
    }
  }

  @HostListener('document:click')
  closeProfileDropdown(): void {
    this.profileDropdownOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeMobileMenu();
    this.profileDropdownOpen = false;
  }

  selectMenuItem(item: MenusModel): void {
    if (item.menuName == 'Logout') {
      this.logout();
      return;
    }
    this.selectedParentMenuId.set(item.menuId ?? null);
    this.profileDropdownOpen = false;
    this.closeMobileMenu();
  }

  navigateTo(path: string): void {
    this.profileDropdownOpen = false;
    this.closeMobileMenu();
  }

  logout(): void {
    this.authService.logout();
    this.menulist.set([]);
    this.selectedParentMenuId.set(null);
    this.profileDropdownOpen = false;
    this.closeMobileMenu();
    this.router.navigate(['/']);
  }

  async GetAllMenu(): Promise<void> {
    if (!this.isLoggedIn) {
      return;
    }
    const res = await this.apiService.Get<MenusModel[]>(
      `${ApiEndPoints.GetAllMenu}?Type=Profile`,
    );

    this.menulist.set(res.isSuccess ? (res.data ?? []) : []);

    this.setParentMenuFromRoute();
  }

  private async loadAvailableWorkspaces(): Promise<void> {
    try {
      const res = await this.relationshipService.resolveWorkspaces();
      if (res.isSuccess && res.data) {
        this.authService.buildProfileOptions(res.data, this.currentUser);
      }
    } catch {
      // Silently keep existing state if workspace discovery fails
    }
  }

  switchWorkspace(ws: UserWorkspaceItemDto): void {
    this.authService.setActiveWorkspace(ws);
    this.selectedParentMenuId.set(null);
    this.profileDropdownOpen = false;
    this.closeMobileMenu();
    const targetRoute = this.authService.getWorkspaceNavigationRoute(ws);
    this.router.navigate([targetRoute]).then(() => {
      this.setParentMenuFromRoute();
    });
  }

  async openOrEnableSoloProfile(): Promise<void> {
    this.profileDropdownOpen = false;
    this.closeMobileMenu();
    const user = this.authService.getCurrentUser();

    if (this.isProfileCompleted()) {
      const soloWs = await this.relationshipService.activateExistingSoloWorkspace(user);
      if (soloWs) {
        this.selectedParentMenuId.set(null);
        this.alert.toastSuccess('Switched to Solo Practitioner profile!');
        this.router.navigate(['/doctor-dashboard/dashboard']).then(() => {
          this.setParentMenuFromRoute();
        });
        return;
      }
    }

    this.relationshipService.prepareSoloProfileSetup(user);
    this.router.navigate(['/complete-solo-profile']);
  }

  isActiveWorkspace(ws: UserWorkspaceItemDto): boolean {
    return this.authService.isSameWorkspace(this.activeWorkspace(), ws);
  }

  getWorkspaceLabel(ws: UserWorkspaceItemDto): string {
    return this.authService.formatWorkspaceLabel(ws);
  }

  isSvgIcon(icon?: string): boolean {
    return !!icon && icon.trim().startsWith('<svg');
  }

  getSafeIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }
}
