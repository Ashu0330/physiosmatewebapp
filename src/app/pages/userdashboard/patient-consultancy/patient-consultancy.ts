import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConsultancyItem } from '../../../models/usermode';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-patient-consultancy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-consultancy.html',
  styleUrl: './patient-consultancy.css',
})
export class PatientConsultancy {
  @Input() consultancies: ConsultancyItem[] = [];

  private router = inject(Router);
  private sweetAlert = inject(SweetAlertService);

  // Modal state
  selectedConsultancy: ConsultancyItem | null = null;
  showConsultancyModal = false;

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
