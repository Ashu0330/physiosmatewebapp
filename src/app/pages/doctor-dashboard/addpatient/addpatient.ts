import { Component, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewPatientFormData } from '../../../models/doctor-dashboard.model';

@Component({
  selector: 'app-addpatient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './addpatient.html',
  styleUrl: './addpatient.css',
})
export class Addpatient {
  patientAdded = output<NewPatientFormData>();
  cancel = output<void>();

  formData: NewPatientFormData = {
    fullName: '',
    phone: '',
    email: '',
    dob: '',
    age: null,
    gender: 'Male',
    primaryCondition: '',
    severity: 'Moderate',
    chiefComplaint: '',
    redFlags: '',
    relevantMedicalHistory: '',
    assignedPlanTemplate: 'Spine Decompression & Core Stabilization',
    treatmentGoal: '',
    notes: '',
    precautionNotes: [],
    emergencyContact: ''
  };

  errorMessage = '';

  // ─── Care Plan Templates ──────────────────────────────────────────────────
  planTemplates = [
    'Spine Decompression & Core Stabilization',
    'Knee ACL Accelerated Rehab Protocol',
    'Glenohumeral Joint Mobilization & ROM',
    'Cervical Postural & Deep Neck Flexor Protocol',
    'Ankle Stability & Tendinopathy Care',
    'Custom Physical Therapy Care Plan'
  ];

  // ─── Right Sidebar: Conditions ────────────────────────────────────────────
  conditionSearch = signal<string>('');
  conditionsList = signal<string[]>([
    'Low Back Pain',
    'Cervical Spondylosis',
    'ACL Post-Op',
    'Shoulder Impingement',
    'Frozen Shoulder',
    'Lumbar Disc Herniation',
    'Plantar Fasciitis',
    'Tennis Elbow (Lateral Epicondylitis)'
  ]);

  showAddCondition = false;
  newConditionInput = '';

  filteredConditions = computed(() => {
    const query = this.conditionSearch().toLowerCase().trim();
    if (!query) return this.conditionsList();
    return this.conditionsList().filter(c => c.toLowerCase().includes(query));
  });

  selectCondition(condition: string): void {
    this.formData.primaryCondition = condition;
    // Contextual protocol auto-mapping
    if (condition.toLowerCase().includes('back') || condition.toLowerCase().includes('lumbar') || condition.toLowerCase().includes('spine')) {
      this.formData.assignedPlanTemplate = 'Spine Decompression & Core Stabilization';
    } else if (condition.toLowerCase().includes('acl') || condition.toLowerCase().includes('knee')) {
      this.formData.assignedPlanTemplate = 'Knee ACL Accelerated Rehab Protocol';
    } else if (condition.toLowerCase().includes('shoulder') || condition.toLowerCase().includes('impingement')) {
      this.formData.assignedPlanTemplate = 'Glenohumeral Joint Mobilization & ROM';
    } else if (condition.toLowerCase().includes('cervical') || condition.toLowerCase().includes('neck')) {
      this.formData.assignedPlanTemplate = 'Cervical Postural & Deep Neck Flexor Protocol';
    } else if (condition.toLowerCase().includes('ankle')) {
      this.formData.assignedPlanTemplate = 'Ankle Stability & Tendinopathy Care';
    }
  }

  addCustomCondition(): void {
    const trimmed = this.newConditionInput.trim();
    if (trimmed) {
      if (!this.conditionsList().includes(trimmed)) {
        this.conditionsList.update(list => [trimmed, ...list]);
      }
      this.selectCondition(trimmed);
      this.newConditionInput = '';
      this.showAddCondition = false;
    }
  }

  removeSelectedCondition(): void {
    this.formData.primaryCondition = '';
  }

  // ─── Right Sidebar: Precaution Notes ─────────────────────────────────────
  precautionSearch = signal<string>('');
  precautionsList = signal<string[]>([
    'Avoid loaded deep squats',
    'No high-impact activity',
    'Avoid overhead loading',
    'Monitor pain > 6/10',
    'No end-range lumbar flexion',
    'Limit weight-bearing to 50%',
    'Avoid rapid rotational twisting'
  ]);

