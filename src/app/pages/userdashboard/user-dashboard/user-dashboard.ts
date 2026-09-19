import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Authservice } from '../../../services/authservice';
import { Userservice } from '../../../services/userservice';
import { MyBooking, ConsultancyItem, SubscriptionPlanItem } from '../../../models/usermode';
import { UserSubscription } from '../../../models/practitioner.model';

// Child components
import { PatientAppointments } from '../patient-appointments/patient-appointments';
import { PatientConsultancy } from '../patient-consultancy/patient-consultancy';
import { PatientSubscription } from '../patient-subscription/patient-subscription';
import { PatientMedicalrecords } from '../patient-medicalrecords/patient-medicalrecords';
import { PatientTransaction } from '../patient-transaction/patient-transaction';
import { Sidebar } from '../../layout/sidebar/sidebar';

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
    Sidebar,
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

  subscriptionPlans: SubscriptionPlanItem[] = [
    {
      id: 'PLAN-001', title: 'Advanced Physiotherapy Plan', doctorName: 'Dr. Himanshu suman',
      providerType: 'Practitioner', iconType: 'physio', status: 'Approval Pending', statusType: 'pending',
      startDate: '-', expiryDate: '-', totalSessions: 8, completedSessions: 0, remainingSessions: 8,
      totalAmount: 4000, totalDue: 4000, paidAmount: 0, outstanding: 4000,
      paymentStatus: 'Pending', paymentStatusLabel: 'Not Paid', progressPercent: 0, isExpanded: true
    },
    {
      id: 'PLAN-002', title: 'Knee Rehabilitation Plan', doctorName: 'Dr. Sarah Jenkins',
      providerType: 'Practitioner', iconType: 'knee', status: 'In Progress', statusType: 'in-progress',
      startDate: '10 May 2025', expiryDate: '10 Jul 2025', totalSessions: 12, completedSessions: 5,
      remainingSessions: 7, totalAmount: 6000, totalDue: 6500, paidAmount: 2500, outstanding: 4000,
      paymentStatus: 'Partial', paymentStatusLabel: 'Partially Paid', progressPercent: 41, isExpanded: true
    }
  ];

  consultancies: ConsultancyItem[] = [
    {
      id: 'CNS-009', bookingId: 9, slotId: 9, doctorName: 'Dr. Himanshu suman',
      assignedPractitionerName: 'Dr. Himanshu suman', assignmentStatus: 'Assigned',
      specialization: 'Orthopedic & Joint Physiotherapy', date: '04 Sep 2026', slotDate: '04 Sep 2026',
      dayOfWeek: 'Friday', time: '09:30 AM - 12:30 PM', startTime: '09:30 AM', endTime: '12:30 PM',
      mode: 'In-Clinic', visitType: 'Clinic', clinicName: 'Not specified', clinicAddress: 'Not specified',
      diagnosis: 'Lumbar radiculopathy & joint mobilization', status: 'Scheduled',
      prescriptionAvailable: true, notes: 'joint pain', bookedAt: '31 Aug 2026, 06:59 PM', isExpanded: false
    },
    {
      id: 'CNS-301', bookingId: 14, slotId: 14, doctorName: 'Dr. Sarah Jenkins',
      assignedPractitionerName: 'Dr. Sarah Jenkins', assignmentStatus: 'Assigned',
      specialization: 'Orthopedic Physiotherapy & Spine Care', date: '08 Sep 2026', slotDate: '08 Sep 2026',
      dayOfWeek: 'Tuesday', time: '04:30 PM - 05:15 PM', startTime: '04:30 PM', endTime: '05:15 PM',
      mode: 'Video Call', visitType: 'Video Call', clinicName: 'Physiosmate Tele-Rehab Hub',
      clinicAddress: 'Online Room #4', diagnosis: 'Lumbar radiculopathy management',
      status: 'Upcoming', prescriptionAvailable: true,
      notes: 'Please keep an exercise mat ready and ensure camera has full body visibility.',
      bookedAt: '01 Sep 2026, 11:20 AM', isExpanded: false
    },
    {
      id: 'CNS-302', bookingId: 8, slotId: 8, doctorName: 'Dr. Rajesh Mehta',
      assignedPractitionerName: 'Dr. Rajesh Mehta', assignmentStatus: 'Assigned',
      specialization: 'Sports Rehab & Ergonomics Specialist', date: '02 Aug 2026', slotDate: '02 Aug 2026',
      dayOfWeek: 'Sunday', time: '06:00 PM - 06:30 PM', startTime: '06:00 PM', endTime: '06:30 PM',
      mode: 'In-Clinic', visitType: 'Clinic', clinicName: 'Apex Physio & Wellness Clinic',
      clinicAddress: 'Suite 204, Metro Plaza', diagnosis: 'Postural neck kyphosis & forward head syndrome',
      status: 'Completed', prescriptionAvailable: true,
      notes: 'Chin tucks and scapular retractions recommended 3x daily.',
      bookedAt: '28 Jul 2026, 03:40 PM', isExpanded: false
    }
  ];

  ngOnInit(): void {
    this.initUser();
    this.resolveTabFromRoute();
    this.fetchData();
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
    'appointments':         'appointments',
    'medical-records':      'medical-reports',
    'consultations':        'consultancies',
    'online-consultations': 'consultancies',
    'subscriptions':        'subscriptions',
    'payments':             'payments',
  };

  /** Map each tab → the URL path segment it should navigate to */
  private readonly tabToPath: Record<DashboardTab, string> = {
    'appointments':   'appointments',
    'medical-reports':'medical-records',
    'consultancies':  'consultations',
    'subscriptions':  'subscriptions',
    'payments':       'payments',
  };

  resolveTabFromRoute(): void {
    // Read the last path segment of the current URL (ignores query params)
    this.route.url.subscribe(segments => {
      const lastSegment = segments[segments.length - 1]?.path || '';
      const matched = this.pathToTab[lastSegment];
      if (matched) {
        this.activeTab = matched;
      } else {
        this.activeTab = 'appointments'; // default
      }
    });
  }

  fetchData(): void {
    if (this.isLoggedIn) {
      this.isLoading = true;
      this.userService.GetMyBookings().subscribe({
        next: (res: any) => {
          if (res && res.data && res.data.length > 0) {
            this.bookings = res.data;
            this.consultancies = this.mapBookingsToConsultancies(res.data);
          }
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; }
      });

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

  selectTab(tab: DashboardTab): void {
    this.activeTab = tab;
    const path = this.tabToPath[tab] || '';
    this.router.navigate(['/user-dashboard', path]);
    window.scrollTo(0, 0);
  }

  get userInitials(): string {
    const name = this.currentUser?.fullName || 'Himanshu Suman';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  mapBookingsToConsultancies(bookings: MyBooking[]): ConsultancyItem[] {
    return bookings.map((b, index) => {
      let dayOfWeek = 'Friday';
      let formattedDate = b.slotDate || '';
      if (b.slotDate) {
        try {
          const d = new Date(b.slotDate);
          if (!isNaN(d.getTime())) {
            dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
            formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          }
        } catch { }
      }
      const practitioner = b.assignedPractitionerName || b.practitionerName || 'Dr. Himanshu suman';
      const timeRange = b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : (b.startTime || '09:30 AM - 12:30 PM');
      return {
        id: 'CNS-' + (b.bookingId || index + 1),
        bookingId: b.bookingId || b.slotId || (index + 1),
        slotId: b.slotId || b.bookingId || (index + 1),
        doctorName: practitioner,
        assignedPractitionerName: practitioner,
        assignmentStatus: b.assignmentStatus || 'Assigned',
        specialization: 'Physiotherapy & Rehabilitation',
        date: formattedDate,
        slotDate: formattedDate,
        dayOfWeek,
        time: timeRange,
        startTime: b.startTime || '09:30 AM',
        endTime: b.endTime || '12:30 PM',
        mode: (b.visitType as any) || 'In-Clinic',
        visitType: b.visitType || 'Clinic',
        clinicName: b.clinicName || 'Not specified',
        clinicAddress: b.clinicAddress || 'Not specified',
        diagnosis: b.notes || 'General Assessment & Therapy',
        status: b.status || 'Scheduled',
        prescriptionAvailable: true,
        notes: b.notes || 'joint pain',
        bookedAt: b.bookedAt || '31 Aug 2026, 06:59 PM',
        isExpanded: index === 0
      };
    });
  }
}
