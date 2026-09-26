import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseComponent } from '../../helper/base-component';
import { ApiEndPoints } from '../../helper/api-endpoints';

export interface AvailabilitySlot {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

@Component({
  selector: 'app-practice-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practice-management.html',
  styleUrl: './practice-management.css',
})
export class PracticeManagement extends BaseComponent implements OnInit {
  activeTab: string = 'Availability';

  tabs: string[] = [
    'Availability',
    'Appointment Slots',
    'Treatment Services',
    'Treatment Fees',
    'Expertise',
    'Subscription Plans',
    'Add-on Services',
    'Plan Benefits'
  ];

  daysList = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    { id: 7, name: 'Sunday' },
  ];

  timeOptions = [
    { label: '08:00 AM', value: '08:00:00' },
    { label: '08:30 AM', value: '08:30:00' },
    { label: '09:00 AM', value: '09:00:00' },
    { label: '09:30 AM', value: '09:30:00' },
    { label: '10:00 AM', value: '10:00:00' },
    { label: '10:30 AM', value: '10:30:00' },
    { label: '11:00 AM', value: '11:00:00' },
    { label: '11:30 AM', value: '11:30:00' },
    { label: '12:00 PM', value: '12:00:00' },
    { label: '12:30 PM', value: '12:30:00' },
    { label: '01:00 PM', value: '13:00:00' },
    { label: '01:30 PM', value: '13:30:00' },
    { label: '02:00 PM', value: '14:00:00' },
    { label: '02:30 PM', value: '14:30:00' },
    { label: '03:00 PM', value: '15:00:00' },
    { label: '03:30 PM', value: '15:30:00' },
    { label: '04:00 PM', value: '16:00:00' },
    { label: '04:30 PM', value: '16:30:00' },
    { label: '05:00 PM', value: '17:00:00' },
    { label: '05:30 PM', value: '17:30:00' },
    { label: '06:00 PM', value: '18:00:00' },
    { label: '06:30 PM', value: '18:30:00' },
    { label: '07:00 PM', value: '19:00:00' },
    { label: '07:30 PM', value: '19:30:00' },
    { label: '08:00 PM', value: '20:00:00' },
  ];

  showAddForm: boolean = true;
  editingSlotId: number = 0;
  selectedDay: number = 1;
  startTime: string = '09:30:00';
  endTime: string = '10:00:00';
  isActive: boolean = true;

  isLoading: boolean = false;
  isSaving: boolean = false;
  availabilitySlots: AvailabilitySlot[] = [];

  get practitionerId(): number {
    const user = this.currentUser;
    const profId = this.authService.getCurrentProfessionalId();
    return Number(user?.practitionerId || profId || user?.id || 1);
  }

  ngOnInit(): void {
    this.loadAvailability();
  }

  async loadAvailability(): Promise<void> {
    this.isLoading = true;
    try {
      const pid = this.practitionerId;
      const res = await this.apiService.Get<any>(
        `${ApiEndPoints.GetAvailability}?practitionerId=${pid}`
      );
      if (res && res.isSuccess) {
        const raw = res.data;
        if (Array.isArray(raw)) {
          this.availabilitySlots = raw;
        } else if (raw && Array.isArray(raw.slots)) {
          this.availabilitySlots = raw.slots;
        } else {
          this.availabilitySlots = [];
        }
      } else {
        this.availabilitySlots = [];
      }
    } catch (e) {
      console.error('Error loading availability', e);
      this.availabilitySlots = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.editingSlotId = 0;
    this.selectedDay = 1;
    this.startTime = '09:30:00';
    this.endTime = '10:00:00';
    this.isActive = true;
  }

  async onSaveSlot(): Promise<void> {
    if (!this.selectedDay || !this.startTime || !this.endTime) {
      this.showError('Please select day, start time and end time.');
      return;
    }

    if (this.startTime >= this.endTime) {
      this.showError('End time must be after start time.');
      return;
    }

    this.isSaving = true;
    try {
      const payload = {
        practitionerId: this.practitionerId,
        slots: [
          {
            id: Number(this.editingSlotId || 0),
            dayOfWeek: Number(this.selectedDay),
            startTime: this.startTime,
            endTime: this.endTime,
            isActive: this.isActive
          }
        ]
      };

      const res = await this.apiService.Post<any>(ApiEndPoints.AddAvailability, payload);
      if (res && (res.isSuccess || res.data )) {
        this.showSuccess('Availability slot saved successfully!');
        await this.loadAvailability();
        this.resetForm();
      } else {
        this.showError(res?.message || 'Failed to save availability slot.');
      }
    } catch (e: any) {
      console.error('Save slot error', e);
      this.showError('Error saving slot. Please try again.');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  onEditSlot(slot: AvailabilitySlot): void {
    this.editingSlotId = slot.id || 0;
    this.selectedDay = slot.dayOfWeek;
    this.startTime = this.normalizeTime(slot.startTime);
    this.endTime = this.normalizeTime(slot.endTime);
    this.isActive = slot.isActive !== false;
    this.showAddForm = true;
  }

  getDayName(dayNumber: number): string {
    const day = this.daysList.find(d => d.id === Number(dayNumber));
    if (day) return day.name;
    if (dayNumber === 0 || dayNumber === 7) return 'Sunday';
    return 'Monday';
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] || '00';
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hrsStr = hours < 10 ? '0' + hours : '' + hours;
    return `${hrsStr}:${minutes} ${ampm}`;
  }

  calculateDuration(startTime: string, endTime: string): string {
    if (!startTime || !endTime) return '30 min';
    const s = startTime.split(':').map(Number);
    const e = endTime.split(':').map(Number);
    let startMin = (s[0] || 0) * 60 + (s[1] || 0);
    let endMin = (e[0] || 0) * 60 + (e[1] || 0);
    let diff = endMin - startMin;
    if (diff <= 0) return '30 min';
    if (diff < 60) return `${diff} min`;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
  }

  private normalizeTime(t: string): string {
    if (!t) return '09:30:00';
    const parts = t.split(':');
    const hh = (parts[0] || '00').padStart(2, '0');
    const mm = (parts[1] || '00').padStart(2, '0');
    const ss = (parts[2] || '00').padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
}
