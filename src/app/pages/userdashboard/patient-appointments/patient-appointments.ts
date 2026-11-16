import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MyBooking } from '../../../models/usermode';
import { ApiService } from '../../../services/api.service';
import { Authservice } from '../../../services/authservice';
import { ApiEndPoints } from '../../../helper/api-endpoints';
import { SharedModule } from '../../../shared/shared-module';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './patient-appointments.html',
  styleUrl: './patient-appointments.css',
})
export class PatientAppointments implements OnInit {
  @Input() bookings: MyBooking[] = [];
  @Input() appointmentFilter: 'upcoming' | 'past' | 'all' = 'upcoming';
  @Output() filterChange = new EventEmitter<'upcoming' | 'past' | 'all'>();

  private apiService = inject(ApiService);
  private authService = inject(Authservice);
  private router = inject(Router);

  isLoading = false;
  appointments = signal<any[]>([]);

  ngOnInit(): void {
    this.GetMyAppointments();
  }

  async GetMyAppointments() {
    this.isLoading = true;
    const userId = this.authService.getuserid();
    const endpoint = userId ? `${ApiEndPoints.MyAppointments}?userId=${userId}` : ApiEndPoints.MyAppointments;
    var result = await this.apiService.Get<any[]>(endpoint);
    if (result.isSuccess == true) {
      this.appointments.set(result.data || []);
    } else {
      this.appointments.set([]);
    }
    this.isLoading = false;
  }

  setFilter(filter: 'upcoming' | 'past' | 'all'): void {
    this.appointmentFilter = filter;
    this.filterChange.emit(filter);
  }

  get filteredBookings(): any[] {
    const list = this.appointments().length > 0 ? this.appointments() : this.bookings;
    if (!list || list.length === 0) return [];
    const today = new Date().toISOString().split('T')[0];
    if (this.appointmentFilter === 'upcoming') {
      return list.filter((b: any) => {
        const dateStr = (b.slotDate || b.appointmentDate || '').toString().split('T')[0];
        return (!dateStr || dateStr >= today) && b.status !== 'Cancelled';
      });
    }
    if (this.appointmentFilter === 'past') {
      return list.filter((b: any) => {
        const dateStr = (b.slotDate || b.appointmentDate || '').toString().split('T')[0];
        return (dateStr && dateStr < today) || b.status === 'Completed';
      });
    }
    return list;
  }
}
