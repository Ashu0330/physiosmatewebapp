import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { PaymentItems } from '../../../models/usermode';
import { SweetAlertService } from '../../../services/sweet-alert.service';

@Component({
  selector: 'app-patient-transaction',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-transaction.html',
  styleUrl: './patient-transaction.css',
})
export class PatientTransaction {
  @Input() currentUser: any = null;

  private sweetAlert = inject(SweetAlertService);

  showInvoiceModal = false;
  selectedPayment: PaymentItems | null = null;

  payments: PaymentItems[] = [
    { id: 'PAY-8921', invoiceNumber: 'INV-2026-0089', title: 'Initial Spine & Posture Assessment', providerName: 'Dr. Sarah Jenkins, PT', date: '28 Aug 2026', amount: 1200, paymentMethod: 'UPI / GPay', status: 'Successful' },
    { id: 'PAY-8714', invoiceNumber: 'INV-2026-0072', title: '12-Session Post-Surgery Rehab Package', providerName: 'Apex Physio & Wellness Clinic', date: '15 Aug 2026', amount: 6500, paymentMethod: 'Credit Card (HDFC)', status: 'Successful' },
    { id: 'PAY-8501', invoiceNumber: 'INV-2026-0041', title: 'Online Video Ergonomics Follow-up', providerName: 'Dr. Rajesh Mehta, MPT', date: '02 Aug 2026', amount: 600, paymentMethod: 'NetBanking (ICICI)', status: 'Successful' },
    { id: 'PAY-8319', invoiceNumber: 'INV-2026-0019', title: 'Knee Joint Mobilization Session', providerName: 'Relief Point Therapy Center', date: '19 Jul 2026', amount: 950, paymentMethod: 'UPI / PhonePe', status: 'Refunded' },
  ];

  openInvoice(payment: PaymentItems): void {
    this.selectedPayment = payment;
    this.showInvoiceModal = true;
  }

  closeInvoice(): void {
    this.showInvoiceModal = false;
    this.selectedPayment = null;
  }
}
