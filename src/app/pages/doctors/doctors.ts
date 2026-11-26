import { Component, signal, computed, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { BaseComponent } from '../../helper/base-component';
import { PractitionerModel, PractitionerFilterViewModel, ClinicFilter } from '../../models/practitioner.model';
import { ClinicBranchDto } from '../../models/clinic.model';
import { ApiEndPoints } from '../../helper/api-endpoints';
import { SharedModule } from '../../shared/shared-module';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';


export interface ClinicItem {
  id: number;
  name: string;
  image: string | null;
  bannerImage?: string | null;
  rating: number;
  reviewsCount: number;
  location: string; // Strictly without distance / 'km away'
  city?: string;
  state?: string;
  pincode?: string;
  specialties: string[];
  branches: ClinicBranchDto[];
  price: number;
  isVerified: boolean;
  phone?: string;
  email?: string;
  description?: string;
  fullAddress?: string;
  doctorsCount: number;
}

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [SharedModule, SearchBarComponent],
  templateUrl: './doctors.html',
  styleUrl: './doctors.css',
})
export class Doctors extends BaseComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private route = inject(ActivatedRoute);
  private searchDebounceTimer: any = null;
  readonly PractitionerList = signal<PractitionerModel[]>([]);
  readonly isLoading = signal<boolean>(true);

  // Distinguishes Doctor Mode vs Clinic Mode
  readonly isClinic = signal<boolean>(false);

  // City and Search filter context
  readonly selectedCity = signal<string>('Gumanpura, Kota');
  readonly searchQuery = signal<string>('');
  readonly isCityOpen = signal<boolean>(false);


  readonly popularCities = [
    'All Cities',
    'Kota',
    'Jaipur',
    'Mumbai',
    'Delhi NCR',
    'Bangalore',
    'Hyderabad',
    'Pune',
  ];

  readonly currentSpecialty = signal<string>('Physiotherapists');

  // Filter state for ribbon (Doctors)
  readonly selectedGender = signal<string>('all');
  readonly selectedExperience = signal<string>('all');
  readonly selectedStories = signal<string>('all');

  // Filter state for ribbon (Clinics)
  readonly selectedSpecialty = signal<string>('all');

  // Shared Sort state
  readonly sortBy = signal<string>('relevance');

  // Active dropdown menu for filter ribbon
  readonly activeDropdown = signal<string | null>(null);
  readonly dropdownPosition = signal<{ top: number; left: number } | null>(null);

  // App download mobile input
  readonly mobileNumber = signal<string>('');
  readonly appLinkSent = signal<boolean>(false);

  // Booking Modal State (for Doctors)
  readonly bookingDoctor = signal<PractitionerModel | null>(null);
  readonly selectedSlot = signal<string>('10:00 AM');
  readonly bookingSuccess = signal<boolean>(false);

  // Real Clinic Data loaded from API
  readonly allClinics = signal<ClinicItem[]>([]);

  readonly clinicSpecialties = computed<string[]>(() => {
    const unique = new Set<string>();
    for (const clinic of this.allClinics()) {
      for (const spec of clinic.specialties) {
        if (spec) {
          unique.add(spec);
        }
      }
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  });

  // Filtered Clinics computed
  readonly filteredClinics = computed(() => {
    let list = [...this.allClinics()];

    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.location.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query)) ||
        c.specialties.some(s => s.toLowerCase().includes(query)) ||
        c.branches.some(b =>
          (b.branchName && b.branchName.toLowerCase().includes(query)) ||
          (b.city && b.city.toLowerCase().includes(query)) ||
          (b.address && b.address.toLowerCase().includes(query))
        )
      );
    }

    const spec = this.selectedSpecialty();
    if (spec !== 'all') {
      list = list.filter(c =>
        c.specialties.some(s => s.toLowerCase() === spec.toLowerCase())
      );
    }

    const sort = this.sortBy();
    if (sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'reviews' || sort === 'popularity') {
      list.sort((a, b) => b.reviewsCount - a.reviewsCount);
    }

    return list;
  });

  ngOnInit(): void {
    this.detectMode();
    if (this.isClinic()) {
      this.GetAllClinics();
    } else {
      this.GetAllDoctors();
    }
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const wasClinic = this.isClinic();
        this.detectMode();
        if (wasClinic !== this.isClinic()) {
          if (this.isClinic()) {
            this.GetAllClinics();
          } else {
            this.GetAllDoctors();
          }
        }
      }
    });
  }

  private detectMode(): void {
    const isClinicRoute =
      this.route.snapshot.data['isClinic'] === true ||
      this.router.url.includes('clinic');
    this.isClinic.set(isClinicRoute);
  }

  readonly hasActiveFilters = computed(() => {
    if (this.isClinic()) {
      return (
        this.selectedSpecialty() !== 'all' ||
        this.sortBy() !== 'relevance' ||
        this.searchQuery().trim().length > 0
      );
    }
    return (
      this.selectedGender() !== 'all' ||
      this.selectedExperience() !== 'all' ||
      this.sortBy() !== 'relevance' ||
      this.searchQuery().trim().length > 0
    );
  });

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  toggleCity(): void {
    this.isCityOpen.update(v => !v);
  }

  selectCity(city: string): void {
    this.selectedCity.set(city);
    this.isCityOpen.set(false);
    if (this.isClinic()) {
      this.GetAllClinics(false);
    } else {
      this.GetAllDoctors();
    }
  }

  onCityChange(city: string): void {
    this.selectedCity.set(city);
    if (this.isClinic()) {
      this.GetAllClinics(false);
    } else {
      this.GetAllDoctors();
    }
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      if (this.isClinic()) {
        this.GetAllClinics(false);
      } else {
        this.GetAllDoctors();
      }
    }, 500);
  }

  onSearchSubmit(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    if (this.isClinic()) {
      this.GetAllClinics(false);
    } else {
      this.GetAllDoctors();
    }
  }

  toggleDropdown(name: string, triggerBtn?: HTMLElement): void {
    if (this.activeDropdown() === name) {
      this.closeDropdown();
      return;
    }

    if (triggerBtn) {
      const rect = triggerBtn.getBoundingClientRect();
      const estimatedWidth = name === 'sort' ? 220 : 190;
      const screenWidth = window.innerWidth;

      let left = rect.left;
      if (left + estimatedWidth > screenWidth - 12) {
        left = Math.max(12, screenWidth - estimatedWidth - 12);
      }
      if (left < 12) {
        left = 12;
      }

      this.dropdownPosition.set({
        top: Math.round(rect.bottom + 6),
        left: Math.round(left),
      });
    }

    this.activeDropdown.set(name);
  }

  closeDropdown(): void {
    this.activeDropdown.set(null);
    this.dropdownPosition.set(null);
  }

  setGenderFilter(val: string): void {
    this.selectedGender.set(val);
    this.closeDropdown();
    if (!this.isClinic()) {
      this.GetAllDoctors();
    }
  }

  setExperienceFilter(val: string): void {
    this.selectedExperience.set(val);
    this.closeDropdown();
    if (!this.isClinic()) {
      this.GetAllDoctors();
    }
  }

  setStoriesFilter(val: string): void {
    this.selectedStories.set(val);
    this.closeDropdown();
  }

  setSortBy(val: string): void {
    this.sortBy.set(val);
    this.closeDropdown();
    if (this.isClinic()) {
      this.GetAllClinics(false);
    } else {
      this.GetAllDoctors();
    }
  }

  resetFilters(): void {
    this.selectedGender.set('all');
    this.selectedExperience.set('all');
    this.selectedSpecialty.set('all');
    this.sortBy.set('relevance');
    this.searchQuery.set('');
    if (this.isClinic()) {
      this.selectedCity.set('All Cities');
      this.GetAllClinics(false);
    } else {
      this.GetAllDoctors();
    }
  }

  selectSpecialty(spec: string): void {
    this.selectedSpecialty.set(spec);
    this.closeDropdown();
    if (this.isClinic()) {
      this.GetAllClinics(false);
    }
  }

  getClinicInitials(name?: string | null): string {
    if (!name) return 'CL';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }

  sendAppLink(): void {
    if (this.mobileNumber().trim().length >= 10) {
      this.appLinkSent.set(true);
      setTimeout(() => {
        this.appLinkSent.set(false);
        this.mobileNumber.set('');
      }, 4000);
    }
  }

  openBooking(doctor: PractitionerModel): void {
    this.bookingDoctor.set(doctor);
    this.bookingSuccess.set(false);
  }

  closeBooking(): void {
    this.bookingDoctor.set(null);
  }

  confirmBooking(): void {
    this.bookingSuccess.set(true);
    setTimeout(() => {
      this.closeBooking();
    }, 2000);
  }

  async GetAllClinics(allowAllCitiesFallback = true): Promise<void> {
    this.isLoading.set(true);
    try {
      const rawCity = this.selectedCity()?.trim() || '';
      const city = !rawCity || rawCity === 'All Cities' ? null : rawCity;
      const search = this.searchQuery()?.trim() || null;
      const specialty = this.selectedSpecialty() === 'all' ? null : this.selectedSpecialty();

      const payload: ClinicFilter = {
        city,
        search,
        specialty,
        sortBy: this.sortBy(),
        page: 1,
        pageSize: 50,
      };

      const res = await this.apiService.Post<any>(ApiEndPoints.GetClinics, payload);
      const rawList = res?.isSuccess && Array.isArray(res?.data) ? res.data : [];

      if (allowAllCitiesFallback && rawCity === 'Gumanpura, Kota' && !search && rawList.length === 0) {
        this.selectedCity.set('All Cities');
        await this.GetAllClinics(false);
        return;
      }

      const mapped: ClinicItem[] = rawList
        .map((c: any) => {
          const clinicId = Number(c.clinicId ?? c.id ?? 0);
          const branches: ClinicBranchDto[] = Array.isArray(c.branches) ? c.branches : [];
          const services: string[] = Array.isArray(c.services) ? c.services : [];
          const location = [c.address, c.city, c.stateName ?? c.state]
            .filter((part: any) => !!part && String(part).trim().length > 0)
            .join(', ');

          return {
            id: clinicId,
            name: c.clinicName || 'Physiotherapy Clinic',
            image: c.logoUrl || c.logo || c.bannerImageUrl || c.bannerImage || null,
            bannerImage: c.bannerImageUrl || c.bannerImage || null,
            rating: Number(c.avgRating ?? 0),
            reviewsCount: Number(c.totalReviews ?? 0),
            location: location || 'Location not specified',
            city: c.city ?? undefined,
            state: c.stateName ?? c.state ?? undefined,
            pincode: c.pincode ?? undefined,
            specialties: services,
            branches,
            price: Number(c.consultancyFees ?? 0),
            isVerified: Boolean(c.isApproved),
            phone: c.phone ?? undefined,
            email: c.email ?? undefined,
            description: c.description ?? undefined,
            fullAddress: c.address ?? undefined,
            doctorsCount: Number(c.doctorsCount ?? 0),
          };
        })
        .filter((c: ClinicItem) => c.id > 0);

      this.allClinics.set(mapped);
    } catch (error) {
      console.error('GetAllClinics ERROR:', error);
      this.allClinics.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async GetAllDoctors(): Promise<void> {
    console.log('GetAllDoctors started with filters');
    this.isLoading.set(true);

    try {
      // 1. SortBy mapping
      let sortParam = 'Relevance';
      const sort = this.sortBy();
      if (sort === 'popularity') sortParam = 'Popularity';
      else if (sort === 'rating') sortParam = 'RatingHighToLow';
      else if (sort === 'experience') sortParam = 'ExperienceHighToLow';
      else if (sort === 'fee' || sort === 'price-low') sortParam = 'FeeLowToHigh';

      // 2. Gender mapping: 'all' -> null, 'male' -> 'Male', 'female' -> 'Female'
      let genderParam: string | null = null;
      const g = this.selectedGender().toLowerCase();
      if (g.includes('male') && !g.includes('female')) genderParam = 'Male';
      else if (g.includes('female')) genderParam = 'Female';

      // 3. Experience mapping: 'all' -> null, '5' -> 5, '10' -> 10, '15' -> 15
      let expParam: number | null = null;
      if (this.selectedExperience() !== 'all') {
        const parsed = parseInt(this.selectedExperience(), 10);
        if (!isNaN(parsed) && parsed > 0) {
          expParam = parsed;
        }
      }

      // 4. City & Search
      const rawCity = this.selectedCity()?.trim() || '';
      const city = !rawCity || rawCity === 'All Cities' ? null : rawCity;
      const search = this.searchQuery()?.trim() || null;

      const payload: PractitionerFilterViewModel = {
        city: city || null,
        search: search || null,
        gender: genderParam,
        minExperience: expParam,
        sortBy: sortParam,
        page: 1,
        pageSize: 50,
      };

      console.log('GetAllDoctors payload:', payload);

      const res = await this.apiService.Post<any>(
        ApiEndPoints.GetPractitioners,
        payload
      );

      console.log('GetAllDoctors response:', res);

      this.PractitionerList.set(
        res?.isSuccess && Array.isArray(res?.data) ? res.data : []
      );
    } catch (error) {
      console.error('GetAllDoctors ERROR:', error);
      this.PractitionerList.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

}
