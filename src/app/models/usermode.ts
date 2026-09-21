



export class MyBooking {
    bookingId: number = 0;
    slotId: number = 0;
    slotDate: string = '';
    startTime: string = '';
    endTime: string = '';
    practitionerName: string = '';
    clinicName: string | null = null;
    clinicAddress: string | null = null;
    status: string = '';
    notes: string = '';
    bookedAt: string = '';
    visitType: string = '';
    homeVisitAddress: string | null = null;
    assignedPractitionerId: number | null = null;
    assignedPractitionerName: string | null = null;
    assignmentStatus: string = '';
}

export type DashboardTab = 'appointments' | 'subscriptions' | 'payments' | 'medical-reports' | 'consultancies' | 'weekly-plan';

export class PaymentItems {
    id: string = '';
    invoiceNumber: string = '';
    title: string = '';
    providerName: string = '';
    date: string = '';
    amount: number = 0;
    paymentMethod: string = '';
    status: 'Successful' | 'Pending' | 'Refunded' = 'Successful';
}

export class MedicalReportItem {
    id: string = '';
    title: string = '';
    category: 'Prescription' | 'Assessment' | 'X-Ray / MRI' | 'Lab Test' | 'Discharge Summary' = 'Assessment';
    doctorName: string = '';
    date: string = '';
    fileSize: string = '';
    fileType: 'pdf' | 'image' = 'pdf';
    downloadUrl?: string = '';
}

export class SubscriptionPlanItem {
    id: string = '';
    title: string = '';
    doctorName: string = '';
    providerType: string = 'Practitioner';
    iconType: string = 'physio';
    status: string = 'Approval Pending';
    statusType: 'pending' | 'in-progress' | 'completed' | string = 'pending';
    startDate: string = '-';
    expiryDate: string = '-';
    totalSessions: number = 0;
    completedSessions: number = 0;
    remainingSessions: number = 0;
    totalAmount: number = 0;
    totalDue: number = 0;
    paidAmount: number = 0;
    outstanding: number = 0;
    paymentStatus: string = 'Pending';
    paymentStatusLabel: string = 'Not Paid';
    progressPercent: number = 0;
    isExpanded?: boolean = false;
}

export class ConsultancyItem {
    id: string = '';
    bookingId?: number = 0;
    slotId?: number = 0;
    doctorName: string = '';
    assignedPractitionerName?: string = '';
    assignmentStatus?: string = 'Assigned';
    specialization: string = '';
    date: string = '';
    slotDate?: string = '';
    dayOfWeek?: string = '';
    time: string = '';
    startTime?: string = '';
    endTime?: string = '';
    mode: 'Video Call' | 'In-Clinic' | 'Home Visit' | string = 'In-Clinic';
    visitType?: string = 'Clinic';
    clinicName?: string | null = 'Not specified';
    clinicAddress?: string | null = 'Not specified';
    diagnosis: string = '';
    status: 'Completed' | 'Upcoming' | 'Cancelled' | 'Scheduled' | string = 'Scheduled';
    prescriptionAvailable: boolean = false;
    notes: string = '';
    bookedAt?: string = '';
    isExpanded?: boolean = false;
}

export class DayExercise {
    id: string = '';
    name: string = '';
    targetArea: string = '';
    sets: string = '';
    duration: string = '';
    difficulty: 'Beginner' | 'Moderate' | 'Advanced' = 'Beginner';
    notes: string = '';
    completed: boolean = false;
    videoThumb?: string = '';
}

export class DayPlan {
    dayName: string = '';
    dayShort: string = '';
    dayNumber: number = 0;
    focus: string = '';
    exercises: DayExercise[] = [];
}


export class UserProfileModel {
    id: number;
    fullName: string;
    email: string;
    mobile: string;
    gender: string;
    dob: string;
    city: string | null;
    state: string | null;
    profileImageUrl: string | null;
    isEmailVerified: boolean;
    isMobileVerified: boolean;
    isProfileCompleted: boolean;
    createdAt: string;
}

// ── Shared Sub-Models ────────────────────────────────────────────────────────

export class PractitionerServiceModel {
    id: number = 0;
    practitionerId: number | null = null;
    clinicId: number | null = null;
    serviceId: number | null = null;
    serviceName: string | null = null;
}

export class LanguageModel {
    id: number = 0;
    practitionerId: number = 0;
    clinicId: number = 0;
    languageId: number = 0;
    languageName: string | null = null;
}

export class QualificationModel {
    id: number = 0;
    practitionerId: number | null = null;
    qualificationId: number | null = null;
    instituteId: number | null = null;
    qualificationName: string | null = null;
    instituteName: string | null = null;
}




export class PractitionerProfileModel {
    id: number = 0;
    practitionerId: number = 0;
    fullName: string | null = null;
    profileImage: string | null = null;
    userId: number | null = null;
    clinicId: number | null = null;
    specializationId: number | null = null;
    experienceYears: number | null = null;
    savedPractitioner: boolean = false;
    about: string | null = null;
    consultationFee: number | null = null;
    avgRating: number | null = null;
    totalReviews: number | null = null;
    isVerified: boolean | null = null;
    isActive: boolean | null = null;
    clinicName: string | null = null;
    specialization: string | null = null;
    isProfileCompleted: boolean = false;
    services: PractitionerServiceModel[] = [];
    languages: LanguageModel[] = [];
    qualifications: QualificationModel[] = [];
}

// ── Clinic Profile ────────────────────────────────────────────────────────────

export class ClinicPractitionerModel {
    practitionerId: number = 0;
    userId: number = 0;
    fullName: string | null = null;
    profileImage: string | null = null;
    specializationId: number | null = null;
    specialization: string | null = null;
    experienceYears: number | null = null;
    consultationFee: number | null = null;
    avgRating: number | null = null;
    totalReviews: number | null = null;
    isVerified: boolean | null = null;
    isActive: boolean | null = null;
}

export class ClinicMediaModel {
    id: number = 0;
    imageUrl: string | null = null;
}

export class expertiesModel {
    id: number = 0;
    name: string | null = null;
}

export class ClinicProfileModel {
    id: number = 0;
    clinicName: string | null = null;
    logoUrl: string | null = null;
    bannerImageUrl: string | null = null;
    about: string | null = null;
    address: string | null = null;
    city: string | null = null;
    state: string | null = null;
    phone: string | null = null;
    email: string | null = null;
    avgRating: number | null = null;
    totalReviews: number | null = null;
    isVerified: boolean | null = null;
    isActive: boolean | null = null;
    services: PractitionerServiceModel[] = [];
    languages: LanguageModel[] = [];
    expertise: expertiesModel[] = [];
    clinicGallery: ClinicMediaModel[] = [];
    practitioners: ClinicPractitionerModel[] = [];
}

