import { Component, computed, OnInit, AfterViewInit, OnDestroy, HostListener, inject, ElementRef, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { ExploreService } from '../../services/explore.service';
import { BookingService } from '../booking/booking.service';
import { BaseComponent } from '../../helper/base-component';
import { ApiEndPoints } from '../../helper/api-endpoints';
import { PractitionerDetailedData, PractitionerReview } from '../../models/practitioner.model';
import { SharedModule } from '../../shared/shared-module';



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



export interface TreatmentItem {
  id: number;
  name: string;
  category?: string;
}

@Component({
  selector: 'app-doctordetail',
  standalone: true,
  imports: [SharedModule, RouterLink],
  templateUrl: './doctordetail.html',
  styleUrl: './doctordetail.css',
})
export class Doctordetail extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private bookingService = inject(BookingService);
  private platformId = inject(PLATFORM_ID);
  private elRef = inject(ElementRef);

  // Review Form
  reviewForm!: FormGroup;
  isSubmittingReview = signal<boolean>(false);
  practitionerId: number = 0;
  async ngOnInit(): Promise<void> {

    const id = this.route.snapshot.paramMap.get('id');
    this.practitionerId = id ? (ExploreService.extractIdFromSlug(id) || Number(id)) : 0;

    console.log('Practitioner ID:', id);

    // Initialise review form with the practitioner id from route
    this.GetDoctorById();
    this.createReviewForm();
    await this.GetReviews();

    const isClinicRoute =
      this.route.snapshot.data['isClinic'] === true ||
      this.router.url.includes('clinic') ||
      (this.route.snapshot.paramMap.get('id')?.startsWith('clinic') ?? false);
    this.isClinic.set(isClinicRoute);

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

  // Predefined Visit Reasons for Review
  readonly predefinedVisitReasons = [
    'Knee Pain',
    'Back Pain',
    'Neck & Shoulder Pain',
    'Sports Injury',
    'Post-Op Rehab',
    'Frozen Shoulder',
    'Sciatica',
    'Arthritis',
    'Posture Correction'
  ];
  readonly selectedVisitReasons = signal<string[]>([]);
  readonly showCustomVisit = signal<boolean>(false);
  readonly customVisitText = signal<string>('');

  toggleVisitReason(reason: string): void {
    this.selectedVisitReasons.update(current => {
      const exists = current.includes(reason);
      const updated = exists ? current.filter(r => r !== reason) : [...current, reason];
      this.syncVisitedForControl(updated, this.customVisitText());
      return updated;
    });
  }

  isVisitReasonSelected(reason: string): boolean {
    return this.selectedVisitReasons().includes(reason);
  }

  toggleCustomVisit(): void {
    this.showCustomVisit.update(v => {
      const next = !v;
      if (!next) {
        this.customVisitText.set('');
        this.syncVisitedForControl(this.selectedVisitReasons(), '');
      }
      return next;
    });
  }

  onCustomVisitChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.customVisitText.set(val);
    this.syncVisitedForControl(this.selectedVisitReasons(), val);
  }

  private syncVisitedForControl(selected: string[], custom: string): void {
    const all = [...selected];
    if (custom && custom.trim()) {
      all.push(custom.trim());
    }
    const combined = all.join(', ');
    this.reviewForm.patchValue({ visitedFor: combined });
  }

  createReviewForm(): void {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      review: ['', [Validators.required, Validators.minLength(3)]],
      practitionerId: [this.practitionerId, [Validators.required]],
      visitedFor: [''],
      isRecommended: [true],
    });
    this.selectedVisitReasons.set([]);
    this.showCustomVisit.set(false);
    this.customVisitText.set('');
  }

  async AddReview(): Promise<void> {
    if (!this.isLoggedIn) {
      this.showError('Please log in to submit a review.');
      return;
    }
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      this.showError('Please fill rating and review before submitting.');
      return;
    }
    this.isSubmittingReview.set(true);
    try {
      const formVal = this.reviewForm.value;
      const payload = {
        ...formVal,
        practitionerId: this.practitionerId,
        review1: formVal.review,
        isRecommended: !!formVal.isRecommended,
        visitedFor: formVal.visitedFor?.trim() || null
      };
      const res = await this.apiService.Post<boolean>(
        ApiEndPoints.AddReview,
        payload
      );
      if (res.isSuccess) {
        this.showSuccess(res.message || 'Review submitted successfully!');
        this.reviewForm.patchValue({
          rating: 0,
          review: '',
          visitedFor: '',
          isRecommended: true
        });
        this.selectedVisitReasons.set([]);
        this.showCustomVisit.set(false);
        this.customVisitText.set('');
        await this.GetReviews();
      } else {
        this.showError(res.message || 'Failed to submit review.');
      }
    } finally {
      this.isSubmittingReview.set(false);
    }
  }

  async GetReviews() {

    let res = await this.apiService.Get<any>(ApiEndPoints.GetPractitionerReviews + "?id=" + this.practitionerId);
    if (res.isSuccess) {
      debugger
      this.reviews.set(res.data);
    }
  }
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
  doctorDetail = signal<PractitionerDetailedData | null>(null);



  async GetDoctorById() {

    let res = await this.apiService.Get<PractitionerDetailedData>(ApiEndPoints.GetPractitionerById + "?PractitionerId=" + this.practitionerId)
    this.doctorDetail.set(res.data ?? null)
  }


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
      isRecommended: true,
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
      isRecommended: true,
      timeAgo: '2 weeks ago',
      tags: ['Doctor friendliness', 'Treatment satisfaction', 'Great exercises'],
      clinicReply: 'Thank you for your warm feedback! Glad you are feeling much better.'
    }
  ]);

  // Rehab Plans Data JSON


  // Mode flag: Doctor vs Clinic Detail
  readonly isClinic = signal<boolean>(false);

  // Associated Doctors list when in Clinic mode
  readonly associatedDoctors = signal([
    {
      id: 'doc-s1',
      name: 'Dr. Sneha Sharma',
      degree: 'BPTh/BPT, MPT - Sports Physiotherapy',
      specialist: 'Sports & Musculoskeletal Physiotherapist',
      experienceYears: 12,
      ratingPercent: 98,
      patientStoriesCount: 142,
      availableText: 'Available Today',
      consultationFee: 500,
      photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      gender: 'female',
      prime: true,
      isVerified: true,
      specialties: ['Sports Rehab', 'Joint Mobilization', 'Dry Needling', 'Post-Op Knee'],
    },
    {
      id: 'doc-s2',
      name: 'Dr. Rajesh Sharma',
      degree: 'BPT, MPT - Sports Rehabilitation',
      specialist: 'Senior Physiotherapist',
      experienceYears: 15,
      ratingPercent: 99,
      patientStoriesCount: 220,
      availableText: 'Available Tomorrow',
      consultationFee: 500,
      photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
      gender: 'male',
      prime: true,
      isVerified: true,
      specialties: ['Spine Rehabilitation', 'Sciatica Care', 'Ergonomics', 'Neuro Rehab'],
    },
    {
      id: 'doc-s3',
      name: 'Dr. Ananya Verma',
      degree: 'BPT, Certification in Manual Therapy',
      specialist: 'Consultant Physiotherapist',
      experienceYears: 8,
      ratingPercent: 95,
      patientStoriesCount: 88,
      availableText: 'Available Today',
      consultationFee: 450,
      photo: 'https://images.unsplash.com/photo-1594824813753-48b4d88e0031?auto=format&fit=crop&w=400&q=80',
      gender: 'female',
      prime: false,
      isVerified: true,
      specialties: ['Post-Fracture Rehab', 'Pediatric Therapy', 'Geriatric Balance Care'],
    },
  ]);

  readonly selectedAssociatedDoctor = signal<any | null>(null);

  selectDoctorForBooking(doc: any): void {
    this.selectedAssociatedDoctor.set(doc);
    this.scrollToSection('appointment-slots');
  }

  // Single-Page Scroll Spy Tabs (Dynamically adds Associated Doctors in Clinic mode)
  readonly navTabs = computed(() => {
    const list = [
      { id: 'info', label: 'Info' },
      { id: 'stories', label: 'Stories (2)' },
    ];
    if (this.isClinic()) {
      list.push({ id: 'doctors', label: `Associated Doctors (${this.associatedDoctors().length})` });
    }
    list.push(
      { id: 'treatments', label: 'Surgeries & Treatments' },
      { id: 'photos', label: 'Photos & Videos' },
      { id: 'qa', label: 'Consult Q&A' }
    );
    return list;
  });

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


  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('@fancyapps/ui').then(({ Fancybox }) => {
        Fancybox.bind(this.elRef.nativeElement, '[data-fancybox="clinic-gallery"]');
      });
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('@fancyapps/ui').then(({ Fancybox }) => {
        Fancybox.unbind(this.elRef.nativeElement);
        Fancybox.close();
      });
    }
  }

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
    const sectionIds = this.isClinic()
      ? ['info', 'stories', 'doctors', 'treatments', 'photos', 'qa']
      : ['info', 'stories', 'treatments', 'photos', 'qa'];
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


  toggleCity(): void {
    this.isCityOpen.update(v => !v);
  }

  selectCity(city: string): void {
    this.selectedCity.set(city);
    this.isCityOpen.set(false);
  }
}
