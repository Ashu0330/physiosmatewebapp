import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { Userservice } from '../../services/userservice';
import { ConsultancyItem, DayExercise, DayPlan, MedicalReportItem, MyBooking, PaymentItems } from '../../models/usermode';
import { UserSubscription } from '../../models/practitioner.model';

export type DashboardTab =
  | 'appointments'
  | 'subscriptions'
  | 'payments'
  | 'medical-reports'
  | 'consultancies'
  | 'weekly-plan';


@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
})
export class UserDashboard implements OnInit {
  private authService = inject(Authservice);
  private userService = inject(Userservice);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Active section tab
  activeTab: DashboardTab = 'appointments';

  // Appointments sub-filter
  appointmentFilter: 'upcoming' | 'past' | 'all' = 'upcoming';

  // Loading state
  isLoading = false;

  // Current user info
  currentUser: any = null;
  isLoggedIn = false;

  // Modals state
  showUploadModal = false;
  showInvoiceModal = false;
  selectedPayment: PaymentItems | null = null;
  selectedConsultancy: ConsultancyItem | null = null;
  showConsultancyModal = false;

  // New report form model
  newReport = {
    title: '',
    category: 'Assessment' as MedicalReportItem['category'],
    doctorName: '',
    date: new Date().toISOString().split('T')[0],
  };

  // Weekly plan state
  selectedDayIndex = 0; // Monday by default
  painLevel = 3;

  // Data arrays
  bookings: MyBooking[] = [];
  userSubscriptions: UserSubscription[] = [];

  payments: PaymentItems[] = [
    {
      id: 'PAY-8921',
      invoiceNumber: 'INV-2026-0089',
      title: 'Initial Spine & Posture Assessment',
      providerName: 'Dr. Sarah Jenkins, PT',
      date: '28 Aug 2026',
      amount: 1200,
      paymentMethod: 'UPI / GPay',
      status: 'Successful'
    },
    {
      id: 'PAY-8714',
      invoiceNumber: 'INV-2026-0072',
      title: '12-Session Post-Surgery Rehab Package',
      providerName: 'Apex Physio & Wellness Clinic',
      date: '15 Aug 2026',
      amount: 6500,
      paymentMethod: 'Credit Card (HDFC)',
      status: 'Successful'
    },
    {
      id: 'PAY-8501',
      invoiceNumber: 'INV-2026-0041',
      title: 'Online Video Ergonomics Follow-up',
      providerName: 'Dr. Rajesh Mehta, MPT',
      date: '02 Aug 2026',
      amount: 600,
      paymentMethod: 'NetBanking (ICICI)',
      status: 'Successful'
    },
    {
      id: 'PAY-8319',
      invoiceNumber: 'INV-2026-0019',
      title: 'Knee Joint Mobilization Session',
      providerName: 'Relief Point Therapy Center',
      date: '19 Jul 2026',
      amount: 950,
      paymentMethod: 'UPI / PhonePe',
      status: 'Refunded'
    }
  ];

  medicalReports: MedicalReportItem[] = [
    {
      id: 'REP-101',
      title: 'Lumbar Spine Comprehensive Biomechanical Assessment',
      category: 'Assessment',
      doctorName: 'Dr. Sarah Jenkins',
      date: '28 Aug 2026',
      fileSize: '1.8 MB',
      fileType: 'pdf'
    },
    {
      id: 'REP-102',
      title: 'MRI Lumbo-Sacral Spine (L4-L5 Disc Bulge Scan)',
      category: 'X-Ray / MRI',
      doctorName: 'City Imaging & Diagnostics',
      date: '14 Aug 2026',
      fileSize: '4.2 MB',
      fileType: 'pdf'
    },
    {
      id: 'REP-103',
      title: 'Rehabilitation Protocol & Pain Management Prescription',
      category: 'Prescription',
      doctorName: 'Dr. Rajesh Mehta',
      date: '02 Aug 2026',
      fileSize: '640 KB',
      fileType: 'pdf'
    },
    {
      id: 'REP-104',
      title: 'Initial Muscle Strength & Range-of-Motion Evaluation',
      category: 'Assessment',
      doctorName: 'Apex Physio Clinic',
      date: '18 Jul 2026',
      fileSize: '950 KB',
      fileType: 'pdf'
    }
  ];

