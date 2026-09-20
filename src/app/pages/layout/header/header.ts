import { Component, OnInit, HostListener, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SharedModule } from '../../../shared/shared-module';
import { environment } from '../../../environment/environment';
import { Sidebar } from '../sidebar/sidebar';
import { BaseComponent } from '../../../helper/base-component';
import { MenusModel } from '../../../models/mastermodel';
import { ApiEndPoints } from '../../../helper/api-endpoints';

@Component({
  selector: 'app-header',
  imports: [SharedModule, Sidebar],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header extends BaseComponent implements OnInit {

  menulist: MenusModel[] = [];
  selectedParentMenuId: number | null = null;
  profileDropdownOpen = false;
  baseImageUrl = environment.baseImageUrl;

  private sanitizer = inject(DomSanitizer);

  async ngOnInit(): Promise<void> {

    if (this.isLoggedIn) {
      await this.GetAllMenu();
      this.setParentMenuFromRoute();
    }

    this.router.events.subscribe(() => {

      if (!this.isLoggedIn) {
        return;
      }

      this.setParentMenuFromRoute();

    });
  }
  private setParentMenuFromRoute(): void {

    const currentUrl = this.router.url.split('?')[0];

    const currentMenu = this.menulist.find(menu => {

      if (!menu.path) {
        return false;
      }

      const menuPath = menu.path.split('?')[0];

      return currentUrl === menuPath ||
        currentUrl.startsWith(menuPath + '/');
    });

    if (currentMenu) {
      this.selectedParentMenuId = currentMenu.menuId ?? null;
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
    const pic = this.currentUser?.profilePictureUrl || this.currentUser?.profileImage;
    if (!pic) return null;
    if (pic.startsWith('http')) return pic;
    return this.baseImageUrl + pic;
  }

  get profileRoute(): string {
    if (this.currentUser?.practitionerId || this.currentUser?.roleId === 2) {
      return '/doctor-dashboard';
    }
    return '/user-dashboard';
  }

  async toggleProfileDropdown(event: Event): Promise<void> {
    event.stopPropagation();
    this.profileDropdownOpen = !this.profileDropdownOpen;
    if (this.profileDropdownOpen && this.isLoggedIn && (!this.menulist || this.menulist.length === 0)) {
      await this.GetAllMenu();
    }
  }

  @HostListener('document:click')
  closeProfileDropdown(): void {
    this.profileDropdownOpen = false;
  }

  selectMenuItem(item: MenusModel): void {
    if (item.menuName == "Logout") {
      this.logout();
      return;
    }
    this.selectedParentMenuId = item.menuId ?? null;
    this.profileDropdownOpen = false;

  }


  navigateTo(path: string): void {
    this.profileDropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.menulist = [];
    this.profileDropdownOpen = false;
    this.router.navigate(['/']);
  }

  async GetAllMenu(): Promise<void> {

    if (!this.isLoggedIn) {
      return;
    }
    const res = await this.apiService.Get<MenusModel[]>(
      `${ApiEndPoints.GetAllMenu}?Type=Profile`
    );

    this.menulist = res.isSuccess ? (res.data ?? []) : [];

    this.setParentMenuFromRoute();
  }

  isSvgIcon(icon?: string): boolean {
    return !!icon && icon.trim().startsWith('<svg');
  }

  getSafeIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }
}
