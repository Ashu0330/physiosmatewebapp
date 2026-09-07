export interface DoctorPatient {
  id: string;
  patientCode: string; // e.g. "PT-1041"
  fullName: string;
  age: number;
  gender: string | '';
  phone: string;
  mobile?: string;
  email: string;
  primaryCondition?: string;
  status: 'Active' | 'Completed' | 'Pending';
  currentPlan?: string;
  sessionsCompleted: number;
  totalSessions: number;
  lastVisit: string;
  nextAppointment?: string;
  emergencyContact?: string;
  dob?: string;
  address?: string;
  city?: string;
  state?: string;
  photoUrl?: string;
  userId?: number;
  roleId?: number;
  redFlags?: string;
  relevantMedicalHistory?: string;
  allergies?: string;
  existingConditions?: string;
  initialComplaint?: string;
  initialNotes?: string;
  precautionNotes?: string[];
  notes?: string;
}

export interface DoctorTreatmentPhase {
  phaseNumber: number;
  phaseName: string;
  description: string;
  status: 'Completed' | 'Current' | 'Upcoming';
  targetDuration: string;
}

export interface DoctorTreatmentPlan {
  id: string;
  planCode: string; // e.g. "PLN-301"
  title: string;
  patientId: string;
  patientName: string;
  diagnosis: string;
  totalSessions: number;
  completedSessions: number;
  frequency: string; // e.g. "3x weekly"
  durationWeeks: number;
  status: 'In Progress' | 'Pending Approval' | 'Completed';
  statusType: 'in-progress' | 'pending' | 'completed';
  startDate: string;
  targetEndDate: string;
  progressPercent: number;
  phases: DoctorTreatmentPhase[];
  clinicalNotes: string;
  isExpanded?: boolean;
}

export interface DoctorAppointment {
  id: string;
  bookingCode: string;
  patientId: string;
  patientName: string;
  timeSlot: string; // e.g. "09:30 AM - 10:15 AM"
  date: string;
  visitType: 'In-Clinic' | 'Video Call';
  condition: string;
  sessionNumber: number;
  totalSessions: number;
  status: 'Scheduled' | 'In-Progress' | 'Completed';
  phone?: string;
}

export type DoctorStatsFilter = 'day' | 'week' | 'month' | 'lifetime';

export interface DoctorStats {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  activePatients: number;
  newPatients: number;
  revenue: number;
  pendingPayments: number;
  pendingPaymentCount: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  upcomingAppointments?: number;
  totalPatients?: number;
  activePlans?: number;
}

export interface NewPatientFormData {
  file?: File | null;
  photoPreview?: string;
  fullName: string;
  mobile?: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  address?: string;
  city?: string;
  state?: string;
  userId?: number;
  roleId?: number;

  // Compatibility / optional fields:
  age?: number | null;
  phone?: string;
  primaryCondition?: string;
  initialComplaint?: string;
  existingConditions?: string;
  allergies?: string;
  referringDoctor?: string;
  redFlags?: string;
  relevantMedicalHistory?: string;
  initialNotes?: string;
  notes?: string;
  precautionNotes?: string[];
  emergencyContact?: string;
}

export interface DoctorConsultationRecord {
  id: string;
  consultationCode: string; // e.g. "CNS-501"
  patientId: string;
  patientCode: string;
  patientName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  primaryCondition: string;
  chiefComplaint: string;
  date: string;
  time: string;
  consultationType: 'Initial Assessment' | 'Follow-up Visit' | 'Second Opinion' | 'Pre-Rehab Review';
  visitMode: 'In-Clinic' | 'Video Call' | 'Home Visit';
  fee: number;
  paymentStatus: 'Paid' | 'Pending' | 'Waived';
  paymentMethod: 'Cash' | 'UPI / QR' | 'Card' | 'Insurance';
  symptomsNotes: string;
  provisionalDiagnosis: string;
  painSeverity: 'Mild' | 'Moderate' | 'Severe';
  bp?: string;
  pulse?: string;
  romNotes?: string;
  treatmentGiven?: string;
  recommendedPlan?: string;
  clinicalAdvice: string;
  nextFollowUpDate?: string;
}

export interface DoctorInquiryOrAppointment {
  id: string;
  bookingCode: string; // e.g. "APT-801" or "INQ-201"
  entryType: 'appointment' | 'inquiry';
  patientId?: string;
  patientCode?: string;
  patientName: string;
  phone: string;
  email?: string;
  age?: number | null;
  gender?: 'Male' | 'Female' | 'Other';
  date: string;
  timeSlot?: string;
  visitType?: 'In-Clinic' | 'Video Call' | 'Home Visit';
  conditionOrInterest: string;
  notes?: string;
  status: 'Scheduled' | 'In-Progress' | 'Completed' | 'Open Lead' | 'Follow-up Needed' | 'Converted' | 'Cancelled';
  inquirySource?: 'Phone Call' | 'Walk-in' | 'WhatsApp' | 'Referral';
  followUpDate?: string;
  fee?: number;
}
