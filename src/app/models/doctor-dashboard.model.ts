export interface DoctorPatient {
  id: string;
  patientCode: string; // e.g. "PT-1041"
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  primaryCondition: string;
  status: 'Active' | 'Completed' | 'Pending';
  currentPlan?: string;
  sessionsCompleted: number;
  totalSessions: number;
  lastVisit: string;
  nextAppointment?: string;
  emergencyContact?: string;
  dob?: string;
  redFlags?: string;
  relevantMedicalHistory?: string;
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
  fullName: string;
  age: number | null;
  gender: 'Male' | 'Female' | 'Other';
  dob?: string;
  phone: string;
  email: string;
  primaryCondition: string;
  chiefComplaint: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  referringDoctor?: string;
  redFlags?: string;
  relevantMedicalHistory?: string;
  treatmentGoal?: string;
  assignedPlanTemplate?: string;
  notes?: string;
  precautionNotes?: string[];
  emergencyContact?: string;
}
