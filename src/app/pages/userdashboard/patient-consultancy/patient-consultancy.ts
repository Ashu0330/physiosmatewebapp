import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConsultancyItem, MyBooking } from '../../../models/usermode';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { Userservice } from '../../../services/userservice';
import { Authservice } from '../../../services/authservice';
import { SharedModule } from '../../../shared/shared-module';
import { ApiService } from '../../../services/api.service';
import { ApiEndPoints } from '../../../helper/api-endpoints';

@Component({
  selector: 'app-patient-consultancy',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './patient-consultancy.html',
  styleUrl: './patient-consultancy.css',
})
export class PatientConsultancy implements OnInit {

  private router = inject(Router);
  private sweetAlert = inject(SweetAlertService);
  private userService = inject(Userservice);
  private authService = inject(Authservice);
  private apiService = inject(ApiService);

  isLoading = false;

  // Modal state
  selectedConsultancy: ConsultancyItem | null = null;
  showConsultancyModal = false;

  consultancy = signal<ConsultancyItem[]>([]);

  ngOnInit(): void {
    this.GetAllConsultancy();
  }
  async GetAllConsultancy() {
    var result = await this.apiService.Get<ConsultancyItem[]>(ApiEndPoints.MyBookings);
    if (result.isSuccess == true) {
      this.consultancy.set(result.data);
    }
    else {
      this.consultancy.set([]);

    }
  }

  toggleConsultancyAccordion(item: ConsultancyItem): void {
    item.isExpanded = !item.isExpanded;
  }

  cancelConsultancy(item: ConsultancyItem, event?: Event): void {
    if (event) event.stopPropagation();
    if (item.status === 'Cancelled') return;
    const doctor = item.assignedPractitionerName || item.doctorName || 'Doctor';
    this.sweetAlert.confirm(
      'Cancel Consultation?',
      `Are you sure you want to cancel your consultation with ${doctor}?`,
      'Yes, Cancel',
      'Keep Booking'
    ).then((result: any) => {
      if (result.isConfirmed) {
        item.status = 'Cancelled';
        this.sweetAlert.toastSuccess('Consultation cancelled successfully');
      }
    });
  }

  rescheduleConsultancy(item: ConsultancyItem, event?: Event): void {
    if (event) event.stopPropagation();
    if (item.status === 'Cancelled') return;
    this.router.navigate(['/find-doctors']);
  }

  openConsultancyDetails(item: ConsultancyItem): void {
    this.selectedConsultancy = item;
    this.showConsultancyModal = true;
  }

  closeConsultancyDetails(): void {
    this.showConsultancyModal = false;
    this.selectedConsultancy = null;
  }
}
