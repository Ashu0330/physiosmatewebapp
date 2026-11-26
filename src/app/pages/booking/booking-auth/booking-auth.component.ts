import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExploreService } from '../../../services/explore.service';
import { Authservice } from '../../../services/authservice';
import { BookingService } from '../booking.service';
import { ProviderSummaryComponent } from '../provider-summary/provider-summary.component';
import { AuthFormComponent } from '../../../auth/auth-form/auth-form.component';

@Component({
  selector: 'app-booking-auth',
  standalone: true,
  imports: [CommonModule, RouterLink, ProviderSummaryComponent, AuthFormComponent],
  templateUrl: './booking-auth.component.html',
  styleUrl: './booking-auth.component.css'
})
export class BookingAuthComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private exploreService = inject(ExploreService);
  private authService = inject(Authservice);
  private bookingService = inject(BookingService);

  providerId: string | number = '';
  provider: any = null;
  loadingProvider = true;
  authMode: 'login' | 'signup' = 'login';

  ngOnInit(): void {
    // Check if user is already authenticated
    const pId = this.route.snapshot.paramMap.get('providerId') || '1';
    this.providerId = pId;

    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/doctor-detail', pId], {
        queryParams: { bookingConfirmed: 'true' },
        replaceUrl: true
      });
      return;
    }

    // Read query params for auth mode if provided (e.g. ?mode=signup)
    const modeParam = this.route.snapshot.queryParamMap.get('mode');
    if (modeParam === 'signup' || modeParam === 'login') {
      this.authMode = modeParam;
    }

    // Subscribe to route paramMap to get providerId
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('providerId');
      if (idParam) {
        this.providerId = idParam;
        this.loadProviderData(idParam);
      }
    });
  }

  loadProviderData(rawId: string): void {
    this.loadingProvider = true;
    const numericId = ExploreService.extractIdFromSlug(rawId) || parseInt(rawId, 10) || 1;
    const currentUserId = this.authService.getuserid() || 0;

    this.exploreService.getPractitionerById(numericId, currentUserId).subscribe({
      next: (res) => {
        this.loadingProvider = false;
        if (res && res.data) {
          this.provider = res.data;
          this.bookingService.setProvider(this.provider);
        } else {
          this.useFallbackProvider(numericId);
        }
      },
      error: () => {
        this.loadingProvider = false;
        this.useFallbackProvider(numericId);
      }
    });
  }

  private useFallbackProvider(id: number): void {
    const existing = this.bookingService.getPendingSlot();
    this.provider = {
      id: id,
      practitionerId: id,
      fullName: existing?.providerName || 'Healthcare Provider',
      name: existing?.providerName || 'Healthcare Provider',
      specialization: existing?.providerSpecialty || 'Physiotherapist',
      specialtyTitle: '(Physiotherapist)',
      avgRating: 0,
      totalReviews: 0,
      clinicName: existing?.clinicName || '',
      clinicAddress: existing?.clinicAddress || '',
      city: '',
      consultationFee: existing?.consultationFee || 0,
      photoUrl: existing?.providerImage || '',
      profileImage: existing?.providerImage || ''
    };
    this.bookingService.setProvider(this.provider);
  }

  onModeChange(mode: 'login' | 'signup'): void {
    this.authMode = mode;
  }

  onAuthSuccess(): void {
    // Redirect directly back to the doctor detailed page with the confirmed popup
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      const glue = returnUrl.includes('?') ? '&' : '?';
      this.router.navigateByUrl(`${returnUrl}${glue}bookingConfirmed=true`);
    } else {
      this.router.navigate(['/doctor-detail', this.providerId], {
        queryParams: { bookingConfirmed: 'true' }
      });
    }
  }
}
