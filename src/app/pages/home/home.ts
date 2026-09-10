import { Component, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  @ViewChild('inClinicSwiper') inClinicSwiperRef?: ElementRef<HTMLDivElement>;

  private swiperInstance?: Swiper;

  readonly selectedCity = signal<string>('Mumbai');
  readonly searchQuery = signal<string>('');
  readonly isCityOpen = signal<boolean>(false);

  readonly popularCities = [
    'Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'
  ];

  // 4 Featured Cards (Using Green/Mint/Aqua tones from variable.css)
  readonly cards = [
    {
      title: 'Home Physiotherapy',
      subtitle: 'Get expert physiotherapy at your doorstep',
      image: 'assets/images/physio_home_care.jpg',
      icon: 'home',
      route: '/find-doctors'
    },
    {
      title: 'Clinic Near You',
      subtitle: 'Discover trusted physiotherapy clinics near you',
      image: 'assets/images/physio_clinic_near_you.jpg',
      icon: 'clinic',
      route: '/find-doctors'
    },
    {
      title: 'Find a Physiotherapist',
      subtitle: 'Explore physiotherapists by expertise, experience and location',
      image: 'assets/images/physio_find_doctor.jpg',
      icon: 'doctor',
      route: '/find-doctors'
    },
    {
      title: 'Explore Conditions',
      subtitle: 'Understand your condition and find the right care',
      image: 'assets/images/physio_explore_conditions.jpg',
      icon: 'conditions',
      route: '/doctors'
    }
  ];

  // 6 Conditions (Using brand green, teal, and aqua from variable.css)
  readonly conditions = [
    {
      name: 'Neck pain',
      icon: 'neck',
      bgColor: '#E8F8F5',
      iconColor: '#087F76'
    },
    {
      name: 'Back pain',
      icon: 'back',
      bgColor: '#E9FAF9',
      iconColor: '#10A896'
    },
    {
      name: 'Lower pain',
      icon: 'lower',
      bgColor: '#D5F3EF',
      iconColor: '#087F76'
    },
    {
      name: 'Knee pain',
      icon: 'knee',
      bgColor: '#E8F8F5',
      iconColor: '#10A896'
    },
    {
      name: 'Shoulder pain',
      icon: 'shoulder',
      bgColor: '#E9FAF9',
      iconColor: '#32AAA5'
    },
    {
      name: 'Sports injury',
      icon: 'sports',
      bgColor: '#D0F0E8',
      iconColor: '#087F76'
    }
  ];

  // In-Clinic Consultation Cards
  readonly inClinicConsultations = [
    {
      title: 'Orthopedic Physiotherapy',
      subtitle: 'Pain, injuries, joints, bones & musculoskeletal conditions',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=500&q=80',
      route: '/doctors/orthopedic-physiotherapy'
    },
    {
      title: 'Neurological Physiotherapy',
      subtitle: 'Stroke recovery, nerve conditions & movement disorders',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=500&q=80',
      route: '/doctors/gynecologist'
    },
    {
      title: 'Sports Physiotherapy',
      subtitle: 'Sports injuries, performance & injury prevention',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80',
      route: '/doctors/dietitian'
    },
    {
      title: 'Pediatric Physiotherapy',
      subtitle: 'Movement, development & rehabilitation for children',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=500&q=80',
      route: '/doctors/physiotherapist'
    },
    {
      title: 'Cardiopulmonary Physiotherapy',
      subtitle: 'Breathing, cardiac & respiratory rehabilitation',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=500&q=80',
      route: '/doctors/physiotherapist'
    }
  ];

  // Articles from Health Experts
  readonly articles = [
    {
      category: 'CORONAVIRUS',
      title: '12 Coronavirus Myths and Facts That You Should Be Aware Of',
      author: 'Dr. Diana Borgio',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=500&q=80',
      route: '/articles/coronavirus-myths'
    },
    {
      category: 'VITAMINS AND SUPPLEMENTS',
      title: 'Eating Right to Build Immunity Against Cold and Viral Infections',
      author: 'Dr. Diana Borgio',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80',
      route: '/articles/eating-right-immunity'
    }
  ];

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && this.inClinicSwiperRef?.nativeElement) {
      const container = this.inClinicSwiperRef.nativeElement;
      const wrapper = container.closest('.physios-inclinic-cards-wrapper');

      setTimeout(() => {
        const nextBtn = wrapper?.querySelector('.physios-carousel-next') as HTMLElement;
        const prevBtn = wrapper?.querySelector('.physios-carousel-prev') as HTMLElement;

        this.swiperInstance = new Swiper(container, {
          modules: [Navigation],
          slidesPerView: 4,
          spaceBetween: 20,
          observer: true,
          observeParents: true,
          navigation: {
            nextEl: nextBtn,
            prevEl: prevBtn,
          },
          breakpoints: {
            0: { slidesPerView: 1, spaceBetween: 16 },
            576: { slidesPerView: 2, spaceBetween: 16 },
            768: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 4, spaceBetween: 20 },
          },
        });
      }, 0);
    }
  }

  ngOnDestroy(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
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

