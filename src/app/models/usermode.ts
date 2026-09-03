export class roles {
    id: number = 0;
    roleName: string = '';
    description: string = '';
    displayTitle: string = '';
    iconClass: string = '';
    iconName: string = '';
}

export class qualification {
    id: number = 0;
    qualificationName: string = '';
}

export class language {
    id: number = 0;
    name: string = '';
}

export class specialization {
    id: number = 0;
    name: string = '';
    isActive: boolean = false;
    icon: string = '';
}

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

export class ConsultancyItem {
    id: string = '';
    doctorName: string = '';
    specialization: string = '';
    date: string = '';
    time: string = '';
    mode: 'Video Call' | 'In-Clinic' | 'Home Visit' = 'In-Clinic';
    diagnosis: string = '';
    status: 'Completed' | 'Upcoming' | 'Cancelled' = 'Upcoming';
    prescriptionAvailable: boolean = false;
    notes: string = '';
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