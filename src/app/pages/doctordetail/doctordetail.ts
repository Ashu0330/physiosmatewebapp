import { Component, computed, OnInit, AfterViewInit, OnDestroy, HostListener, inject, ElementRef, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { FormGroup, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ExploreService } from '../../services/explore.service';
import { BookingService } from '../booking/booking.service';
import { BaseComponent } from '../../helper/base-component';
import { ApiEndPoints } from '../../helper/api-endpoints';
import { Availability, CarouselDay, PractitionerDetailedData, providerReview, slots } from '../../models/practitioner.model';
import { SharedModule } from '../../shared/shared-module';
import { DateHelper } from '../../helper/utilities';



// ── Static Constants & Pure Utilities ───────────────────────────────────────
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;


function isTimeInFuture(timeStr: string): boolean {
  const [timePart, period] = timeStr.split(' ');
  if (!timePart || !period) return true;
  let [hours, minutes] = timePart.split(':').map(Number);
  if (period === 'PM' && hours < 12) hours += 12;
  else if (period === 'AM' && hours === 12) hours = 0;

  const now = new Date();
  return (hours * 60 + (minutes || 0)) > (now.getHours() * 60 + now.getMinutes());
}

@Component({
  selector: 'app-doctordetail',
  standalone: true,
  imports: [SharedModule, RouterLink],
  templateUrl: './doctordetail.html',
  styleUrl: './doctordetail.css',
})
export class Doctordetail extends BaseComponent implements OnInit, AfterViewInit, OnDestroy {


  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly elRef = inject(ElementRef);
  private scrollRafId: number | null = null;

  @ViewChild('daySwiperRef') daySwiperRef?: ElementRef<HTMLElement>;
  @ViewChild('dayPrevBtn') dayPrevBtn?: ElementRef<HTMLElement>;
  @ViewChild('dayNextBtn') dayNextBtn?: ElementRef<HTMLElement>;
  private daySwiper?: Swiper;


  practitionerId: number = 0;
  readonly isClinic = signal<boolean>(false);
  readonly doctorDetail = signal<PractitionerDetailedData | null>(null);

  readonly availabilitySlots = signal<Availability[]>([]);
  readonly isLoadingAvailability = signal<boolean>(false);
  readonly weekOffset = signal<number>(0);
  readonly selectedDayIndex = signal<number>(0);
  readonly selectedSlotTime = signal<string>('09:00 AM');

  reviewForm!: FormGroup;
  readonly isSubmittingReview = signal<boolean>(false);
  readonly Review = signal<providerReview[]>([]);
  readonly selectedVisitReasons = signal<string[]>([]);
  readonly showCustomVisit = signal<boolean>(false);
  readonly customVisitText = signal<string>('');
  readonly selectedHappyAbout = signal<string[]>([]);
  readonly showCustomHappyAbout = signal<boolean>(false);
  readonly customHappyAboutText = signal<string>('');

  readonly bookingSuccess = signal<boolean>(false);
  readonly bookingMessage = signal<string>('');
  readonly bookingConfirmationDetails = signal<{
    doctorName: string;
    doctorSpecialty: string;
    doctorPhoto: string;
    clinicName: string;
    clinicAddress: string;
    day: string;
    date?: string;
    time: string;
    fee: number;
    bookingRefId: string;
    patientName: string;
  } | null>(null);

  readonly selectedAssociatedDoctor = signal<any | null>(null);

  readonly activeSection = signal<string>('info');
  readonly selectedCity = signal<string>('Jaipur');
  readonly searchQuery = signal<string>('Physiotherapist');
  readonly isCityOpen = signal<boolean>(false);


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

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.practitionerId = id ? (ExploreService.extractIdFromSlug(id) || Number(id)) : 0;

    const isClinicRoute =
      this.route.snapshot.data['isClinic'] === true ||
      this.router.url.includes('clinic') ||
      (this.route.snapshot.paramMap.get('id')?.startsWith('clinic') ?? false);
    this.isClinic.set(isClinicRoute);

    this.createReviewForm();

    // Fetch initial backend data in parallel
    await Promise.all([
      this.GetDoctorById(),
      this.GetAllReview(),
      this.loadAvailability()
    ]);
    this.autoSelectAvailableDay();

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.daySwiper?.update();
      }, 50);
    }

    if (typeof window !== 'undefined') {
      this.updateActiveSectionFromScroll();
    }

    // Handle redirection with confirmed booking query params
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['bookingConfirmed'] === 'true') {
          const pending = this.bookingService.getPendingSlot();

          pending?.bookingId

          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          });
        }
      });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('@fancyapps/ui').then(({ Fancybox }) => {
        Fancybox.bind(this.elRef.nativeElement, '[data-fancybox="clinic-gallery"]');
      });
      this.initDaySwiper();
      setTimeout(() => {
        if (!this.daySwiper) {
          this.initDaySwiper();
        } else {
          this.daySwiper.update();
        }
      }, 80);
      setTimeout(() => {
        this.daySwiper?.update();
      }, 300);
    }
  }

  private initDaySwiper(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const root = this.elRef.nativeElement;
    const container = (this.daySwiperRef?.nativeElement || root.querySelector('.day-tabs-slider')) as HTMLElement;
    const prevBtn = (this.dayPrevBtn?.nativeElement || root.querySelector('.day-nav-arrow-prev')) as HTMLElement;
    const nextBtn = (this.dayNextBtn?.nativeElement || root.querySelector('.day-nav-arrow-next')) as HTMLElement;

    if (!container) return;

    if (this.daySwiper) {
      this.daySwiper.destroy(true, true);
      this.daySwiper = undefined;
    }

    this.daySwiper = new Swiper(container, {
      modules: [Navigation],
      slidesPerView: 4,
      slidesPerGroup: 2,
      spaceBetween: 8,
      watchOverflow: true,
      observer: true,
      observeParents: true,
      resizeObserver: true,
      updateOnWindowResize: true,
      navigation: {
        prevEl: prevBtn,
        nextEl: nextBtn,
      },
    });

    requestAnimationFrame(() => {
      this.daySwiper?.update();
    });
  }

  ngOnDestroy(): void {
    if (this.daySwiper) {
      this.daySwiper.destroy(true, true);
    }
    if (typeof window !== 'undefined' && this.scrollRafId !== null) {
      window.cancelAnimationFrame(this.scrollRafId);
      this.scrollRafId = null;
    }
    if (isPlatformBrowser(this.platformId)) {
      import('@fancyapps/ui').then(({ Fancybox }) => {
        Fancybox.unbind(this.elRef.nativeElement);
        Fancybox.close();
      });
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (typeof window === 'undefined') return;
    if (this.scrollRafId !== null) return;
    this.scrollRafId = window.requestAnimationFrame(() => {
      this.updateActiveSectionFromScroll();
      this.scrollRafId = null;
    });
  }


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
      'Dr. Sneha Sharma is a renowned Sports Physiotherapist with a Master\'s degree in Sports, Musculoskeletal, and Orthopedic Physiotherapy.',
      'At Fit n Fly, Dr. Sharma delivers personalized physiotherapy care, focusing on restoring movement and relieving pain.',
      'Combining evidence-based practice with modern therapeutic techniques, Dr. Sharma ensures each patient receives a customized treatment plan.'
    ]
  };

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

  // Clinic gallery images
  readonly clinicPhotos = [
    { url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80', caption: 'Clinic Reception' },
    { url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80', caption: 'Physiotherapy Room' },
    { url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80', caption: 'Rehab Equipment' }
  ];

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

  // Predefined "Happy About" items for Review
  readonly predefinedHappyAbout = [
    'Doctor Friendliness',
    'Explanation of Health Issue',
    'Detailed Consultation',
    'Treatment Satisfaction',
    'Value for Money',
    'Wait Time',
    'Clinic Hygiene & Ambience'
  ];

  // Popular Cities list
  readonly popularCities = ['Jaipur', 'Kota', 'Mumbai', 'Delhi NCR', 'Bangalore', 'Pune'];



  /** API 1: Fetch Doctor or Clinic Profile Details */
  async GetDoctorById(): Promise<void> {
    const endpoint = this.isClinic()
      ? `${ApiEndPoints.GetClinicById}?clinicId=${this.practitionerId}`
      : `${ApiEndPoints.GetPractitionerById}?PractitionerId=${this.practitionerId}`;
    const res = await this.apiService.Get<PractitionerDetailedData>(endpoint);
    this.doctorDetail.set(res?.data ?? null);
  }

  /** API 2: Fetch Doctor Availability Slots (Weekly / By Date) */
  async loadAvailability(): Promise<void> {
    try {
      const pid = this.practitionerId;
      const res = await this.apiService.Get<any>(`${ApiEndPoints.GetAvailability}?practitionerId=${pid}`);
      if (res && res.isSuccess) {
        const raw = res.data;
        if (Array.isArray(raw)) {
          this.availabilitySlots.set(raw);
        } else if (raw && Array.isArray(raw.slots)) {
          this.availabilitySlots.set(raw.slots);
        } else {
          this.availabilitySlots.set([]);
        }
      } else {
        this.availabilitySlots.set([]);
      }
    } catch (e) {
      console.error('Error loading availability', e);
      this.availabilitySlots.set([]);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async GetAllReview(): Promise<void> {
    const res = await this.apiService.Post<providerReview[]>(ApiEndPoints.GetAllReviews, {
      PractitionerId: this.practitionerId
    });
    this.Review.set(res.isSuccess ? (res.data ?? []) : []);
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
        rating: formVal.rating,
        review: formVal.review,
        practitionerId: this.practitionerId,
        review1: formVal.review,
        isRecommended: !!formVal.isRecommended,
        visitedFor: formVal.visitedFor?.trim() || null,
        happyAbout: formVal.happyAbout?.trim() || null
      };
      const res = await this.apiService.Post<boolean>(ApiEndPoints.AddReview, payload);
      if (res.isSuccess) {
        this.showSuccess(res.message || 'Review submitted successfully!');
        this.createReviewForm();
        await this.GetAllReview();
      } else {
        this.showError(res.message || 'Failed to submit review.');
      }
    } finally {
      this.isSubmittingReview.set(false);
    }
  }

  async BookConsultancyApi(payload: any): Promise<any> {
    return await this.apiService.Post<any>(ApiEndPoints.BookConsultancy, payload);
  }



  autoSelectAvailableDay(): void {
    // const days = this.dayList();
    // const availableIndex = days.findIndex(d => d.hasSlots);
    // const targetIdx = availableIndex >= 0 ? availableIndex : 0;
    // this.selectedDayIndex.set(targetIdx);
    // const selectedDay = days[targetIdx];
    // if (selectedDay?.hasSlots && selectedDay.availableSlots.length > 0) {
    //   this.selectedSlotTime.set(selectedDay.availableSlots[0]);
    // }
  }

  selectDay(index: number): void {
    this.selectedDayIndex.set(index);
    // const days = this.dayList();
    // const day = days[index];
    // if (day?.hasSlots && day.availableSlots.length > 0) {
    //   this.selectedSlotTime.set(day.availableSlots[0]);
    // }
  }

  selectSlot(time: string): void {
    this.selectedSlotTime.set(time);
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] || '00';
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hrsStr = hours < 10 ? `0${hours}` : `${hours}`;
    return `${hrsStr}:${minutes} ${ampm}`;
  }

  private expandRange(startTime: string, endTime: string): string[] {
    const toMins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };
    const chips: string[] = [];
    let cur = toMins(startTime);
    const end = toMins(endTime);
    while (cur < end) {
      chips.push(this.formatMinutesToTime(cur));
      cur += 30;
    }
    return chips;
  }

  private formatMinutesToTime(totalMins: number): string {
    let hours = Math.floor(totalMins / 60);
    const minutes = String(totalMins % 60).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hrsStr = hours < 10 ? `0${hours}` : `${hours}`;
    return `${hrsStr}:${minutes} ${ampm}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5.3 Review Form Helpers
  // ─────────────────────────────────────────────────────────────────────────
  createReviewForm(): void {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      review: ['', [Validators.required, Validators.minLength(3)]],
      practitionerId: [this.practitionerId, [Validators.required]],
      visitedFor: [''],
      happyAbout: [''],
      isRecommended: [true],
    });
    this.selectedVisitReasons.set([]);
    this.showCustomVisit.set(false);
    this.customVisitText.set('');
    this.selectedHappyAbout.set([]);
    this.showCustomHappyAbout.set(false);
    this.customHappyAboutText.set('');
  }

  toggleVisitReason(reason: string): void {
    const current = this.selectedVisitReasons();
    if (current.includes(reason)) {
      this.selectedVisitReasons.set(current.filter(r => r !== reason));
    } else {
      this.selectedVisitReasons.set([reason]);
    }
    this.syncReviewControl('visitedFor', this.selectedVisitReasons(), '');
  }

  // toggleVisitReason(reason: string): void {
  //   const current = this.selectedVisitReasons();
  //   const updated = current.includes(reason)
  //     ? current.filter(r => r !== reason)
  //     : [...current, reason];
  //   this.selectedVisitReasons.set(updated);
  //   this.syncReviewControl('visitedFor', updated, this.customVisitText());
  // }

  isVisitReasonSelected(reason: string): boolean {
    return this.selectedVisitReasons().includes(reason);
  }

  toggleCustomVisit(): void {
    const next = !this.showCustomVisit();
    this.showCustomVisit.set(next);
    if (!next) {
      this.customVisitText.set('');
      this.syncReviewControl('visitedFor', this.selectedVisitReasons(), '');
    }
  }

  onCustomVisitChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.customVisitText.set(val);
    this.syncReviewControl('visitedFor', this.selectedVisitReasons(), val);
  }

  toggleHappyAbout(option: string): void {
    const current = this.selectedHappyAbout();
    const updated = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
    this.selectedHappyAbout.set(updated);
    this.syncReviewControl('happyAbout', updated, this.customHappyAboutText());
  }

  isHappyAboutSelected(option: string): boolean {
    return this.selectedHappyAbout().includes(option);
  }

  toggleCustomHappyAbout(): void {
    const next = !this.showCustomHappyAbout();
    this.showCustomHappyAbout.set(next);
    if (!next) {
      this.customHappyAboutText.set('');
      this.syncReviewControl('happyAbout', this.selectedHappyAbout(), '');
    }
  }

  onCustomHappyAboutChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.customHappyAboutText.set(val);
    this.syncReviewControl('happyAbout', this.selectedHappyAbout(), val);
  }

  private syncReviewControl(controlName: 'visitedFor' | 'happyAbout', selected: string[], custom: string): void {
    const trimmed = custom.trim();
    const items = trimmed ? [...selected, trimmed] : selected;
    this.reviewForm.patchValue({ [controlName]: items.join(', ') });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5.4 Appointment Booking & Confirmation Methods
  // ─────────────────────────────────────────────────────────────────────────
  selectDoctorForBooking(doc: any): void {
    this.selectedAssociatedDoctor.set(doc);
    this.scrollToSection('appointment-slots');
  }

  async confirmAppointmentDirectly(day: any, slotTime: string, existingRef?: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    const doc = this.doctorDetail();
    const ref = existingRef || `PHY-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateDisplay = day.fullDateStr || (day.dateStr ? `${day.label} (${day.dateStr})` : day.label);
    const doctorName = doc?.fullName || this.practitioner.name;

    // Resolve date to Date instance and YYYY-MM-DD date format
    const resolvedDate: Date = (day.date instanceof Date && !isNaN(day.date.getTime()))
      ? day.date
      : (typeof day.date === 'string' && day.date ? new Date(day.date) : new Date());
    const formattedDate = DateHelper.formatLocalDate(resolvedDate);

    // Send booking to backend API
    if (this.isLoggedIn) {
      try {
        const payload = {
          practitionerId: this.practitionerId || doc?.practitionerId || 1,
          doctorName,
          visitType: this.isClinic() ? 'In-Clinic' : 'Home Visit',
          bookingRefId: ref,
          consultancydate: formattedDate,
          appointmentDate: formattedDate,
          slotDate: formattedDate,
          slotTime,
          consultationFee: doc?.consultationFee ?? this.practitioner.consultationFee,
          mode: this.isClinic() ? 'In-Clinic' : 'Home Visit',
          patientName: user?.fullName || this.authService.getUserName() || 'Patient'
        };
        await this.BookConsultancyApi(payload);
      } catch (err) {
        console.error('BookConsultancy API error:', err);
      }
    }

    this.bookingConfirmationDetails.set({
      doctorName,
      doctorSpecialty: doc?.specialization || this.practitioner.specializations || 'Physiotherapist',
      doctorPhoto: doc?.profileImage || this.practitioner.photoUrl,
      clinicName: doc?.clinicName || this.practitioner.clinicName,
      clinicAddress: this.practitioner.clinicAddress,
      day: dateDisplay,
      date: formattedDate,
      time: slotTime,
      fee: doc?.consultationFee ?? this.practitioner.consultationFee,
      bookingRefId: ref,
      patientName: user?.fullName || this.authService.getUserName() || 'Patient'
    });

    this.bookingMessage.set(`Appointment confirmed with ${doctorName} for ${dateDisplay} at ${slotTime}!`);
    this.bookingSuccess.set(true);
    this.bookingService.clearPendingSlot();
  }

  bookConsultancy(): void {
    const day = new Date;
    // this.dayList()[this.selectedDayIndex()];
    // if (!day || !day.hasSlots) {
    //   this.showError('Please select a day with available slots.');
    //   return;
    // }
    const doc = this.doctorDetail();
    const paramId = this.route.snapshot.paramMap.get('id') || '1';
    const providerId = ExploreService.extractIdFromSlug(paramId) || paramId || this.practitionerId || 1;

    if (this.authService.isLoggedIn()) {
      this.confirmAppointmentDirectly(day, this.selectedSlotTime());
    } else {
      this.bookingService.savePendingSlot({
        providerId: Number(providerId) || 1,
        providerName: doc?.fullName || this.practitioner.name,
        providerSpecialty: doc?.specialization || this.practitioner.specializations || 'Physiotherapist',
        providerImage: doc?.profileImage || this.practitioner.photoUrl,
        clinicName: doc?.clinicName || this.practitioner.clinicName,
        clinicAddress: this.practitioner.clinicAddress,
        consultationFee: doc?.consultationFee ?? this.practitioner.consultationFee,
        // selectedDay: day.fullDateStr || `${day.label} (${day.dateStr})`,
        // selectedDate: DateHelper.formatLocalDate(day.date),
        selectedTime: this.selectedSlotTime()
      });

      this.router.navigate(['/booking/consultancy', providerId]);
    }
  }

  bookAppointment(): void {
    debugger
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

  // ─────────────────────────────────────────────────────────────────────────
  // 5.5 Navigation, Scroll Spy & City Dropdown Methods
  // ─────────────────────────────────────────────────────────────────────────
  scrollToSection(sectionId: string): void {
    this.activeSection.set(sectionId);
    if (typeof window === 'undefined') return;
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -140;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  private updateActiveSectionFromScroll(): void {
    if (typeof window === 'undefined') return;
    const sectionIds = this.isClinic()
      ? ['info', 'availability', 'stories', 'doctors', 'treatments', 'photos', 'qa']
      : ['info', 'availability', 'stories', 'treatments', 'photos', 'qa'];
    const scrollPosition = window.pageYOffset + 200;

    for (let i = sectionIds.length - 1; i >= 0; i--) {
      const element = document.getElementById(sectionIds[i]);
      if (element && scrollPosition >= element.offsetTop) {
        this.activeSection.set(sectionIds[i]);
        break;
      }
    }
  }

  toggleCity(): void {
    this.isCityOpen.update(v => !v);
  }

  selectCity(city: string): void {
    this.selectedCity.set(city);
    this.isCityOpen.set(false);
  }
}