  consultancies: ConsultancyItem[] = [
    {
      id: 'CNS-009',
      bookingId: 9,
      slotId: 9,
      doctorName: 'Dr. Himanshu suman',
      assignedPractitionerName: 'Dr. Himanshu suman',
      assignmentStatus: 'Assigned',
      specialization: 'Orthopedic & Joint Physiotherapy',
      date: '04 Sep 2026',
      slotDate: '04 Sep 2026',
      dayOfWeek: 'Friday',
      time: '09:30 AM - 12:30 PM',
      startTime: '09:30 AM',
      endTime: '12:30 PM',
      mode: 'In-Clinic',
      visitType: 'Clinic',
      clinicName: 'Not specified',
      clinicAddress: 'Not specified',
      diagnosis: 'Lumbar radiculopathy & joint mobilization',
      status: 'Scheduled',
      prescriptionAvailable: true,
      notes: 'joint pain',
      bookedAt: '31 Aug 2026, 06:59 PM',
      isExpanded: true
    },
    {
      id: 'CNS-301',
      bookingId: 14,
      slotId: 14,
      doctorName: 'Dr. Sarah Jenkins',
      assignedPractitionerName: 'Dr. Sarah Jenkins',
      assignmentStatus: 'Assigned',
      specialization: 'Orthopedic Physiotherapy & Spine Care',
      date: '08 Sep 2026',
      slotDate: '08 Sep 2026',
      dayOfWeek: 'Tuesday',
      time: '04:30 PM - 05:15 PM',
      startTime: '04:30 PM',
      endTime: '05:15 PM',
      mode: 'Video Call',
      visitType: 'Video Call',
      clinicName: 'Physiosmate Tele-Rehab Hub',
      clinicAddress: 'Online Room #4',
      diagnosis: 'Lumbar radiculopathy management, core stabilizer engagement review',
      status: 'Upcoming',
      prescriptionAvailable: true,
      notes: 'Please keep an exercise mat ready and ensure camera has full body visibility.',
      bookedAt: '01 Sep 2026, 11:20 AM',
      isExpanded: false
    },
    {
      id: 'CNS-302',
      bookingId: 8,
      slotId: 8,
      doctorName: 'Dr. Rajesh Mehta',
      assignedPractitionerName: 'Dr. Rajesh Mehta',
      assignmentStatus: 'Assigned',
      specialization: 'Sports Rehab & Ergonomics Specialist',
      date: '02 Aug 2026',
      slotDate: '02 Aug 2026',
      dayOfWeek: 'Sunday',
      time: '06:00 PM - 06:30 PM',
      startTime: '06:00 PM',
      endTime: '06:30 PM',
      mode: 'In-Clinic',
      visitType: 'Clinic',
      clinicName: 'Apex Physio & Wellness Clinic',
      clinicAddress: 'Suite 204, Metro Plaza',
      diagnosis: 'Postural neck kyphosis & forward head syndrome',
      status: 'Completed',
      prescriptionAvailable: true,
      notes: 'Ergonomic screen height adjusted. Chin tucks and scapular retractions recommended 3x daily.',
      bookedAt: '28 Jul 2026, 03:40 PM',
      isExpanded: false
    }
  ];

