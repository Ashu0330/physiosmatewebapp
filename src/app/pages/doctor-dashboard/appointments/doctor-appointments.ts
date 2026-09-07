import { Component, Input, Output, EventEmitter, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorPatient, DoctorAppointment, DoctorInquiryOrAppointment } from '../../../models/doctor-dashboard.model';
import { SweetAlertService } from '../../../services/sweet-alert.service';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-appointments.html',
  styleUrl: './doctor-appointments.css',
})
export class DoctorAppointments implements OnInit {
  private alertService = inject(SweetAlertService);

  @Input() patients: DoctorPatient[] = [];
  @Input() appointments: DoctorAppointment[] = [];
  @Output() appointmentAdded = new EventEmitter<DoctorInquiryOrAppointment>();

  // ─── Search & Selection State ───────────────────────────────────────────────
  patientSearchQuery = signal<string>('');
  selectedPatientId = signal<string | null>(null);

  // ─── Entry Mode Toggle: Appointment vs Inquiry ─────────────────────────────
  entryType: 'appointment' | 'inquiry' = 'appointment';

  // ─── Time Slot Presets ─────────────────────────────────────────────────────
  availableSlots = [
    '09:30 AM - 10:15 AM',
    '10:30 AM - 11:15 AM',
    '11:15 AM - 12:00 PM',
    '02:00 PM - 02:45 PM',
    '03:15 PM - 04:00 PM',
    '04:30 PM - 05:15 PM',
    '05:30 PM - 06:15 PM'
  ];

  inquirySources = [
    'Phone Call',
    'Walk-in Reception',
    'WhatsApp / Website',
    'Doctor Referral',
    'Past Patient Family'
  ];

  // ─── Active Form Model ─────────────────────────────────────────────────────
  formData = {
    patientCode: '',
    fullName: '',
    phone: '',
    email: '',
    age: null as number | null,
    gender: 'Male' as 'Male' | 'Female' | 'Other',

    // Appointment Specifics
    appointmentDate: '',
    timeSlot: '09:30 AM - 10:15 AM',
    visitType: 'In-Clinic' as 'In-Clinic' | 'Video Call' | 'Home Visit',
    sessionType: 'Regular Rehab Session' as 'Initial Assessment' | 'Regular Rehab Session' | 'Follow-up Review',
    condition: '',
    fee: 500,
    appointmentNotes: '',
    appointmentStatus: 'Scheduled' as 'Scheduled' | 'In-Progress' | 'Completed',

    // Inquiry Specifics
    inquirySource: 'Phone Call',
    inquiryInterest: '',
    followUpDate: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    inquiryNotes: '',
    inquiryStatus: 'Open Lead' as 'Open Lead' | 'Follow-up Needed' | 'Converted' | 'Cancelled'
  };

  // ─── Active Bottom Tab Filter ──────────────────────────────────────────────
  activeListTab: 'appointments' | 'inquiries' | 'completed' = 'appointments';

  // ─── Active Inquiries Ledger ───────────────────────────────────────────────
  inquiriesList: DoctorInquiryOrAppointment[] = [
    {
      id: 'INQ-201',
      bookingCode: 'INQ-201',
      entryType: 'inquiry',
      patientName: 'Kavita Menon',
      phone: '+91 98110 55432',
      email: 'kavita.menon@example.com',
      age: 48,
      gender: 'Female',
      date: 'Today, 05 Sep 2026',
      conditionOrInterest: 'Frozen Shoulder Therapy Package & Pricing',
      inquirySource: 'Phone Call',
      followUpDate: '07 Sep 2026',
      notes: 'Inquired about home visit feasibility for left shoulder pain. Wants callback with senior discount details.',
      status: 'Open Lead'
    },
    {
      id: 'INQ-202',
      bookingCode: 'INQ-202',
      entryType: 'inquiry',
      patientName: 'Deepak Saxena',
      phone: '+91 99880 12340',
      email: 'deepak.s@example.com',
      age: 62,
      gender: 'Male',
      date: '04 Sep 2026',
      conditionOrInterest: 'Total Knee Replacement Pre-Op Rehab Plan',
      inquirySource: 'Walk-in',
      followUpDate: '08 Sep 2026',
      notes: 'Undergoing surgery next month. Requested literature on accelerated post-op recovery protocol.',
      status: 'Follow-up Needed'
    },
    {
      id: 'INQ-203',
      bookingCode: 'INQ-203',
      entryType: 'inquiry',
      patientName: 'Pooja Agarwal',
      phone: '+91 97550 99881',
      email: 'pooja.agarwal@example.com',
      age: 31,
      gender: 'Female',
      date: '02 Sep 2026',
      conditionOrInterest: 'Postnatal Pelvic Floor & Core Strengthening',
      inquirySource: 'WhatsApp',
      followUpDate: '09 Sep 2026',
      notes: 'Looking for 2x weekly morning sessions after 10 AM. Interested in introductory trial session.',
      status: 'Open Lead'
    }
  ];

