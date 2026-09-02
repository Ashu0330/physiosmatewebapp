import { Component, signal, computed, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { ExploreService } from '../../services/explore.service';
import { BookingService } from '../../booking/booking.service';

export interface PlanBenefit {
  id: number;
  planId: number;
  planType?: number;
  benefitText: string;
  displayOrder: number;
}

export interface RehabPlan {
  id: number;
  planName: string;
  totalSessions: number;
  validityDays: number;
  price: number;
  isPopular: boolean;
  isActive: boolean;
  providerType: string;
  providerId: number;
  expertiseId: number;
  benefits: PlanBenefit[];
}

export interface UserSubscription {
  id: number;
  userId: number;
  patientId: number;
  planId: number;
  practitionerId: number;
  clinicId: number | null;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  startDate: string;
  endDate: string;
  status: string;
  amount: number;
  paymentStatus: string;
}

export interface TimeSlot {
  id: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface DayAvailability {
  dayOfWeek: number;
  dayName: string;
  slots: TimeSlot[];
}

export interface PractitionerReview {
  id: number;
  userId: number;
  userName: string;
  practitionerId: number;
  clinicId: number | null;
  rating: number;
  review: string;
  visitedFor?: string;
  timeAgo?: string;
  tags?: string[];
  clinicReply?: string;
}

export interface TreatmentItem {
  id: number;
  name: string;
  category?: string;
}

@Component({
  selector: 'app-doctordetail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './doctordetail.html',
  styleUrl: './doctordetail.css',
})
export class Doctordetail implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(Authservice);
  private bookingService = inject(BookingService);

  readonly bookingConfirmationDetails = signal<{
    doctorName: string;
    doctorSpecialty: string;
    doctorPhoto: string;
    clinicName: string;
    clinicAddress: string;
    day: string;
    time: string;
    fee: number;
    bookingRefId: string;
    patientName: string;
  } | null>(null);

  // Search bar context (matching doctors/home pages)
  readonly selectedCity = signal<string>('Jaipur');
  readonly searchQuery = signal<string>('Physiotherapist');
  readonly isCityOpen = signal<boolean>(false);
  readonly popularCities = ['Jaipur', 'Kota', 'Mumbai', 'Delhi NCR', 'Bangalore', 'Pune'];

  // Doctor profile summary data
  readonly practitioner = {
    id: 1,
    name: 'Dr. Sneha Sharma',
    specialtyTitle: '(Physiotherapist)',
    degree: 'BPTh/BPT, MPT/MPTh - Sports Medicine',
    roleBadge: 'Therapist',
    specializations: 'Physiotherapist, Sports and Musculoskeletal Physiotherapist',
    experienceOverall: 12,
    experienceSpecialist: 6,
    ratingScorePercent: 91,
    patientStoriesCount: 46,
    consultationFee: 500,
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=80',
    clinicName: 'Fit N Fly Physiotherapy & Fitness Centre',
    clinicRating: 4.5,
    clinicExcellenceScore: '4.865/5',
    clinicAddress: '4/164, Shipra Path, Landmark: Near B2Bypass Chauraha, Mansarovar, Jaipur',
    landmark: 'Near B2Bypass Chauraha, Jaipur',
    headline: 'Dr. Sneha Sharma – Expert in Sports & Orthopedic Physiotherapy and Post Operative Rehabilitation at Fit N Fly.',
    bioParagraphs: [
      'Dr. Sneha Sharma is a renowned Sports Physiotherapist with a Master\'s degree in Sports, Musculoskeletal, and Orthopedic Physiotherapy. With a strong background in managing high-performance athletes, she has proudly represented India as a physiotherapist with national teams including Indian Volleyball, Taekwondo, and several other sporting disciplines.',
      'At Fit n Fly, Dr. Sharma delivers personalized physiotherapy care, focusing on restoring movement, relieving pain, and optimizing overall physical performance. Her expertise spans a broad range of conditions, including sports injuries, back and neck pain, joint dysfunctions, post-operative rehabilitation, and chronic musculoskeletal disorders.',
      'Combining evidence-based practice with modern therapeutic techniques, Dr. Sharma ensures each patient receives a customized treatment plan. Her approach integrates manual therapy, specialized exercise programs, and patient education, all aimed at not just treating symptoms but preventing future issues.',
      'Fit n Fly is equipped with advanced rehabilitation equipment and offers a supportive, patient-centered environment. Dr. Sneha Sharma is known for her detailed assessments, clear communication, and her commitment to helping individuals return to their peak physical condition.'
    ]
  };

  // Availability Time Slots JSON Data
  readonly availabilityData = signal<DayAvailability[]>([
    {
      dayOfWeek: 1,
      dayName: 'Monday',
      slots: [
        { id: 101, startTime: '09:00:00', endTime: '13:00:00', isActive: true },
        { id: 102, startTime: '14:00:00', endTime: '18:00:00', isActive: true }
      ]
    },
    {
      dayOfWeek: 2,
      dayName: 'Tuesday',
      slots: [
        { id: 103, startTime: '09:00:00', endTime: '13:00:00', isActive: true },
        { id: 104, startTime: '14:00:00', endTime: '18:00:00', isActive: true }
      ]
    },
    {
      dayOfWeek: 3,
      dayName: 'Wednesday',
      slots: [
        { id: 105, startTime: '09:00:00', endTime: '13:00:00', isActive: true }
      ]
    },
    {
      dayOfWeek: 4,
      dayName: 'Thursday',
      slots: [
        { id: 106, startTime: '09:00:00', endTime: '13:00:00', isActive: true },
        { id: 107, startTime: '14:00:00', endTime: '18:00:00', isActive: true }
      ]
    },
    {
      dayOfWeek: 5,
      dayName: 'Friday',
      slots: [
        { id: 108, startTime: '09:00:00', endTime: '13:00:00', isActive: true },
        { id: 109, startTime: '14:00:00', endTime: '18:00:00', isActive: true }
      ]
    },
    {
      dayOfWeek: 6,
      dayName: 'Saturday',
      slots: [
        { id: 110, startTime: '10:00:00', endTime: '14:00:00', isActive: true }
      ]
    }
  ]);

  // Reviews Data JSON
  readonly reviews = signal<PractitionerReview[]>([
    {
      id: 15,
      userId: 42,
      userName: 'Michael Brown',
      practitionerId: 1,
      clinicId: null,
      rating: 5,
      review: 'Dr. Sarah was extremely attentive and helped relieve my chronic back pain after just a few sessions. Highly recommended!',
      visitedFor: 'Arthritis Physiotherapy, Osteoarthritis Physiotherapy, Knee Pain Physiotherapy',
      timeAgo: 'Recent',
      tags: ['Doctor friendliness', 'Explanation of the health issue', 'Treatment satisfaction', 'Value for money', 'Wait time'],
      clinicReply: 'Thank You !! We wish you Good health & Happiness in life.'
    },
    {
      id: 16,
      userId: 58,
      userName: 'Emily Watson',
      practitionerId: 1,
      clinicId: null,
      rating: 4,
      review: 'Very professional and knowledgeable therapist. Clear explanation of exercises.',
      visitedFor: 'Frozen Shoulder Physiotherapy & Posture Correction',
      timeAgo: '2 weeks ago',
      tags: ['Doctor friendliness', 'Treatment satisfaction', 'Great exercises'],
      clinicReply: 'Thank you for your warm feedback! Glad you are feeling much better.'
    }
  ]);

  // Rehab Plans Data JSON
  readonly rehabPlans = signal<RehabPlan[]>([
    {
      id: 12,
      planName: '10-Session Rehab Plan',
      totalSessions: 10,
      validityDays: 60,
      price: 4500.0,
      isPopular: true,
      isActive: true,
      providerType: 'Practitioner',
      providerId: 1,
      expertiseId: 3,
      benefits: [
        {
          id: 1,
          planId: 12,
          planType: 1,
          benefitText: 'Personalized rehab exercise chart',
          displayOrder: 1
        },
        {
          id: 2,
          planId: 12,
          planType: 1,
          benefitText: 'Weekly progress assessment',
          displayOrder: 2
        }
      ]
    }
  ]);

  // User Purchased Plan JSON
  readonly activeSubscription = signal<UserSubscription | null>({
    id: 55,
    userId: 24,
    patientId: 18,
    planId: 12,
    practitionerId: 1,
    clinicId: null,
    totalSessions: 10,
    usedSessions: 2,
    remainingSessions: 8,
    startDate: '2026-08-15T00:00:00',
    endDate: '2026-10-14T00:00:00',
    status: 'Active',
    amount: 4500.0,
    paymentStatus: 'Paid'
  });

  // Surgeries & Treatments List
  readonly treatmentsList = signal<TreatmentItem[]>([
    { id: 1, name: 'Geriatric Physiotherapy Consultation' },
    { id: 2, name: 'Tailbone Pain (Coccydynia)' },
    { id: 3, name: 'Ribs Pain' },
    { id: 4, name: 'Osteopathic Physiotherapy' },
    { id: 5, name: 'Kegel Exercises' },
    { id: 6, name: 'Buttock Pain' },
    { id: 7, name: 'Orthopaedic Physiotherapy' },
    { id: 8, name: 'Nerve and Muscle Disorders' },
    { id: 9, name: 'Sports Injury Rehabilitation' },
    { id: 10, name: 'Spine & Posture Alignment' },
    { id: 11, name: 'Post-Surgical Joint Rehab' },
    { id: 12, name: 'Cervical Spondylosis Therapy' }
  ]);

  readonly treatmentSearchQuery = signal<string>('');

  readonly filteredTreatments = computed(() => {
    const q = this.treatmentSearchQuery().toLowerCase().trim();
    if (!q) return this.treatmentsList();
    return this.treatmentsList().filter(t => t.name.toLowerCase().includes(q));
  });

  // Single-Page Scroll Spy Tabs
  readonly navTabs = [
    { id: 'info', label: 'Info' },
    { id: 'stories', label: 'Stories (2)' },
    { id: 'plans', label: 'Rehab Plans & Packages' },
    { id: 'treatments', label: 'Surgeries & Treatments' },
    { id: 'photos', label: 'Photos & Videos' },
    { id: 'qa', label: 'Consult Q&A' }
  ];

  readonly activeSection = signal<string>('info');

  // Sticky Slot Picker State
  readonly selectedDayIndex = signal<number>(0);
  readonly selectedSlotTime = signal<string>('09:00 AM');
  readonly bookingSuccess = signal<boolean>(false);
  readonly bookingMessage = signal<string>('');

  // Generated Days for the Slot Carousel (e.g. Today, Tomorrow, Wed, Thu...)
  readonly dayList = [
    { label: 'Today', subLabel: 'No Slots Available', dayOfWeek: 2, dateStr: 'Tue, 1 Sep', hasSlots: false },
    { label: 'Tomorrow', subLabel: '16 Slots Available', dayOfWeek: 3, dateStr: 'Wed, 2 Sep', hasSlots: true },
    { label: 'Thu, 3 Sep', subLabel: '16 Slots Available', dayOfWeek: 4, dateStr: 'Thu, 3 Sep', hasSlots: true },
    { label: 'Fri, 4 Sep', subLabel: '16 Slots Available', dayOfWeek: 5, dateStr: 'Fri, 4 Sep', hasSlots: true },
    { label: 'Sat, 5 Sep', subLabel: '8 Slots Available', dayOfWeek: 6, dateStr: 'Sat, 5 Sep', hasSlots: true }
  ];

  // Specific Slot Time Chips available for the selected day
  readonly morningSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM'];
  readonly afternoonSlots = ['02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];

  // Clinic gallery images
  readonly clinicPhotos = [
    { url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80', caption: 'Clinic Reception' },
    { url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80', caption: 'Physiotherapy Room' },
    { url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80', caption: 'Rehab Equipment' }
  ];

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.updateActiveSectionFromScroll();
    }

    // Check if redirected from booking auth with confirmed status
    this.route.queryParams.subscribe(params => {
      if (params['bookingConfirmed'] === 'true') {
        const pending = this.bookingService.getPendingSlot();
        const dayLabel = pending?.selectedDay || `${this.dayList[1].label} (${this.dayList[1].dateStr})`;
        const slotTime = pending?.selectedTime || this.selectedSlotTime();

        this.confirmAppointmentDirectly(
          { label: dayLabel, dateStr: '' },
          slotTime,
          pending?.bookingId
        );

        // Clear query parameters cleanly from URL without reloading
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  ngOnDestroy(): void { }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.updateActiveSectionFromScroll();
    }
  }

  // Smooth scroll to section when tab is clicked
  scrollToSection(sectionId: string): void {
    this.activeSection.set(sectionId);
    if (typeof window === 'undefined') return;
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -140; // Height of sticky header + sub-nav
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  // Detect which section is currently on screen
  private updateActiveSectionFromScroll(): void {
    if (typeof window === 'undefined') return;
    const sectionIds = ['info', 'stories', 'plans', 'treatments', 'photos', 'qa'];
    const scrollPosition = window.pageYOffset + 200;

    for (let i = sectionIds.length - 1; i >= 0; i--) {
      const element = document.getElementById(sectionIds[i]);
      if (element) {
        const top = element.offsetTop;
        if (scrollPosition >= top) {
          this.activeSection.set(sectionIds[i]);
          break;
        }
      }
    }
  }

  selectDay(index: number): void {
    this.selectedDayIndex.set(index);
    if (this.dayList[index].hasSlots) {
      this.selectedSlotTime.set('09:00 AM');
    }
  }

  selectSlot(time: string): void {
    this.selectedSlotTime.set(time);
  }

  confirmAppointmentDirectly(day: { label: string; dateStr: string }, slotTime: string, existingRef?: string): void {
    const user = this.authService.getCurrentUser();
    const ref = existingRef || `PHY-${Math.floor(100000 + Math.random() * 900000)}`;

    this.bookingConfirmationDetails.set({
      doctorName: this.practitioner.name,
      doctorSpecialty: this.practitioner.specializations || 'Physiotherapist',
      doctorPhoto: this.practitioner.photoUrl,
      clinicName: this.practitioner.clinicName,
      clinicAddress: this.practitioner.clinicAddress,
      day: day.dateStr ? `${day.label} (${day.dateStr})` : day.label,
      time: slotTime,
      fee: this.practitioner.consultationFee,
      bookingRefId: ref,
      patientName: user?.fullName || this.authService.getUserName() || 'Patient'
    });

    this.bookingMessage.set(`Appointment confirmed with ${this.practitioner.name} for ${day.label} at ${slotTime}!`);
    this.bookingSuccess.set(true);
    this.bookingService.clearPendingSlot();
  }

  bookConsultancy(): void {
    const day = this.dayList[this.selectedDayIndex()];
    const paramId = this.route.snapshot.paramMap.get('id') || '1';
    const providerId = ExploreService.extractIdFromSlug(paramId) || paramId || this.practitioner.id || 1;

    if (this.authService.isLoggedIn()) {
      // User is already logged in -> show confirmation popup directly on this page!
      this.confirmAppointmentDirectly(day, this.selectedSlotTime());
    } else {
      // Save pending slot selection and navigate to login/signup
      this.bookingService.savePendingSlot({
        providerId: Number(providerId) || 1,
        providerName: this.practitioner.name,
        providerSpecialty: this.practitioner.specializations || 'Physiotherapist',
        providerImage: this.practitioner.photoUrl,
        clinicName: this.practitioner.clinicName,
        clinicAddress: this.practitioner.clinicAddress,
        consultationFee: this.practitioner.consultationFee,
        selectedDay: `${day.label} (${day.dateStr})`,
        selectedTime: this.selectedSlotTime()
      });

      this.router.navigate(['/booking/consultancy', providerId]);
    }
  }

  bookAppointment(): void {
    this.bookConsultancy();
  }

  printReceipt(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  closeBookingSuccess(): void {
    this.bookingSuccess.set(false);
  }

  buyPlan(plan: RehabPlan): void {
    if (!this.authService.isLoggedIn()) {
      const paramId = this.route.snapshot.paramMap.get('id') || '1';
      const providerId = ExploreService.extractIdFromSlug(paramId) || paramId || this.practitioner.id || 1;
      this.bookingService.savePendingSlot({
        providerId: Number(providerId) || 1,
        providerName: this.practitioner.name,
        providerSpecialty: `Rehab Plan: ${plan.planName}`,
        providerImage: this.practitioner.photoUrl,
        clinicName: this.practitioner.clinicName,
        clinicAddress: this.practitioner.clinicAddress,
        consultationFee: plan.price,
        selectedDay: `${plan.totalSessions} Sessions Plan`,
        selectedTime: `${plan.validityDays} Days Validity`
      });
      this.router.navigate(['/booking/consultancy', providerId]);
      return;
    }
    this.confirmAppointmentDirectly(
      { label: `Plan: ${plan.planName}`, dateStr: `${plan.totalSessions} Sessions` },
      `₹${plan.price}`
    );
  }

  toggleCity(): void {
    this.isCityOpen.update(v => !v);
  }

  selectCity(city: string): void {
    this.selectedCity.set(city);
    this.isCityOpen.set(false);
  }
}
