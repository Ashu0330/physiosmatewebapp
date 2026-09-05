import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorPatient } from '../../../models/doctor-dashboard.model';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
})
export class Patients {
  patients = input<DoctorPatient[]>([]);
  navigateToAdd = output<void>();
  navigateToPlans = output<void>();

  searchQuery = signal<string>('');
  selectedStatus = signal<'All' | 'Active' | 'Pending' | 'Completed'>('All');
  selectedPatient = signal<DoctorPatient | null>(null);

  filteredPatients = computed<DoctorPatient[]>(() => {
    const list = this.patients() || [];
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();

    return list.filter(p => {
      const matchesStatus = status === 'All' || p.status === status;
      const matchesQuery = !query ||
        p.fullName.toLowerCase().includes(query) ||
        p.patientCode.toLowerCase().includes(query) ||
        p.primaryCondition.toLowerCase().includes(query) ||
        p.phone.includes(query);

      return matchesStatus && matchesQuery;
    });
  });

  setFilter(status: 'All' | 'Active' | 'Pending' | 'Completed'): void {
    this.selectedStatus.set(status);
  }

  openPatientDetails(patient: DoctorPatient): void {
    this.selectedPatient.set(patient);
  }

  closePatientDetails(): void {
    this.selectedPatient.set(null);
  }

  onAddPatientClick(): void {
    this.navigateToAdd.emit();
  }

  onPlansClick(): void {
    this.navigateToPlans.emit();
  }

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
}
