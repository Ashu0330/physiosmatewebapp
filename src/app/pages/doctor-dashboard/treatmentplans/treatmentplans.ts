import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorTreatmentPlan } from '../../../models/doctor-dashboard.model';

@Component({
  selector: 'app-treatmentplans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './treatmentplans.html',
  styleUrl: './treatmentplans.css',
})
export class Treatmentplans {
  treatmentPlans = input<DoctorTreatmentPlan[]>([]);
  navigateToAdd = output<void>();

  selectedFilter = signal<'all' | 'in-progress' | 'pending' | 'completed'>('all');

  filteredPlans = computed<DoctorTreatmentPlan[]>(() => {
    const list = this.treatmentPlans() || [];
    const filter = this.selectedFilter();

    if (filter === 'all') return list;
    return list.filter(p => p.statusType === filter);
  });

  setFilter(filter: 'all' | 'in-progress' | 'pending' | 'completed'): void {
    this.selectedFilter.set(filter);
  }

  toggleExpand(plan: DoctorTreatmentPlan): void {
    plan.isExpanded = !plan.isExpanded;
  }

  onAddClick(): void {
    this.navigateToAdd.emit();
  }
}
