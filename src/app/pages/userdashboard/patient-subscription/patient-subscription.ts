import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { inject } from '@angular/core';
import { SubscriptionPlanItem } from '../../../models/usermode';
import { SweetAlertService } from '../../../services/sweet-alert.service';

@Component({
  selector: 'app-patient-subscription',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-subscription.html',
  styleUrl: './patient-subscription.css',
})
export class PatientSubscription {
  @Input() subscriptionPlans: SubscriptionPlanItem[] = [];

  subscriptionSubTab: 'active' | 'available' = 'active';

  // Manage Weekly Plan - Dummy time and slots data with multiple selection
  isWeeklyPlanOpen: boolean = true;
  selectedSlotIds: string[] = [];

  toggleSlot(id: string): void {
    const idx = this.selectedSlotIds.indexOf(id);
    if (idx > -1) {
      this.selectedSlotIds.splice(idx, 1);
    } else {
      this.selectedSlotIds.push(id);
    }
  }

  isSlotSelected(id: string): boolean {
    return this.selectedSlotIds.includes(id);
  }

  clearSelectedSlots(): void {
    this.selectedSlotIds = [];
  }

  weeklySchedule = [
    {
      dateStr: '2026-04-04',
      dayName: 'Saturday',
      slots: [
        { id: '1', count: '4 slots', time: '9:30 - 10:30' },
        { id: '2', count: '3 slots', time: '11:30 - 12:30' },
        { id: '3', count: '2 slots', time: '02:00 - 03:00' },
        { id: '4', count: '5 slots', time: '04:30 - 05:30' }
      ]
    },
    {
      dateStr: '2026-04-05',
      dayName: 'Sunday',
      slots: [
        { id: '5', count: '5 slots', time: '9:30 - 10:30' },
        { id: '6', count: '2 slots', time: '11:30 - 12:30' },
        { id: '7', count: '4 slots', time: '03:00 - 04:00' },
        { id: '8', count: '3 slots', time: '05:00 - 06:00' }
      ]
    },
    {
      dateStr: '2026-04-06',
      dayName: 'Monday',
      slots: [
        { id: '9', count: '4 slots', time: '9:30 - 10:30' },
        { id: '10', count: '3 slots', time: '11:30 - 12:30' },
        { id: '11', count: '4 slots', time: '02:30 - 03:30' },
        { id: '12', count: '1 slots', time: '04:00 - 05:00' }
      ]
    },
    {
      dateStr: '2026-04-07',
      dayName: 'Tuesday',
      slots: [
        { id: '13', count: '3 slots', time: '9:30 - 10:30' },
        { id: '14', count: '5 slots', time: '11:30 - 12:30' },
        { id: '15', count: '2 slots', time: '03:30 - 04:30' }
      ]
    },
    {
      dateStr: '2026-04-08',
      dayName: 'Wednesday',
      slots: [
        { id: '16', count: '4 slots', time: '9:30 - 10:30' },
        { id: '17', count: '4 slots', time: '11:30 - 12:30' },
        { id: '18', count: '3 slots', time: '05:00 - 06:00' }
      ]
    }
  ];

  private sweetAlert = inject(SweetAlertService);

  togglePlanAccordion(plan: SubscriptionPlanItem): void {
    plan.isExpanded = !plan.isExpanded;
  }

  payForPlan(plan: SubscriptionPlanItem, event?: Event): void {
    if (event) event.stopPropagation();
    this.sweetAlert.toastSuccess(`Initiating payment for ${plan.title} (₹${plan.outstanding.toLocaleString()})...`);
  }
}
