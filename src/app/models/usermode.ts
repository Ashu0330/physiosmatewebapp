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

export interface MyBooking {
    bookingId: number;
    slotId: number;
    slotDate: string;
    startTime: string;
    endTime: string;
    practitionerName: string;
    clinicName: string | null;
    clinicAddress: string | null;
    status: string;
    notes: string;
    bookedAt: string;
    visitType: string;
    homeVisitAddress: string | null;
    assignedPractitionerId: number | null;
    assignedPractitionerName: string | null;
    assignmentStatus: string;
}