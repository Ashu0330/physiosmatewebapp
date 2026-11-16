import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Authservice } from '../../../services/authservice';
import { Userservice } from '../../../services/userservice';
import { MyBooking } from '../../../models/usermode';
import { UserSubscription } from '../../../models/practitioner.model';

// Child components
import { PatientAppointments } from '../patient-appointments/patient-appointments';
import { PatientConsultancy } from '../patient-consultancy/patient-consultancy';
import { PatientSubscription } from '../patient-subscription/patient-subscription';
import { PatientMedicalrecords } from '../patient-medicalrecords/patient-medicalrecords';
import { PatientTransaction } from '../patient-transaction/patient-transaction';
import { SharedModule } from '../../../shared/shared-module';

export type DashboardTab =
  | 'appointments'
  | 'subscriptions'
  | 'payments'
  | 'medical-reports'
  | 'consultancies';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    PatientAppointments,
    PatientConsultancy,
    PatientSubscription,
    PatientMedicalrecords,
    PatientTransaction,
  ],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
})
export class UserDashboard implements OnInit {
  private authService = inject(Authservice);
  private userService = inject(Userservice);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeTab: DashboardTab = 'appointments';
  appointmentFilter: 'upcoming' | 'past' | 'all' = 'upcoming';
  isLoading = false;

  currentUser: any = null;
  isLoggedIn = false;

  bookings: MyBooking[] = [];
  userSubscriptions: UserSubscription[] = [];

  ngOnInit(): void {
    this.initUser();
    this.resolveTabFromRoute();
    this.getUserSubscriptions();
  }

  initUser(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    const storedUser = this.authService.getCurrentUser();
    if (storedUser) {
      this.currentUser = storedUser;
    } else {
      this.currentUser = {
        fullName: 'Himanshu Suman',
        mobile: '+919571670547',
        email: 'himanshu@physiosmate.com',
        profilePictureUrl: null
      };
    }
  }

  /** Map each URL path segment → the tab that should be active */
  private readonly pathToTab: Record<string, DashboardTab> = {
    'appointments': 'appointments',
    'medical-records': 'medical-reports',
    'consultations': 'consultancies',
    'online-consultations': 'consultancies',
    'subscriptions': 'subscriptions',
    'payments': 'payments',
  };

  /** Map each tab → the URL path segment it should navigate to */
  private readonly tabToPath: Record<DashboardTab, string> = {
    'appointments': 'appointments',
    'medical-reports': 'medical-records',
    'consultancies': 'consultations',
    'subscriptions': 'subscriptions',
    'payments': 'payments',
  };

  resolveTabFromRoute(): void {
    this.updateTabFromUrl(this.router.url);

    this.route.url.subscribe(() => {
      this.updateTabFromUrl(this.router.url);
    });

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {
      this.updateTabFromUrl(e.urlAfterRedirects || e.url);
    });
  }

  private updateTabFromUrl(url: string): void {
    const cleanUrl = (url || '').split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || '';

    const matched = this.pathToTab[lastSegment];
    if (matched) {
      this.activeTab = matched;
    } else if (cleanUrl.includes('/consultations') || cleanUrl.includes('/online-consultations')) {
      this.activeTab = 'consultancies';
    } else if (cleanUrl.includes('/medical-records')) {
      this.activeTab = 'medical-reports';
    } else if (cleanUrl.includes('/subscriptions')) {
      this.activeTab = 'subscriptions';
    } else if (cleanUrl.includes('/payments')) {
      this.activeTab = 'payments';
    } else {
      this.activeTab = 'appointments';
    }
  }

  getUserSubscriptions(): void {
    if (this.isLoggedIn) {
      const userId = this.authService.getuserid() || this.currentUser?.id;
      if (userId) {
        this.userService.GetUserSubscription({ userId }).subscribe({
          next: (res: any) => {
            if (res && res.data && res.data.length > 0) {
              this.userSubscriptions = res.data;
            }
          },
          error: () => { }
        });
      }
    }
  }
}
