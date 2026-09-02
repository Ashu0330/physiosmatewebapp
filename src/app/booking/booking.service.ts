import { Injectable, signal } from '@angular/core';
import { BookingState, PractitionerDetailedData } from '../models/practitioner.model';



@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly state = signal<BookingState | null>(null);

  get bookingState() {
    return this.state.asReadonly();
  }

  setProvider(provider: Partial<PractitionerDetailedData> | any): void {
    const current = this.state() || {
      providerId: provider.id || provider.practitionerId || 0,
      providerName: provider.fullName || provider.name || 'Physiotherapist',
      providerSpecialty: provider.specialization || provider.specializations || 'Physiotherapist',
      providerImage: provider.profileImage || provider.photoUrl || null,
      clinicName: provider.clinicName || null,
      clinicAddress: provider.clinicAddress || null,
      consultationFee: provider.consultationFee || 500,
    };

    this.state.set({
      ...current,
      providerId: provider.id || provider.practitionerId || current.providerId,
      providerName: provider.fullName || provider.name || current.providerName,
      providerSpecialty: provider.specialization || provider.specializations || current.providerSpecialty,
      providerImage: provider.profileImage || provider.photoUrl || current.providerImage,
      clinicName: provider.clinicName || current.clinicName,
      clinicAddress: provider.clinicAddress || current.clinicAddress,
      consultationFee: provider.consultationFee || current.consultationFee,
    });
  }

  updateDetails(details: Partial<BookingState>): void {
    const current = this.state() || {
      providerId: 0,
      providerName: '',
      providerSpecialty: '',
      consultationFee: 500
    };
    this.state.set({ ...current, ...details });
  }

  savePendingSlot(data: Partial<BookingState>): void {
    this.updateDetails(data);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pendingBooking', JSON.stringify(this.state()));
    }
  }

  getPendingSlot(): BookingState | null {
    if (this.state()?.selectedDay) {
      return this.state();
    }
    if (typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem('pendingBooking');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.state.set(parsed);
          return parsed;
        } catch { }
      }
    }
    return this.state();
  }

  clearPendingSlot(): void {
    this.state.set(null);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('pendingBooking');
    }
  }

  generateBookingId(): string {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `PHY-${random}`;
  }

  reset(): void {
    this.clearPendingSlot();
  }
}
