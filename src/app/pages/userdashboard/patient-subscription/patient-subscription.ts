import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { ApiEndPoints } from '../../../helper/api-endpoints';
import { SharedModule } from '../../../shared/shared-module';

@Component({
  selector: 'app-patient-subscription',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule],
  templateUrl: './patient-subscription.html',
  styleUrl: './patient-subscription.css',
})
export class PatientSubscription implements OnInit {
  private apiService = inject(ApiService);

  isLoading = false;
  subscriptions = signal<any[]>([]);

  ngOnInit(): void {
    this.GetSubscriptions();
  }

  async GetSubscriptions() {
    this.isLoading = true;
    const result = await this.apiService.Get<any[]>(`${ApiEndPoints.GetSubscriptions}?isHistory=false`);
    if (result.isSuccess == true && result.data) {
      const list = result.data.map((item: any, index: number) => ({
        ...item,
        isExpanded: index === 0
      }));
      this.subscriptions.set(list);
    } else {
      this.subscriptions.set([]);
    }
    this.isLoading = false;
  }

  togglePlanAccordion(plan: any): void {
    plan.isExpanded = !plan.isExpanded;
  }
}