  selectedPrecautions = signal<string[]>([]);
  showAddPrecaution = false;
  newPrecautionInput = '';

  filteredPrecautions = computed(() => {
    const query = this.precautionSearch().toLowerCase().trim();
    if (!query) return this.precautionsList();
    return this.precautionsList().filter(p => p.toLowerCase().includes(query));
  });

  isPrecautionSelected(precaution: string): boolean {
    return this.selectedPrecautions().includes(precaution);
  }

  togglePrecaution(precaution: string): void {
    if (this.isPrecautionSelected(precaution)) {
      this.selectedPrecautions.update(list => list.filter(p => p !== precaution));
    } else {
      this.selectedPrecautions.update(list => [...list, precaution]);
    }
    this.syncPrecautionsToForm();
  }

  addCustomPrecaution(): void {
    const trimmed = this.newPrecautionInput.trim();
    if (trimmed) {
      if (!this.precautionsList().includes(trimmed)) {
        this.precautionsList.update(list => [trimmed, ...list]);
      }
      if (!this.isPrecautionSelected(trimmed)) {
        this.selectedPrecautions.update(list => [...list, trimmed]);
        this.syncPrecautionsToForm();
      }
      this.newPrecautionInput = '';
      this.showAddPrecaution = false;
    }
  }

  removeSelectedPrecaution(precaution: string): void {
    this.selectedPrecautions.update(list => list.filter(p => p !== precaution));
    this.syncPrecautionsToForm();
  }

  syncPrecautionsToForm(): void {
    this.formData.precautionNotes = [...this.selectedPrecautions()];
    const precautionsStr = this.selectedPrecautions().join('; ');
    this.formData.notes = precautionsStr;
  }

  // ─── Relevant Medical History Presets ────────────────────────────────────
  medicalHistoryPresets = [
    'Hypertension',
    'Type 2 Diabetes',
    'Previous Spinal Surgery',
    'Osteoarthritis',
    'Cardiac Pacemaker',
    'None reported'
  ];

  appendMedicalHistory(history: string): void {
    if (history === 'None reported') {
      this.formData.relevantMedicalHistory = 'None reported';
      return;
    }
    if (!this.formData.relevantMedicalHistory || this.formData.relevantMedicalHistory === 'None reported') {
      this.formData.relevantMedicalHistory = history;
    } else if (!this.formData.relevantMedicalHistory.includes(history)) {
      this.formData.relevantMedicalHistory += `, ${history}`;
    }
  }

  // ─── DOB to Age Calculation ──────────────────────────────────────────────
  onDobChange(): void {
    if (this.formData.dob) {
      const birthDate = new Date(this.formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age >= 0 && age <= 120) {
        this.formData.age = age;
      }
    }
  }

  // ─── Form Submission ──────────────────────────────────────────────────────
  onSubmit(): void {
    this.errorMessage = '';

    if (!this.formData.fullName.trim()) {
      this.errorMessage = 'Please provide the patient full name.';
      return;
    }
    if (!this.formData.phone.trim()) {
      this.errorMessage = 'Please provide a valid contact phone number.';
      return;
    }
    if (!this.formData.primaryCondition.trim()) {
      this.errorMessage = 'Please specify the primary condition or select one from Clinical Quick Select.';
      return;
    }

    this.patientAdded.emit({
      ...this.formData,
      precautionNotes: [...this.selectedPrecautions()]
    });
  }

  resetForm(): void {
    this.formData = {
      fullName: '',
      phone: '',
      email: '',
      dob: '',
      age: null,
      gender: 'Male',
      primaryCondition: '',
      severity: 'Moderate',
      chiefComplaint: '',
      redFlags: '',
      relevantMedicalHistory: '',
      assignedPlanTemplate: 'Spine Decompression & Core Stabilization',
      treatmentGoal: '',
      notes: '',
      precautionNotes: [],
      emergencyContact: ''
    };
    this.selectedPrecautions.set([]);
    this.errorMessage = '';
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