  weeklyPlan: DayPlan[] = [
    {
      dayName: 'Monday',
      dayShort: 'Mon',
      dayNumber: 1,
      focus: 'Lumbar Mobility & Core Activation',
      exercises: [
        {
          id: 'ex-1',
          name: 'Cat-Camel Spinal Mobilization',
          targetArea: 'Spine & Paraspinal Muscles',
          sets: '3 sets × 12 reps',
          duration: '5 mins',
          difficulty: 'Beginner',
          notes: 'Move fluidly with your breath. Inhale on arch, exhale on tuck.',
          completed: true
        },
        {
          id: 'ex-2',
          name: 'Bird-Dog Core Stability',
          targetArea: 'Transverse Abdominis & Glutes',
          sets: '3 sets × 10 reps each side',
          duration: '6 mins',
          difficulty: 'Beginner',
          notes: 'Keep hips completely level without rotating the pelvis.',
          completed: true
        },
        {
          id: 'ex-3',
          name: 'Pelvic Tilts on Mat',
          targetArea: 'Lower Abdominals & Pelvis',
          sets: '2 sets × 15 reps',
          duration: '4 mins',
          difficulty: 'Beginner',
          notes: 'Flatten lower back firmly into the floor.',
          completed: true
        }
      ]
    },
    {
      dayName: 'Tuesday',
      dayShort: 'Tue',
      dayNumber: 2,
      focus: 'Hip Flexor & Hamstring Release',
      exercises: [
        {
          id: 'ex-4',
          name: 'Supine Hamstring Stretch with Strap',
          targetArea: 'Hamstrings & Posterior Chain',
          sets: '3 sets × 30s holds',
          duration: '5 mins',
          difficulty: 'Beginner',
          notes: 'Keep opposite knee straight against the floor.',
          completed: true
        },
        {
          id: 'ex-5',
          name: 'Half-Kneeling Hip Flexor Stretch',
          targetArea: 'Psoas & Quad Complex',
          sets: '3 sets × 30s holds',
          duration: '6 mins',
          difficulty: 'Moderate',
          notes: 'Tuck pelvis under before gently leaning forward.',
          completed: false
        },
        {
          id: 'ex-6',
          name: 'Glute Bridge with 3s Pause',
          targetArea: 'Gluteus Maximus & Hamstrings',
          sets: '3 sets × 12 reps',
          duration: '5 mins',
          difficulty: 'Beginner',
          notes: 'Drive purely through your heels, not lower back.',
          completed: false
        }
      ]
    },
    {
      dayName: 'Wednesday',
      dayShort: 'Wed',
      dayNumber: 3,
      focus: 'Active Rest & Gentle Walking',
      exercises: [
        {
          id: 'ex-7',
          name: 'Brisk Low-Impact Walk',
          targetArea: 'Cardiovascular & Joint Lubrication',
          sets: '1 continuous block',
          duration: '25 mins',
          difficulty: 'Beginner',
          notes: 'Maintain tall upright posture with natural arm swing.',
          completed: false
        },
        {
          id: 'ex-8',
          name: 'Thoracic Foam Rolling',
          targetArea: 'Mid-Back & Shoulder Blades',
          sets: '2 sets × 60s',
          duration: '4 mins',
          difficulty: 'Beginner',
          notes: 'Avoid rolling onto the lower lumbar area.',
          completed: false
        }
      ]
    },
    {
      dayName: 'Thursday',
      dayShort: 'Thu',
      dayNumber: 4,
      focus: 'Dynamic Core & Posterior Chain',
      exercises: [
        {
          id: 'ex-9',
          name: 'Dead Bug Arm & Leg Reaches',
          targetArea: 'Deep Core Stabilizers',
          sets: '3 sets × 10 reps each side',
          duration: '7 mins',
          difficulty: 'Moderate',
          notes: 'Maintain constant lower-back contact with the ground.',
          completed: false
        },
        {
          id: 'ex-10',
          name: 'Prone Cobra Extension',
          targetArea: 'Mid-Back & Scapular Retractors',
          sets: '3 sets × 10 reps (5s hold)',
          duration: '5 mins',
          difficulty: 'Moderate',
          notes: 'Focus on pinching shoulder blades downward.',
          completed: false
        },
        {
          id: 'ex-11',
          name: 'Clamshell with Resistance Band',
          targetArea: 'Gluteus Medius',
          sets: '3 sets × 15 reps each side',
          duration: '6 mins',
          difficulty: 'Moderate',
          notes: 'Do not allow upper hip to roll backwards.',
          completed: false
        }
      ]
    },
    {
      dayName: 'Friday',
      dayShort: 'Fri',
      dayNumber: 5,
      focus: 'Functional Movement & Posture',
      exercises: [
        {
          id: 'ex-12',
          name: 'Wall Angels for Posture',
          targetArea: 'Scapula & Upper Spine',
          sets: '3 sets × 10 reps',
          duration: '5 mins',
          difficulty: 'Beginner',
          notes: 'Keep elbows and wrists flat against the wall.',
          completed: false
        },
        {
          id: 'ex-13',
          name: 'Bodyweight Box Squat with Good Form',
          targetArea: 'Quads, Glutes & Hip Hinge',
          sets: '3 sets × 12 reps',
          duration: '6 mins',
          difficulty: 'Moderate',
          notes: 'Sit hips back onto bench without spinal collapse.',
          completed: false
        }
      ]
    },
    {
      dayName: 'Saturday',
      dayShort: 'Sat',
      dayNumber: 6,
      focus: 'Deep Stretching & Recovery Flow',
      exercises: [
        {
          id: 'ex-14',
          name: 'Child’s Pose with Lat Reach',
          targetArea: 'Thoracolumbar Fascia & Lats',
          sets: '3 sets × 45s holds',
          duration: '6 mins',
          difficulty: 'Beginner',
          notes: 'Deep diaphragmatic breathing into the lower ribs.',
          completed: false
        },
        {
          id: 'ex-15',
          name: 'Piriformis Figure-4 Stretch',
          targetArea: 'Deep Hip Rotators & Sciatic Path',
          sets: '3 sets × 30s each side',
          duration: '5 mins',
          difficulty: 'Beginner',
          notes: 'Keep neck relaxed on mat.',
          completed: false
        }
      ]
    },
    {
      dayName: 'Sunday',
      dayShort: 'Sun',
      dayNumber: 7,
      focus: 'Complete Rest & Recovery Check-in',
      exercises: [
        {
          id: 'ex-16',
          name: 'Hot/Cold Contrast Compress & Hydration',
          targetArea: 'Whole Body Recovery',
          sets: '1 routine',
          duration: '15 mins',
          difficulty: 'Beginner',
          notes: 'Log your weekly pain and mobility feedback.',
          completed: false
        }
      ]
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
      // Demonstration user matching the requested panel screenshot
      this.currentUser = {
        fullName: 'Himanshu Suman',
        mobile: '+919571670547',
        email: 'himanshu@physiosmate.com',
        profilePictureUrl: null
      };
    }
  }

