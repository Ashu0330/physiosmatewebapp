import { Component, OnInit, HostListener, inject } from '@angular/core';
import { SharedModule } from '../../../shared/shared-module';
import { Authservice } from '../../../services/authservice';
import { Router } from '@angular/router';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'app-header',
  imports: [SharedModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  private authService = inject(Authservice);
  private router = inject(Router);

  isLoggedIn = false;
  currentUser: any = null;
  profileDropdownOpen = false;
  baseImageUrl = environment.baseImageUrl;

  ngOnInit(): void {
    this.refreshAuthState();
  }

  refreshAuthState(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.currentUser = this.authService.getCurrentUser();
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

  toggleProfileDropdown(event: Event): void {
    event.stopPropagation();
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  @HostListener('document:click')
  closeProfileDropdown(): void {
    this.profileDropdownOpen = false;
  }

  navigateTo(path: string): void {
    this.profileDropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.currentUser = null;
    this.profileDropdownOpen = false;
    this.router.navigate(['/']);
  }
}
