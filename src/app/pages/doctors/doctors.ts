import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { BaseComponent } from '../../helper/base-component';
import { PractitionerModel } from '../../models/practitioner.model';
import { ApiEndPoints } from '../../helper/api-endpoints';
import { SharedModule } from '../../shared/shared-module';


export interface ClinicAmenity {
  icon: 'equipment' | 'parking' | 'accessible' | 'team' | 'home' | 'timing' | 'reports';
  label: string;
}

export interface ClinicItem {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewsCount: number;
  location: string; // Strictly without distance / 'km away'
  specialties: string[];
  amenities: ClinicAmenity[];
  price: number;
  isVerified: boolean;
  phone?: string;
  fullAddress?: string;
  timings?: string;
  doctorsCount?: number;
}

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './doctors.html',
  styleUrl: './doctors.css',
})
export class Doctors extends BaseComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly PractitionerList = signal<PractitionerModel[]>([]);
  readonly isLoading = signal<boolean>(true);


  // Distinguishes Doctor Mode vs Clinic Mode
  readonly isClinic = signal<boolean>(false);

  // City and Search filter context
  readonly selectedCity = signal<string>('Gumanpura, Kota');
  readonly searchQuery = signal<string>('');
  readonly isCityOpen = signal<boolean>(false);

  readonly popularCities = [
    'Gumanpura, Kota',
    'Talwandi, Kota',
    'Vigyan Nagar, Kota',
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
  readonly selectedAmenity = signal<string>('all');

  // Shared Sort state
  readonly sortBy = signal<string>('relevance');

  // Active dropdown menu for filter ribbon
  readonly activeDropdown = signal<string | null>(null);

  // App download mobile input
  readonly mobileNumber = signal<string>('');
  readonly appLinkSent = signal<boolean>(false);

  // Booking Modal State (for Doctors)
  readonly bookingDoctor = signal<PractitionerModel | null>(null);
  readonly selectedSlot = signal<string>('10:00 AM');
  readonly bookingSuccess = signal<boolean>(false);



  // Clinic Data
  readonly allClinics = signal<ClinicItem[]>([
    {
      id: 'clinic-1',
      name: 'MoveWell Physiotherapy Clinic',
      image: 'assets/images/physio_clinic_near_you.jpg',
      rating: 4.8,
      reviewsCount: 124,
      location: 'Gumanpura, Kota',
      specialties: ['Orthopedic', 'Sports', 'Neuro', 'Post-Surgical', "Women's Health"],
      amenities: [
        { icon: 'equipment', label: 'Modern Equipment' },
        { icon: 'parking', label: 'Parking Available' },
        { icon: 'accessible', label: 'Accessible' },
      ],
      price: 500,
      isVerified: true,
      phone: '+91 744 245 8901',
      fullAddress: 'Plot 14, Main Road, Gumanpura, Kota, Rajasthan 324007',
      timings: 'Mon - Sat: 08:00 AM - 08:30 PM | Sun: 09:00 AM - 01:00 PM',
      doctorsCount: 4,
    },
    {
      id: 'clinic-2',
      name: 'LifeCare Physio Clinic',
      image: 'assets/images/physio_find_clinic.jpg',
      rating: 4.6,
      reviewsCount: 98,
      location: 'Gumanpura, Kota',
      specialties: ['Orthopedic', 'Geriatric', 'Pediatric', 'Sports', 'Pain Management'],
      amenities: [
        { icon: 'team', label: 'Experienced Team' },
        { icon: 'home', label: 'Home Visit Available' },
        { icon: 'timing', label: 'Flexible Timings' },
      ],
      price: 600,
      isVerified: true,
      phone: '+91 744 246 1122',
      fullAddress: '2nd Floor, Apex Commercial Complex, Gumanpura, Kota, Rajasthan 324007',
      timings: 'Mon - Sat: 09:00 AM - 09:00 PM | Sun: Closed',
      doctorsCount: 3,
    },
    {
      id: 'clinic-3',
      name: 'RehabPlus Clinic',
      image: 'assets/images/physio_rehab_plan.jpg',
      rating: 4.7,
      reviewsCount: 76,
      location: 'Gumanpura, Kota',
      specialties: ['Neuro', 'Post-Surgical', 'Sports', "Women's Health", 'Pediatric'],
      amenities: [
        { icon: 'equipment', label: 'Advanced Equipment' },
        { icon: 'parking', label: 'Parking Available' },
        { icon: 'reports', label: 'Online Reports' },
      ],
      price: 550,
      isVerified: true,
      phone: '+91 744 247 3344',
      fullAddress: 'Near City Mall Circle, Jhalawar Road, Gumanpura, Kota, Rajasthan 324005',
      timings: 'Mon - Sun: 08:30 AM - 08:30 PM',
      doctorsCount: 5,
    },
    {
      id: 'clinic-4',
      name: 'Physiosmate Sports & Spine Centre',
      image: 'assets/images/physio_sports_injury.jpg',
      rating: 4.9,
      reviewsCount: 154,
      location: 'Talwandi, Kota',
      specialties: ['Sports', 'Orthopedic', 'Spine Care', 'Pain Management', 'Post-Surgical'],
      amenities: [
        { icon: 'equipment', label: 'Modern Equipment' },
        { icon: 'team', label: 'Experienced Team' },
        { icon: 'accessible', label: 'Accessible' },
      ],
      price: 500,
      isVerified: true,
      phone: '+91 744 240 7788',
      fullAddress: 'Sector A, Talwandi, Kota, Rajasthan 324005',
      timings: 'Mon - Sat: 08:00 AM - 08:00 PM',
      doctorsCount: 6,
    },
    {
      id: 'clinic-5',
      name: 'ActiveMotion Pediatric & Neuro Rehab',
      image: 'assets/images/physio_book_consultation.jpg',
      rating: 4.8,
      reviewsCount: 88,
      location: 'Vigyan Nagar, Kota',
      specialties: ['Pediatric', 'Neuro', 'Geriatric', 'Post-Surgical'],
      amenities: [
        { icon: 'accessible', label: 'Wheelchair Accessible' },
        { icon: 'timing', label: 'Extended Hours' },
      ],
      price: 650,
      isVerified: true,
      phone: '+91 744 241 2233',
      fullAddress: 'Road No. 1, Vigyan Nagar, Kota, Rajasthan 324005',
      timings: 'Mon - Sat: 09:00 AM - 08:00 PM',
      doctorsCount: 4,
    },
  ]);

  readonly specialtiesList = [
    'All',
    'Orthopedic',
    'Sports',
    'Neuro',
    'Post-Surgical',
    "Women's Health",
    'Pediatric',
    'Pain Management',
    'Geriatric',
  ];

  // Filtered Clinics computed
  readonly filteredClinics = computed(() => {
    let list = [...this.allClinics()];

    // Search query filter
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.location.toLowerCase().includes(query) ||
          c.specialties.some(s => s.toLowerCase().includes(query))
      );
    }

    // Specialty filter
    const spec = this.selectedSpecialty();
    if (spec !== 'all') {
      list = list.filter(c =>
        c.specialties.some(s => s.toLowerCase() === spec.toLowerCase())
      );
    }

    // Amenity filter
    const amenity = this.selectedAmenity();
    if (amenity !== 'all') {
      list = list.filter(c =>
        c.amenities.some(a => a.label.toLowerCase().includes(amenity.toLowerCase()))
      );
    }

    // Sort order
    const sort = this.sortBy();
    if (sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'reviews') {
      list.sort((a, b) => b.reviewsCount - a.reviewsCount);
    }

    return list;
  });

  ngOnInit(): void {
    this.detectMode();
    this.GetAllDoctors()
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.detectMode();
      }
    });
  }

  private detectMode(): void {
    const isClinicRoute =
      this.route.snapshot.data['isClinic'] === true ||
      this.router.url.includes('clinic');
    this.isClinic.set(isClinicRoute);
  }

  toggleCity(): void {
    this.isCityOpen.update(v => !v);
  }

  selectCity(city: string): void {
    this.selectedCity.set(city);
    this.isCityOpen.set(false);
  }

  toggleDropdown(name: string): void {
    this.activeDropdown.update(cur => (cur === name ? null : name));
  }

  closeDropdown(): void {
    this.activeDropdown.set(null);
  }

  setGenderFilter(val: string): void {
    this.selectedGender.set(val);
    this.closeDropdown();
  }

  setExperienceFilter(val: string): void {
    this.selectedExperience.set(val);
    this.closeDropdown();
  }

  setStoriesFilter(val: string): void {
    this.selectedStories.set(val);
    this.closeDropdown();
  }

  setSortBy(val: string): void {
    this.sortBy.set(val);
    this.closeDropdown();
  }

  selectSpecialty(spec: string): void {
    this.selectedSpecialty.set(spec);
    this.closeDropdown();
  }

  selectAmenity(amenity: string): void {
    this.selectedAmenity.set(amenity);
    this.closeDropdown();
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
  async GetAllDoctors(): Promise<void> {
    console.log('GetAllDoctors started');
    this.isLoading.set(true);

    try {
      const res = await this.apiService.Post<any[]>(
        ApiEndPoints.GetPractitioners
      );

      console.log('GetAllDoctors response:', res);

      this.PractitionerList.set(
        res.isSuccess ? (res.data ?? []) : []
      );

    } catch (error) {
      console.error('GetAllDoctors ERROR:', error);
      this.PractitionerList.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
  async AddeReview() {

  }
}