  resolveTabFromRoute(): void {
    // Check path or query param
    const path = this.router.url.split('?')[0];
    if (path.includes('appointments')) {
      this.activeTab = 'appointments';
    } else if (path.includes('medical-records') || path.includes('medical-reports')) {
      this.activeTab = 'medical-reports';
    } else if (path.includes('consultations') || path.includes('consultancies')) {
      this.activeTab = 'consultancies';
    }

    this.route.queryParamMap.subscribe(params => {
      const tabParam = params.get('tab') as DashboardTab;
      if (tabParam && ['appointments', 'subscriptions', 'payments', 'medical-reports', 'consultancies', 'weekly-plan'].includes(tabParam)) {
        this.activeTab = tabParam;
      }
      const filterParam = params.get('filter');
      if (filterParam === 'upcoming' || filterParam === 'past' || filterParam === 'all') {
        this.appointmentFilter = filterParam;
      }
    });
  }

  fetchData(): void {
    if (this.isLoggedIn) {
      this.isLoading = true;
      // Fetch bookings
      this.userService.GetMyBookings().subscribe({
        next: (res) => {
          if (res && res.data && res.data.length > 0) {
            this.bookings = res.data;
            this.consultancies = this.mapBookingsToConsultancies(res.data);
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });

      // Fetch subscriptions
      const userId = this.authService.getuserid() || this.currentUser?.id;
      if (userId) {
        this.userService.GetUserSubscription({ userId }).subscribe({
          next: (res) => {
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
    // Update query param without reloading page
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  setAppointmentFilter(filter: 'upcoming' | 'past' | 'all'): void {
    this.appointmentFilter = filter;
  }

  get filteredBookings(): MyBooking[] {
    if (!this.bookings || this.bookings.length === 0) return [];
    const today = new Date().toISOString().split('T')[0];
    if (this.appointmentFilter === 'upcoming') {
      return this.bookings.filter(b => b.slotDate >= today && b.status !== 'Cancelled');
    }
    if (this.appointmentFilter === 'past') {
      return this.bookings.filter(b => b.slotDate < today || b.status === 'Completed');
    }
    return this.bookings;
  }

  get userInitials(): string {
    const name = this.currentUser?.fullName || 'Himanshu Suman';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  // Weekly plan helpers
  get currentDayPlan(): DayPlan {
    return this.weeklyPlan[this.selectedDayIndex];
  }

  selectDay(index: number): void {
    this.selectedDayIndex = index;
  }

  toggleExercise(exercise: DayExercise): void {
    exercise.completed = !exercise.completed;
  }

  get weeklyCompletionRate(): number {
    let total = 0;
    let completed = 0;
    for (const day of this.weeklyPlan) {
      for (const ex of day.exercises) {
        total++;
        if (ex.completed) completed++;
      }
    }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  get completedDaysCount(): number {
    return this.weeklyPlan.filter(d => d.exercises.every(e => e.completed)).length;
  }

  // Modals & Actions
  openUploadModal(): void {
    this.newReport = {
      title: '',
      category: 'Assessment',
      doctorName: '',
      date: new Date().toISOString().split('T')[0],
    };
    this.showUploadModal = true;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
  }

  saveReport(): void {
    if (!this.newReport.title.trim()) return;
    const newDoc: MedicalReportItem = {
      id: 'REP-' + Math.floor(100 + Math.random() * 900),
      title: this.newReport.title,
      category: this.newReport.category,
      doctorName: this.newReport.doctorName || 'Self Uploaded',
      date: new Date(this.newReport.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      fileSize: '1.2 MB',
      fileType: 'pdf'
    };
    this.medicalReports.unshift(newDoc);
    this.closeUploadModal();
  }

  openInvoice(payment: PaymentItems): void {
    this.selectedPayment = payment;
    this.showInvoiceModal = true;
  }

  closeInvoice(): void {
    this.showInvoiceModal = false;
    this.selectedPayment = null;
  }

  openConsultancyDetails(item: ConsultancyItem): void {
    this.selectedConsultancy = item;
    this.showConsultancyModal = true;
  }

  closeConsultancyDetails(): void {
    this.showConsultancyModal = false;
    this.selectedConsultancy = null;
  }

  toggleConsultancyAccordion(item: ConsultancyItem): void {
    item.isExpanded = !item.isExpanded;
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
        dayOfWeek: dayOfWeek,
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
