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

  private sweetAlert = inject(SweetAlertService);

  togglePlanAccordion(plan: SubscriptionPlanItem): void {
    plan.isExpanded = !plan.isExpanded;
  }

  payForPlan(plan: SubscriptionPlanItem, event?: Event): void {
    if (event) event.stopPropagation();
    this.sweetAlert.toastSuccess(`Initiating payment for ${plan.title} (₹${plan.outstanding.toLocaleString()})...`);
  }
}
