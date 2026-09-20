import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { expand } from 'rxjs';
import { BaseComponent } from '../../helper/base-component';
import { ApiEndPoints } from '../../helper/api-endpoints';
import { promises } from 'dns';
import { PractitionerModel } from '../../models/practitioner.model';
import { SharedModule } from '../../shared/shared-module';

export interface BadgeItem {
  iconType: 'verified' | 'clinic' | 'booking';
  line1: string;
  line2: string;
}

export interface ConditionCard {
  title: string;
  image: string;
  bgColor: string;
  route: string;
}

export interface FocusAreaCard {
  title: string;
  image: string;
  route: string;
}



export interface StepItem {
  num: number;
  title: string;
  description: string;
  iconType: 'search' | 'book' | 'consult' | 'heart';
}

export interface TestimonialItem {
  quote: string;
  name: string;
  city: string;
  rating: number;
  avatar: string;
}

export interface ValuePropItem {
  title: string;
  subtitle: string;
  iconType: 'hand' | 'walk' | 'dumbbell' | 'heart';
}

@Component({
  selector: 'app-findphysiotherapist',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './findphysiotherapist.html',
  styleUrl: './findphysiotherapist.css',
  encapsulation: ViewEncapsulation.None,
})
export class Findphysiotherapist extends BaseComponent implements OnInit {
  // Search state
  selectedCity = 'Mumbai';
  isCityOpen = false;
  PractitionerList: PractitionerModel[]
  searchQuery = '';

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.GetAllDoctors()
    ]);
  }
  readonly popularCities = [
    'Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Kota'
  ];

  // Content Data
  readonly heroContent = {
    eyebrow: 'MOVE BETTER. LIVE HEALTHIER.',
    title: 'Find a Physiotherapist',
    subtitle: 'Expert care for a pain-free, active life',
    description: 'Book appointments with verified physiotherapists near you for personalized treatment and faster recovery.',
    heroImage: 'assets/images/physio_home_care.jpg',
    accentText: {
      line1: 'Stronger',
      line2: 'Movement',
      line3: 'Happier You'
    },
    badges: [
      {
        iconType: 'verified',
        line1: 'Verified',
        line2: 'Physiotherapists'
      },
      {
        iconType: 'clinic',
        line1: 'Top Clinics',
        line2: 'Near You'
      },
      {
        iconType: 'booking',
        line1: 'Easy Online',
        line2: 'Booking'
      }
    ] as BadgeItem[]
  };

  readonly conditions: ConditionCard[] = [
    {
      title: 'Back Pain Relief',
      image: 'assets/images/physio_explore_conditions.jpg',
      bgColor: '#EBF5FB',
      route: '/doctors'
    },
    {
      title: 'Neck Pain Management',
      image: 'assets/images/physio_explore_conditions.jpg',
      bgColor: '#E8F8F5',
      route: '/doctors'
    },
    {
      title: 'Sports Injury',
      image: 'assets/images/physio_sports_injury.jpg',
      bgColor: '#FEF2F2',
      route: '/doctors'
    },
    {
      title: 'Post-Surgical Rehabilitation',
      image: 'assets/images/physio_rehab_plan.jpg',
      bgColor: '#F5EEF8',
      route: '/doctors'
    }
  ];

  readonly focusAreas: FocusAreaCard[] = [
    {
      title: 'Pediatric Physiotherapy',
      image: 'assets/images/physio_home_care.jpg',
      route: '/doctors'
    },
    {
      title: 'Geriatric Physiotherapy',
      image: 'assets/images/physio_rehab_plan.jpg',
      route: '/doctors'
    },
    {
      title: "Women's Health",
      image: 'assets/images/physio_book_consultation.jpg',
      route: '/doctors'
    },
    {
      title: 'Pain Management',
      image: 'assets/images/physio_sports_injury.jpg',
      route: '/doctors'
    }
  ];
  featuredDoctors: PractitionerModel[]
  // readonly featuredDoctors: PractitionerModel[] = [
  //   {
  //     name: 'Dr. Rohan Mehta',
  //     specialty: 'Sports Physiotherapist',
  //     rating: 4.8,
  //     reviewsCount: 120,
  //     tags: ['Sports Injury', 'Post-Surgical'],
  //     location: 'Gumanpura, Kota',
  //     image: 'assets/images/physio_find_doctor.jpg'
  //   },
  //   {
  //     name: 'Dr. Priya Sharma',
  //     specialty: 'Pediatric Physiotherapist',
  //     rating: 4.9,
  //     reviewsCount: 95,
  //     tags: ['Pediatric', 'Neuro Rehab'],
  //     location: 'Vigyan Nagar, Kota',
  //     image: 'assets/images/physio_book_consultation.jpg'
  //   },
  //   {
  //     name: 'Dr. Amit Verma',
  //     specialty: 'Orthopedic Physiotherapist',
  //     rating: 4.7,
  //     reviewsCount: 110,
  //     tags: ['Back Pain', 'Joint Care'],
  //     location: 'Talwandi, Kota',
  //     image: 'assets/images/physio_find_doctor.jpg'
  //   },
  //   {
  //     name: 'Dr. Sneha Kapoor',
  //     specialty: "Women's Health Physio",
  //     rating: 4.8,
  //     reviewsCount: 90,
  //     tags: ["Women's Health", 'Pelvic Care'],
  //     location: 'Gumanpura, Kota',
  //     image: 'assets/images/physio_book_consultation.jpg'
  //   }
  // ];

  readonly steps: StepItem[] = [
    {
      num: 1,
      title: 'Search',
      description: 'Find physiotherapists by location, condition or specialty',
      iconType: 'search'
    },
    {
      num: 2,
      title: 'Book',
      description: 'Choose a date & time that suits you',
      iconType: 'book'
    },
    {
      num: 3,
      title: 'Consult',
      description: 'Get expert guidance in-clinic or at home',
      iconType: 'consult'
    },
    {
      num: 4,
      title: 'Feel Better',
      description: 'Start your journey to a pain-free, active life',
      iconType: 'heart'
    }
  ];

  readonly testimonials: TestimonialItem[] = [
    {
      quote: 'The physiotherapy sessions helped me recover from my knee surgery faster than I expected. Highly recommended!',
      name: 'Ananya Singh',
      city: 'Kota',
      rating: 5.0,
      avatar: 'assets/images/physio_book_consultation.jpg'
    },
    {
      quote: 'Very professional and caring. My back pain has reduced significantly after just a few sessions.',
      name: 'Rahul Mehta',
      city: 'Kota',
      rating: 4.8,
      avatar: 'assets/images/physio_find_doctor.jpg'
    },
    {
      quote: 'Home visit therapy was so convenient for my mother. The physiotherapist was polite and highly skilled.',
      name: 'Neha Gupta',
      city: 'Kota',
      rating: 4.9,
      avatar: 'assets/images/physio_book_consultation.jpg'
    }
  ];

  readonly appFeatures = [
    'Book Appointments',
    'Manage Your Visits',
    'Personalized Exercise Plans',
    'Get Expert Advice',
    'Exclusive Health Tips'
  ];

  readonly valueProps: ValuePropItem[] = [
    {
      title: 'Relieve Pain',
      subtitle: 'Live without limitations',
      iconType: 'hand'
    },
    {
      title: 'Regain Mobility',
      subtitle: 'Do what you love again',
      iconType: 'walk'
    },
    {
      title: 'Stronger Everyday',
      subtitle: 'Build a healthier tomorrow',
      iconType: 'dumbbell'
    },
    {
      title: 'Supported Always',
      subtitle: 'Expert care at every step',
      iconType: 'heart'
    }
  ];

  toggleCity(): void {
    this.isCityOpen = !this.isCityOpen;
  }

  selectCity(city: string): void {
    this.selectedCity = city;
    this.isCityOpen = false;
  }
  async GetAllDoctors(): Promise<void> {
    debugger;
    const res = await this.apiService.Post<PractitionerModel[]>(ApiEndPoints.GetPractitioners);
    this.PractitionerList = res.isSuccess ? (res.data ?? []) : []
  }
}
