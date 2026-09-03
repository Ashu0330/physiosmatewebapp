import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  readonly selectedCity = signal<string>('Mumbai');
  readonly searchQuery = signal<string>('');
  readonly isCityOpen = signal<boolean>(false);

  readonly popularCities = [
    'Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'
  ];

  // 4 Featured Cards (Using Green/Mint/Aqua tones from variable.css)
  readonly cards = [
    {
      title: 'Instant Video Consultation',
      subtitle: 'Connect within 60 secs',
      image: 'assets/images/physio_easy_consult.jpg',
      bgColor: '#E8F8F5',
      route: '/video-consult'
    },
    {
      title: 'Find Doctors Near You',
      subtitle: 'Confirmed appointments',
      image: 'assets/images/physio_find_clinic.jpg',
      bgColor: '#E9FAF9',
      route: '/find-doctors'
    },
    {
      title: 'Lab Tests',
      subtitle: 'Safe and trusted lab tests',
      image: 'assets/images/physio_sports_injury.jpg',
      bgColor: '#D5F3EF',
      route: '/lab-tests'
    },
    {
      title: 'Surgeries',
      subtitle: 'Safe and trusted surgery centers',
      image: 'assets/images/physio_rehab_plan.jpg',
      bgColor: '#D0F0E8',
      route: '/surgeries'
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
      title: 'Dentist',
      subtitle: 'Teething troubles? Schedule a dental checkup',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=500&q=80',
      route: '/doctors/dentist'
    },
    {
      title: 'Gynecologist/Obstetrician',
      subtitle: 'Explore for women\'s health, pregnancy and infertility treatments',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=500&q=80',
      route: '/doctors/gynecologist'
    },
    {
      title: 'Dietitian/Nutrition',
      subtitle: 'Get guidance on eating right, weight management and sports nutrition',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80',
      route: '/doctors/dietitian'
    },
    {
      title: 'Physiotherapist',
      subtitle: 'Pulled a muscle? Get it treated by a trained physiotherapist',
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

  toggleCity(): void {
    this.isCityOpen.update(v => !v);
  }

  selectCity(city: string): void {
    this.selectedCity.set(city);
    this.isCityOpen.set(false);
  }
}
