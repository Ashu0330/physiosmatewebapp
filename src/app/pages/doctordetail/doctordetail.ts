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
import { Availability, CarouselDay, ClinicDetailedData, PractitionerDetailedData, providerReview, slots } from '../../models/practitioner.model';
import { ClinicBranchDto } from '../../models/clinic.model';
import { SharedModule } from '../../shared/shared-module';
import { DateHelper } from '../../helper/utilities';


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
  readonly doctorDetail = signal<any | null>(null);
  readonly isSaved = signal<boolean>(false);
  readonly isSavingDoctor = signal<boolean>(false);

  readonly availabilitySlots = signal<Availability[]>([]);
  readonly isLoadingAvailability = signal<boolean>(false);
  readonly selectedSlots = signal<slots[]>([]);
  readonly dayList = signal<CarouselDay[]>([]);
  readonly selectedDay = signal<CarouselDay | null>(null);
  readonly weekOffset = signal<number>(0);
  readonly selectedDayIndex = signal<number>(0);
  readonly selectedSlotTime = signal<string>('');
  readonly selectedStartTime = signal<string>('');
  readonly selectedEndTime = signal<string>('');

  bookingForm!: FormGroup;
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
    amount: number;
    bookingRefId: string;
    patientName: string;
  } | null>(null);

  readonly selectedAssociatedDoctor = signal<any | null>(null);
  readonly associatedBranches = signal<ClinicBranchDto[]>([]);

  readonly activeSection = signal<string>('info');
  readonly selectedCity = signal<string>('');
  readonly searchQuery = signal<string>('Physiotherapist');
  readonly isCityOpen = signal<boolean>(false);

  readonly displayName = computed<string>(() => {
    const d = this.doctorDetail();
    return d?.clinicName || d?.fullName || '';
  });

  readonly displayPhoto = computed<string>(() => {
    const d = this.doctorDetail();
    return d?.logoUrl || d?.bannerImageUrl || d?.profileImage || '';
  });

  readonly displaySpec = computed<string>(() => {
    const d = this.doctorDetail();
    return d?.specialization || (this.isClinic() ? 'Physiotherapy Clinic' : '');
  });

  readonly displayAbout = computed<string>(() => {
    const d = this.doctorDetail();
    return d?.description || d?.about || '';
  });

  readonly displayAddress = computed<string>(() => {
    const d = this.doctorDetail();
    if (!d) return '';
    return [d.address, d.city, d.stateName || d.state, d.pincode]
      .filter((v: any) => !!v && String(v).trim().length > 0)
      .join(', ');
  });

  readonly displayCity = computed<string>(() => {
    const d = this.doctorDetail();
    return d?.city || this.selectedCity();
  });

  readonly displayPhone = computed<string>(() => {
    const d = this.doctorDetail();
    return d?.phone || '';
  });

  readonly displayFee = computed<number>(() => {
    const d = this.doctorDetail();
    return Number(d?.consultancyFees ?? d?.consultationFee ?? 0);
  });

  readonly displayRating = computed<number>(() => {
    const d = this.doctorDetail();
    return Number(d?.avgRating ?? 0);
  });

  readonly displayReviewsCount = computed<number>(() => {
    const d = this.doctorDetail();
    return Number(d?.totalReviews ?? this.Review().length ?? 0);
  });

  readonly displayInitials = computed<string>(() => {
    const name = this.displayName();
    if (!name) return this.isClinic() ? 'CL' : 'DR';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  });

  readonly navTabs = computed(() => {
    const list = [
      { id: 'info', label: 'Info' },
      { id: 'stories', label: `Stories (${this.Review().length || this.displayReviewsCount()})` },
    ];
    if (this.isClinic()) {
      list.push({ id: 'doctors', label: `Associated Doctors (${this.associatedDoctors().length})` });
      list.push({ id: 'branches', label: `Branches (${this.associatedBranches().length})` });
    }
    list.push(
      { id: 'treatments', label: 'Services & Treatments' },
      { id: 'photos', label: 'Photos & Videos' },
      { id: 'qa', label: 'Consult Q&A' }
    );
    return list;
  });

  getDocInitials(name?: string | null): string {
    if (!name) return 'DR';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }

  formatBranchAddress(branch: ClinicBranchDto): string {
    return [branch.address, branch.city, branch.stateName, branch.pincode]
      .filter((v): v is string => !!v && v.trim().length > 0)
      .join(', ');
  }

  async ngOnInit(): Promise<void> {
    this.GetDate();
    const id = this.route.snapshot.paramMap.get('id');
    this.practitionerId = id ? (ExploreService.extractIdFromSlug(id) || Number(id)) : 0;

    const isClinicRoute =
      this.route.snapshot.data['isClinic'] === true ||
      this.router.url.includes('clinic') ||
      (this.route.snapshot.paramMap.get('id')?.startsWith('clinic') ?? false);
    this.isClinic.set(isClinicRoute);
    this.initForms();

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

          if (pending && this.isLoggedIn) {
            const dayObj = {
              date: pending.selectedDate || new Date(),
              label: pending.selectedDay || 'Selected Day',
              fullDateStr: typeof pending.selectedDate === 'string' ? pending.selectedDate : ''
            };
            this.confirmAppointmentDirectly(
              dayObj,
              pending.selectedTime || '',
              pending.bookingId,
              pending.startTime,
              pending.endTime
            );
          }

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

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (typeof window === 'undefined') return;
    if (this.scrollRafId !== null) return;
    this.scrollRafId = window.requestAnimationFrame(() => {
      this.updateActiveSectionFromScroll();
      this.scrollRafId = null;
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



  // Associated Doctors list & Branches & Gallery when in Clinic mode (populated from API)
  readonly associatedDoctors = signal<any[]>([]);
  readonly clinicPhotos = signal<{ url: string; caption: string }[]>([]);

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
    const userId = Number(this.authService.getuserid() || 0);
    const endpoint = this.isClinic()
      ? `${ApiEndPoints.GetClinicById}?clinicId=${this.practitionerId}&userId=${userId}`
      : `${ApiEndPoints.GetPractitionerById}?PractitionerId=${this.practitionerId}&UserId=${userId}`;
    const res = await this.apiService.Get<any>(endpoint);
    const data = res?.data ?? null;
    this.doctorDetail.set(data);

    if (data) {
      const isSaved = this.isClinic()
        ? Boolean(data.savedClinic)
        : Boolean(data.savedPractitioner || data.savedDoctor);
      this.isSaved.set(isSaved);

      if (data.city) {
        this.selectedCity.set(data.city);
      }

      if (this.isClinic()) {
        const rawPracs = Array.isArray(data.practitioners) ? data.practitioners : [];
        const feeFallback = Number(data.consultancyFees ?? data.consultationFee ?? 0);
        this.associatedDoctors.set(
          rawPracs.map((p: any) => ({
            id: p.practitionerId ?? p.id,
            practitionerId: p.practitionerId ?? p.id,
            name: p.fullName || p.practitionerName || 'Practitioner',
            degree: p.specialization || '',
            specialist: p.specialization || 'Physiotherapist',
            experienceYears: Number(p.experienceYears ?? 0),
            ratingPercent: Number(p.avgRating ?? 0),
            patientStoriesCount: Number(p.totalReviews ?? 0),
            consultationFee: Number(p.consultationFee ?? feeFallback),
            photo: p.profileImage || '',
            isVerified: Boolean(p.isVerified),
            specialties: p.specialization ? [p.specialization] : [],
          }))
        );

        const rawBranches = Array.isArray(data.branches) ? data.branches : [];
        this.associatedBranches.set(rawBranches);

        const rawGallery = Array.isArray(data.clinicGallery) ? data.clinicGallery : [];
        this.clinicPhotos.set(
          rawGallery
            .filter((g: any) => !!g?.imageUrl)
            .map((g: any, idx: number) => ({
              url: g.imageUrl,
              caption: `${data.clinicName || 'Clinic'} Photo ${idx + 1}`,
            }))
        );
      } else {
        this.associatedDoctors.set([]);
        this.associatedBranches.set([]);
        this.clinicPhotos.set([]);
      }
    } else {
      this.associatedDoctors.set([]);
      this.associatedBranches.set([]);
      this.clinicPhotos.set([]);
    }

    if (this.bookingForm && data) {
      const resolvedName = data.clinicName || data.fullName || '';
      const resolvedFee = Number(data.consultancyFees ?? data.consultationFee ?? 0);
      this.bookingForm.patchValue({
        practitionerId: this.practitionerId || data.practitionerId || data.id || 0,
        doctorName: resolvedName,
        consultationFee: resolvedFee,
      });
    }
  }

  /** Bookmark / Save Doctor toggle */
  async toggleSaveDoctor(): Promise<void> {
    if (!this.isLoggedIn) {
      this.showError('Please log in to save to your bookmarks.');
      return;
    }

    if (this.isSavingDoctor()) return;

    const userId = Number(this.authService.getuserid() || 0);
    if (!userId) {
      this.showError('User session expired. Please log in again.');
      return;
    }

    const doc = this.doctorDetail();
    const id = Number(this.practitionerId || doc?.practitionerId || doc?.id || 0);
    if (!id) {
      this.showError('Doctor details not loaded.');
      return;
    }

    this.isSavingDoctor.set(true);

    try {
      if (this.isClinic()) {
        if (this.isSaved()) {
          const res = await this.apiService.Get<boolean>(
            `${ApiEndPoints.RemoveSavedClinic}?userId=${userId}&clinicId=${id}`
          );
          if (res?.isSuccess) {
            this.isSaved.set(false);
            if (this.doctorDetail()) {
              this.doctorDetail.update(d => d ? ({ ...d, savedClinic: false } as any) : null);
            }
            this.showSuccess('Clinic removed from bookmarks.');
          } else {
            this.showError(res?.message || 'Failed to remove saved clinic.');
          }
        } else {
          const res = await this.apiService.Post<boolean>(ApiEndPoints.SaveClinic, {
            userId,
            clinicId: id
          });
          if (res?.isSuccess) {
            this.isSaved.set(true);
            if (this.doctorDetail()) {
              this.doctorDetail.update(d => d ? ({ ...d, savedClinic: true } as any) : null);
            }
            this.showSuccess('Clinic saved to bookmarks.');
          } else {
            this.showError(res?.message || 'Failed to save clinic.');
          }
        }
      } else {
        if (this.isSaved()) {
          const res = await this.apiService.Get<boolean>(
            `${ApiEndPoints.RemoveSavedPractitioner}?practitionerId=${id}`
          );
          if (res?.isSuccess) {
            this.isSaved.set(false);
            if (this.doctorDetail()) {
              this.doctorDetail.update(d => d ? { ...d, savedPractitioner: false } : null);
            }
            this.showSuccess('Doctor removed from bookmarks.');
          } else {
            this.showError(res?.message || 'Failed to remove saved doctor.');
          }
        } else {
          const res = await this.apiService.Post<boolean>(ApiEndPoints.SavePractitioner, {
            userId,
            practitionerId: id
          });
          if (res?.isSuccess) {
            this.isSaved.set(true);
            if (this.doctorDetail()) {
              this.doctorDetail.update(d => d ? { ...d, savedPractitioner: true } : null);
            }
            this.showSuccess('Doctor saved to bookmarks.');
          } else {
            this.showError(res?.message || 'Failed to save doctor.');
          }
        }
      }
    } catch (e: any) {
      console.error('Error toggling save status', e);
      this.showError('An error occurred. Please try again.');
    } finally {
      this.isSavingDoctor.set(false);
    }
  }

  /** API 2: Fetch Doctor or Clinic Availability Slots (Weekly / By Date) */
  async loadAvailability(overridePractitionerId?: number): Promise<void> {
    try {
      const targetId = overridePractitionerId || this.practitionerId;
      const query = !overridePractitionerId && this.isClinic()
        ? `clinicId=${targetId}`
        : `practitionerId=${targetId}`;
      const res = await this.apiService.Get<any>(`${ApiEndPoints.GetAvailability}?${query}`);
      if (res && res.isSuccess) {
        this.availabilitySlots.set(res.data ?? []);
      } else {
        this.availabilitySlots.set([]);
      }
    } catch (e) {
      console.error('Error loading availability', e);
      this.availabilitySlots.set([]);
    }
  }

  GetDate(): void {
    const today = new Date();
    const days: CarouselDay[] = [];
    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayNum = date.getDate();
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ...
      const dayName = date.toLocaleString('en-US', { weekday: 'short' });
      days.push({
        date,
        label: dayName,
        dateStr: `${dayNum} ${monthName}`,
        fullDateStr: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        dayOfWeek,
        hasSlots: false,
        slotCount: 0,
        availableSlots: []
      });
    }
    this.dayList.set(days);
  }

  onDayClick(day: CarouselDay, index: number): void {
    this.selectedDayIndex.set(index);
    this.selectedDay.set(day);
    this.selectedSlotTime.set('');
    this.selectedStartTime.set('');
    this.selectedEndTime.set('');

    const resolvedDate: Date = (day.date instanceof Date && !isNaN(day.date.getTime()))
      ? day.date
      : (typeof day.date === 'string' && day.date ? new Date(day.date) : new Date());
    const formattedDate = DateHelper.formatLocalDate(resolvedDate);

    if (this.bookingForm) {
      this.bookingForm.patchValue({
        consultancydate: formattedDate,
        appointmentDate: formattedDate,
        slotDate: formattedDate,
        slotTime: '',
        startTime: '',
        endTime: '',
        starttime: '',
        endtime: '',
        slotId: null // dayReset
      });
    }

    const availability = this.availabilitySlots().find(
      x => x.dayOfWeek === day.dayOfWeek
    );
    const slots = availability?.slots ?? [];
    this.selectedSlots.set(slots.filter(s => s.isActive !== false));
  }
  async GetAllReview(): Promise<void> {
    const payload = this.isClinic()
      ? { ClinicId: this.practitionerId }
      : { PractitionerId: this.practitionerId };
    const res = await this.apiService.Post<providerReview[]>(ApiEndPoints.GetAllReviews, payload);
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
        ...(this.isClinic()
          ? { clinicid: this.practitionerId }
          : { practitionerId: this.practitionerId }),
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
    const days = this.dayList();
    if (days.length > 0) {
      this.onDayClick(days[0], 0);
    }
  }

  selectDay(index: number): void {
    this.selectedDayIndex.set(index);
    // const days = this.dayList();
    // const day = days[index];
    // if (day?.hasSlots && day.availableSlots.length > 0) {
    //   this.selectedSlotTime.set(day.availableSlots[0]);
    // }
  }

  selectSlot(slotOrStart: slots | string, end?: string): void {
    let sTime = '';
    let eTime = '';
    let slotId: number | null = null;
    let sTimeStr = '';

    if (slotOrStart && typeof slotOrStart === 'object' && 'startTime' in slotOrStart) {
      const s = slotOrStart as slots; // current
      /* start real */
      sTime = s.startTime || '';
      eTime = s.endTime || '';
      slotId = s.id || null;
      sTimeStr = s.startTime && s.endTime ? `${s.startTime}–${s.endTime}` : (s.startTime || '');
    } else if (typeof slotOrStart === 'string') {
      if (end) {
        sTime = slotOrStart;
        eTime = end;
        sTimeStr = `${slotOrStart}–${end}`;
      } else {
        sTimeStr = slotOrStart;
        const parts = slotOrStart.split(/[–\-]/).map(x => x.trim());
        if (parts.length >= 2) {
          sTime = parts[0];
          eTime = parts[1];
        } else {
          sTime = slotOrStart;
        }
      }
    }

    this.selectedStartTime.set(sTime);
    this.selectedEndTime.set(eTime);
    this.selectedSlotTime.set(sTimeStr);

    if (this.bookingForm) {
      this.bookingForm.patchValue({
        slotTime: sTimeStr,
        startTime: sTime,
        endTime: eTime,
        starttime: sTime,
        endtime: eTime,
        slotId: slotId
      });
    }
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] || '00';
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hrsStr = hours < 10 ? `0${hours} ` : `${hours} `;
    return `${hrsStr}:${minutes} ${ampm} `;
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
    const hrsStr = hours < 10 ? `0${hours} ` : `${hours} `;
    return `${hrsStr}:${minutes} ${ampm} `;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5.3 Review Form Helpers
  // ─────────────────────────────────────────────────────────────────────────
  initForms(): void {
    const doc = this.doctorDetail();
    const resolvedName = doc?.clinicName || doc?.fullName || '';
    const resolvedFee = Number(doc?.consultancyFees ?? doc?.consultationFee ?? 0);
    this.bookingForm = this.fb.group({
      practitionerId: [this.practitionerId || doc?.practitionerId || doc?.id || 0, [Validators.required]],
      doctorName: [resolvedName],
      visitType: [this.isClinic() ? 'Clinic' : 'Home'],
      bookingRefId: [''],
      consultancydate: ['', [Validators.required]],
      appointmentDate: [''],
      slotDate: [''],
      slotTime: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      starttime: [''],
      endtime: [''],
      slotId: [null],
      consultationFee: [resolvedFee],
      mode: [this.isClinic() ? 'In-Clinic' : 'Home'],
      patientName: [''],
      homeVisitAddress: [''],
      address: ['']
    });
  }

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

  async selectDoctorForBooking(doc: any): Promise<void> {
    this.selectedAssociatedDoctor.set(doc);
    if (this.bookingForm && doc?.practitionerId) {
      this.bookingForm.patchValue({
        practitionerId: doc.practitionerId,
        doctorName: doc.name,
        consultationFee: doc.consultationFee ?? this.displayFee(),
      });
      await this.loadAvailability(Number(doc.practitionerId));
      this.autoSelectAvailableDay();
    }
    this.scrollToSection('info');
  }

  async confirmAppointmentDirectly(day: any, slotTimeOrForm?: any, existingRef?: string, startTime?: string, endTime?: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    const doc = this.doctorDetail();
    const ref = existingRef || `PHY - ${Math.floor(100000 + Math.random() * 900000)} `;
    const dateDisplay = day.fullDateStr || (day.dateStr ? `${day.label} (${day.dateStr})` : day.label);
    const doctorName = this.selectedAssociatedDoctor()?.name || this.displayName() || 'Healthcare Provider';

    // Resolve date to Date instance and YYYY-MM-DD date format
    const resolvedDate: Date = (day.date instanceof Date && !isNaN(day.date.getTime()))
      ? day.date
      : (typeof day.date === 'string' && day.date ? new Date(day.date) : new Date());
    const formattedDate = DateHelper.formatLocalDate(resolvedDate);

    const isFormObj = typeof slotTimeOrForm === 'object' && slotTimeOrForm !== null;
    const formValues = isFormObj ? slotTimeOrForm : (this.bookingForm ? this.bookingForm.value : {});
    const slotTime = isFormObj ? (formValues.slotTime || this.selectedSlotTime()) : (slotTimeOrForm || this.selectedSlotTime());
    const startTimeVal = startTime || formValues.startTime || this.selectedStartTime() || (slotTime ? slotTime.split(/[–\-]/)[0]?.trim() : '');
    const endTimeVal = endTime || formValues.endTime || this.selectedEndTime() || (slotTime ? slotTime.split(/[–\-]/)[1]?.trim() : '');
    const resolvedAmount = Number(this.selectedAssociatedDoctor()?.consultationFee ?? this.displayFee() ?? 0);

    // Send booking to backend API
    if (this.isLoggedIn) {
      try {
        const selectedPracId = this.selectedAssociatedDoctor()?.practitionerId;
        const payload = {
          practitionerId: selectedPracId || (!this.isClinic() ? (formValues.practitionerId || this.practitionerId || doc?.practitionerId) : undefined),
          clinicId: this.isClinic() ? (this.practitionerId || doc?.clinicId || doc?.id) : (doc?.clinicId || undefined),
          doctorName,
          visitType: this.isClinic() ? 'Clinic' : 'Home',
          bookingRefId: ref,
          consultancydate: formattedDate,
          appointmentDate: formattedDate,
          slotDate: formattedDate,
          slotTime,
          startTime: startTimeVal,
          endTime: endTimeVal,
          starttime: startTimeVal,
          endtime: endTimeVal,
          amount: resolvedAmount,
          mode: this.isClinic() ? 'Clinic' : 'Home',
          patientName: user?.fullName || this.authService.getUserName() || 'Patient',
          homeVisitAddress: formValues.homeVisitAddress || formValues.address || null,
        };
        await this.BookConsultancyApi(payload);
      } catch (err) {
        console.error('BookConsultancy API error:', err);
      }
    }

    this.bookingConfirmationDetails.set({
      doctorName,
      doctorSpecialty: this.selectedAssociatedDoctor()?.specialist || this.displaySpec() || 'Physiotherapist',
      doctorPhoto: this.selectedAssociatedDoctor()?.photo || this.displayPhoto(),
      clinicName: doc?.clinicName || this.displayName(),
      clinicAddress: this.displayAddress(),
      day: dateDisplay,
      date: formattedDate,
      time: slotTime,
      amount: resolvedAmount,
      bookingRefId: ref,
      patientName: user?.fullName || this.authService.getUserName() || 'Patient'
    });

    this.bookingMessage.set(`Appointment confirmed with ${doctorName} for ${dateDisplay} at ${slotTime} !`);
    this.bookingSuccess.set(true);
    this.bookingService.clearPendingSlot();
  }

  bookConsultancy(): void {
    if (!this.bookingForm) {
      this.initForms();
    }
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      if (!this.bookingForm.get('consultancydate')?.value) {
        this.showError('Please select an appointment date.');
        return;
      }
      if (!this.bookingForm.get('slotTime')?.value) {
        this.showError('Please select a time slot.');
        return;
      }
      this.showError('Please complete all required booking details.');
      return;
    }
    const formVal = this.bookingForm.value;
    const day = this.selectedDay() || { date: new Date(), label: 'Today', dateStr: 'Today', fullDateStr: '' };
    const doc = this.doctorDetail();
    const paramId = this.route.snapshot.paramMap.get('id') || '1';
    const providerId = ExploreService.extractIdFromSlug(paramId) || paramId || this.practitionerId || 1;
    if (this.authService.isLoggedIn()) {
      this.confirmAppointmentDirectly(day, formVal);
    } else {
      this.bookingService.savePendingSlot({
        providerId: Number(providerId) || 1,
        providerName: this.selectedAssociatedDoctor()?.name || this.displayName(),
        providerSpecialty: this.selectedAssociatedDoctor()?.specialist || this.displaySpec() || 'Physiotherapist',
        providerImage: this.selectedAssociatedDoctor()?.photo || this.displayPhoto(),
        clinicName: doc?.clinicName || this.displayName(),
        clinicAddress: this.displayAddress(),
        consultationFee: Number(this.selectedAssociatedDoctor()?.consultationFee ?? this.displayFee() ?? 0),
        selectedTime: formVal.slotTime || this.selectedSlotTime(),
        selectedDay: (day as any).label,
        selectedDate: (day as any).date,
        startTime: formVal.startTime || this.selectedStartTime(),
        endTime: formVal.endTime || this.selectedEndTime()
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
      ? ['info', 'availability', 'stories', 'doctors', 'branches', 'treatments', 'photos', 'qa']
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
