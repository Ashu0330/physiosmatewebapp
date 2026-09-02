export class authmodel {
    id: number;
    roleId: number;

    fullName: string;
    email: string;
    mobile: string;
    profileImage: string;

    isEmailVerified: boolean;
    isMobileVerified: boolean;
    isActive: boolean;
    isProfileCompleted: boolean;

    token: string;

    gender: string;
    city: string;
    state: string;

    clinicId: number;
    practitionerId: number;
}