  // ─── Combined Appointments Ledger ──────────────────────────────────────────
  allAppointments: DoctorInquiryOrAppointment[] = [];

  ngOnInit(): void {
    const today = new Date();
    this.formData.appointmentDate = today.toISOString().split('T')[0];

    const followUp = new Date();
    followUp.setDate(today.getDate() + 3);
    this.formData.followUpDate = followUp.toISOString().split('T')[0];

    this.initializeAppointmentsLedger();

    // Auto-select first patient if available
    if (this.patients.length > 0) {
      this.selectPatient(this.patients[0]);
    }
  }

  initializeAppointmentsLedger(): void {
    this.allAppointments = [
      {
        id: 'APT-901',
        bookingCode: 'BKG-7721',
        entryType: 'appointment',
        patientId: 'PT-1041',
        patientCode: 'PT-1041',
        patientName: 'Ananya Iyer',
        phone: '+91 98234 56789',
        age: 34,
        gender: 'Female',
        date: 'Today, 05 Sep 2026',
        timeSlot: '09:30 AM - 10:15 AM',
        visitType: 'In-Clinic',
        conditionOrInterest: 'Lumbar Disc Herniation',
        notes: 'Session 6 of 12. Focus on neutral spine core activation.',
        status: 'Completed',
        fee: 500
      },
      {
        id: 'APT-902',
        bookingCode: 'BKG-7722',
        entryType: 'appointment',
        patientId: 'PT-1042',
        patientCode: 'PT-1042',
        patientName: 'Vikramaditya Rao',
        phone: '+91 98450 12345',
        age: 28,
        gender: 'Male',
        date: 'Today, 05 Sep 2026',
        timeSlot: '11:15 AM - 12:00 PM',
        visitType: 'In-Clinic',
        conditionOrInterest: 'Right Knee ACL Post-Op',
        notes: 'Session 10 of 16. Concentrating on eccentric quadriceps strength.',
        status: 'In-Progress',
        fee: 500
      },
      {
        id: 'APT-903',
        bookingCode: 'BKG-7723',
        entryType: 'appointment',
        patientId: 'PT-1043',
        patientCode: 'PT-1043',
        patientName: 'Meera Nambiar',
        phone: '+91 97112 34567',
        age: 52,
        gender: 'Female',
        date: 'Today, 05 Sep 2026',
        timeSlot: '02:00 PM - 02:45 PM',
        visitType: 'Video Call',
        conditionOrInterest: 'Frozen Shoulder (Adhesive Capsulitis)',
        notes: 'Session 4 of 10. Grade II mobilization review.',
        status: 'Scheduled',
        fee: 500
      },
      {
        id: 'APT-904',
        bookingCode: 'BKG-7724',
        entryType: 'appointment',
        patientId: 'PT-1044',
        patientCode: 'PT-1044',
        patientName: 'Rohan Deshmukh',
        phone: '+91 99201 87654',
        age: 41,
        gender: 'Male',
        date: 'Today, 05 Sep 2026',
        timeSlot: '04:30 PM - 05:15 PM',
        visitType: 'In-Clinic',
        conditionOrInterest: 'Cervical Spondylosis',
        notes: 'Session 2 of 8. Postural workstation review.',
        status: 'Scheduled',
        fee: 500
      }
    ];
  }

  // ─── Filtered Patients for Left Search Box ────────────────────────────────
  filteredPatients = computed(() => {
    const query = this.patientSearchQuery().toLowerCase().trim();
    if (!query) return this.patients;

    return this.patients.filter(p =>
      p.fullName.toLowerCase().includes(query) ||
      (p.phone && p.phone.toLowerCase().includes(query)) ||
      (p.mobile && p.mobile.toLowerCase().includes(query)) ||
      (p.patientCode && p.patientCode.toLowerCase().includes(query)) ||
      (p.primaryCondition && p.primaryCondition.toLowerCase().includes(query))
    );
  });

  // ─── Auto-Fill Form on Patient Selection ───────────────────────────────────
  selectPatient(patient: DoctorPatient): void {
    this.selectedPatientId.set(patient.id);

    this.formData.patientCode = patient.patientCode || patient.id;
    this.formData.fullName = patient.fullName;
    this.formData.phone = patient.mobile || patient.phone || '';
    this.formData.email = patient.email || '';
    this.formData.age = patient.age;
    this.formData.gender = (patient.gender as 'Male' | 'Female' | 'Other') || 'Male';
    this.formData.condition = patient.primaryCondition || '';
    this.formData.inquiryInterest = patient.primaryCondition || '';
    this.formData.appointmentNotes = patient.notes || '';
    this.formData.fee = 500;
  }

