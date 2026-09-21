import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MyBooking } from '../../../models/usermode';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-appointments.html',
  styleUrl: './patient-appointments.css',
})
export class PatientAppointments {
  @Input() bookings: MyBooking[] = [];
  @Input() appointmentFilter: 'upcoming' | 'past' | 'all' = 'upcoming';
  @Output() filterChange = new EventEmitter<'upcoming' | 'past' | 'all'>();

  setFilter(filter: 'upcoming' | 'past' | 'all'): void {
    this.filterChange.emit(filter);
  }

  get filteredBookings(): MyBooking[] {
    if (!this.bookings || this.bookings.length === 0) return [];
    const today = new Date().toISOString().split('T')[0];
    if (this.appointmentFilter === 'upcoming') {
      return this.bookings.filter(b => b.slotDate >= today && b.status !== 'Cancelled');
    }
    if (this.appointmentFilter === 'past') {
      return this.bookings.filter(b => b.slotDate < today || b.status === 'Completed');
    }
    return this.bookings;
  }
}
