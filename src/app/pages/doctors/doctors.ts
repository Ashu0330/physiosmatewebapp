import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface Doctor {
  id: string;
  name: string;
  degree: string;
  specialist: string;
  experienceYears: number;
  location: string;
  clinicName: string;
  fee: number;
  ratingPercent: number;
  patientStoriesCount: number;
  availableText: string;
  photo: string;
  gender: 'male' | 'female';
  prime: boolean;
  isVerified: boolean;
}

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './doctors.html',
  styleUrl: './doctors.css',
})
export class Doctors {
  // City and Search filter context (matching home.html filter)
  readonly selectedCity = signal<string>('Gumanpura, Kota');
  readonly searchQuery = signal<string>('Dentist');
  readonly isCityOpen = signal<boolean>(false);

  readonly popularCities = [
    'Gumanpura, Kota', 'Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'
  ];

  readonly currentSpecialty = signal<string>('Dentists');
  
  // Filter state for ribbon
  readonly selectedGender = signal<string>('all');
  readonly selectedExperience = signal<string>('all');
  readonly selectedStories = signal<string>('all');
  readonly sortBy = signal<string>('relevance');

  // Active dropdown menu for filter ribbon
  readonly activeDropdown = signal<string | null>(null);

  // App download mobile input
  readonly mobileNumber = signal<string>('');
  readonly appLinkSent = signal<boolean>(false);

  // Booking Modal State
  readonly bookingDoctor = signal<Doctor | null>(null);
  readonly selectedSlot = signal<string>('10:00 AM');
  readonly bookingSuccess = signal<boolean>(false);

  // Doctor Data
  readonly doctorsList = signal<Doctor[]>([
    {
      id: 'doc-1',
      name: 'Dr. Sandeep Singh Bhatia',
      degree: 'BDS, MDS - Orthodontics',
      specialist: 'Dentist',
      experienceYears: 17,
      location: 'Talwandi, Kota',
      clinicName: "Dr. Sandeep's Orthodontic & Dental Clinic",
      fee: 200,
      ratingPercent: 98,
      patientStoriesCount: 244,
      availableText: 'Available Tomorrow',
      photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      gender: 'male',
      prime: true,
      isVerified: true,
    },
    {
      id: 'doc-2',
      name: 'Dr. Anshul Mohan Mathur',
      degree: 'BDS, Dental Surgeon',
      specialist: 'Dentist',
      experienceYears: 30,
      location: 'Talwandi, Kota',
      clinicName: 'Mathur Dental Clinic',
      fee: 400,
      ratingPercent: 98,
      patientStoriesCount: 799,
      availableText: 'Available Today',
      photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
      gender: 'male',
      prime: false,      
      isVerified: true,

    },
    {
      id: 'doc-3',
      name: 'Dr. Jaya Singhvi',
      degree: 'BDS, Cosmetic Dentistry',
      specialist: 'Dentist',
      experienceYears: 23,
      location: 'Talwandi, Kota',
      clinicName: "Twacha Skin Clinic & Dr Jaya's Dental Clinic",
      fee: 300,
      ratingPercent: 96,
      patientStoriesCount: 312,
      availableText: 'Available Tomorrow',
      photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      gender: 'female',
      prime: true,
      isVerified: false,

    },
    {
      id: 'doc-4',
      name: 'Dr. Rajesh Sharma',
      degree: 'BPT, MPT - Sports Rehabilitation',
      specialist: 'Physiotherapist',
      experienceYears: 15,
      location: 'Gumanpura, Kota',
      clinicName: 'Physiosmate Sports & Spine Clinic',
      fee: 350,
      ratingPercent: 99,
      patientStoriesCount: 450,
      availableText: 'Available Today',
      photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
      gender: 'male',
      prime: true,
      isVerified: false,
    }
  ]);

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

  sendAppLink(): void {
    if (this.mobileNumber().trim().length >= 10) {
      this.appLinkSent.set(true);
      setTimeout(() => {
        this.appLinkSent.set(false);
        this.mobileNumber.set('');
      }, 4000);
    }
  }

  openBooking(doctor: Doctor): void {
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
}