  // ─── Clear Form for New Patient / Inquiry ─────────────────────────────────
  clearForNewEntry(): void {
    this.selectedPatientId.set(null);
    const newCode = `PT-${1040 + this.patients.length + 1}`;

    this.formData = {
      patientCode: newCode,
      fullName: '',
      phone: '',
      email: '',
      age: null,
      gender: 'Male',

      appointmentDate: new Date().toISOString().split('T')[0],
      timeSlot: '09:30 AM - 10:15 AM',
      visitType: 'In-Clinic',
      sessionType: 'Regular Rehab Session',
      condition: '',
      fee: 500,
      appointmentNotes: '',
      appointmentStatus: 'Scheduled',

      inquirySource: 'Phone Call',
      inquiryInterest: '',
      followUpDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      priority: 'Medium',
      inquiryNotes: '',
      inquiryStatus: 'Open Lead'
    };
  }

  setEntryType(type: 'appointment' | 'inquiry'): void {
    this.entryType = type;
  }

  setTimeSlot(slot: string): void {
    this.formData.timeSlot = slot;
  }

  // ─── Save Appointment or Inquiry ──────────────────────────────────────────
  onSave(): void {
    if (!this.formData.fullName.trim()) {
      this.alertService.error('Missing Information', 'Please provide the patient or prospect name.');
      return;
    }
    if (!this.formData.phone.trim()) {
      this.alertService.error('Missing Information', 'Please provide a contact phone number.');
      return;
    }

    if (this.entryType === 'appointment') {
      const code = `BKG-${7720 + this.allAppointments.length + 1}`;
      const newAppointment: DoctorInquiryOrAppointment = {
        id: `APT-${900 + this.allAppointments.length + 1}`,
        bookingCode: code,
        entryType: 'appointment',
        patientId: this.formData.patientCode || 'PT-NEW',
        patientCode: this.formData.patientCode || 'PT-NEW',
        patientName: this.formData.fullName,
        phone: this.formData.phone,
        email: this.formData.email,
        age: this.formData.age || 30,
        gender: this.formData.gender,
        date: this.formData.appointmentDate,
        timeSlot: this.formData.timeSlot,
        visitType: this.formData.visitType,
        conditionOrInterest: this.formData.condition || 'Physical Therapy Session',
        notes: this.formData.appointmentNotes,
        status: this.formData.appointmentStatus,
        fee: this.formData.fee
      };

      this.allAppointments = [newAppointment, ...this.allAppointments];
      this.activeListTab = 'appointments';
      this.appointmentAdded.emit(newAppointment);

      this.alertService.toastSuccess(`Appointment scheduled for ${newAppointment.patientName} (${newAppointment.timeSlot})!`);
    } else {
      // General Inquiry / Future Prospect (Does NOT enter consultation ledger!)
      const code = `INQ-${200 + this.inquiriesList.length + 1}`;
      const now = new Date();
      const formattedDate = `Today, ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;

      const newInquiry: DoctorInquiryOrAppointment = {
        id: code,
        bookingCode: code,
        entryType: 'inquiry',
        patientName: this.formData.fullName,
        phone: this.formData.phone,
        email: this.formData.email,
        age: this.formData.age,
        gender: this.formData.gender,
        date: formattedDate,
        conditionOrInterest: this.formData.inquiryInterest || 'General Inquiry',
        inquirySource: this.formData.inquirySource as any,
        followUpDate: this.formData.followUpDate,
        notes: this.formData.inquiryNotes || 'Follow-up scheduled.',
        status: this.formData.inquiryStatus
      };

      this.inquiriesList = [newInquiry, ...this.inquiriesList];
      this.activeListTab = 'inquiries';

      this.alertService.toastSuccess(`Prospect inquiry ${code} saved for future follow-up without creating a billed consultation!`);
    }
  }

  // ─── Quick Conversion: Convert an Inquiry into a Booked Appointment ───────
  convertInquiryToAppointment(inquiry: DoctorInquiryOrAppointment): void {
    this.entryType = 'appointment';
    this.formData.fullName = inquiry.patientName;
    this.formData.phone = inquiry.phone;
    this.formData.email = inquiry.email || '';
    this.formData.age = inquiry.age || null;
    this.formData.gender = (inquiry.gender as any) || 'Male';
    this.formData.condition = inquiry.conditionOrInterest;
    this.formData.appointmentNotes = `Converted from inquiry ${inquiry.bookingCode}. Notes: ${inquiry.notes || ''}`;

    inquiry.status = 'Converted';

    this.alertService.info('Inquiry Converted', `Details for ${inquiry.patientName} loaded into appointment form.`);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  updateAppointmentStatus(apt: DoctorInquiryOrAppointment, status: 'Scheduled' | 'In-Progress' | 'Completed'): void {
    apt.status = status;
    this.alertService.toastSuccess(`Appointment ${apt.bookingCode} updated to ${status}.`);
  }

  getInitials(name: string): string {
    if (!name) return 'PT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
}
