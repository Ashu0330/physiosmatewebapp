// ─── All backend API endpoint fragments ─────────────────────────────────────
// Usage:  this.apiService.Get(ApiEndPoints.GetPractitioners)
//         this.apiService.Post(ApiEndPoints.BookConsultancy, model)
//         this.apiService.Delete(ApiEndPoints.DeletePatient + id)

export const ApiEndPoints = {

    // ── Auth ────────────────────────────────────────────────────────────────────
    Login: 'Auth/Login',
    Register: 'Auth/Register',
    VerifyOtp: 'Auth/VerifyOtp',
    ResendOtp: 'Auth/ResendOtp',
    GetAllExpertise: 'ProviderCatalog/GetAllExpertise',
    AddUpdateExpertise: 'ProviderCatalog/AddUpdateExpertise',
    GetAllTreatmentServices: 'ProviderCatalog/GetAllTreatmentServices',
    AddUpdateTreatmentServices: 'ProviderCatalog/AddUpdateTreatmentServices',

    // ── Practitioner (Doctor) Registration ─────────────────────────────────────
    AddPractitioner: 'Practitioner/AddPractitioner',

    // ── Clinic Registration ─────────────────────────────────────────────────────
    AddClinic: 'Clinic/AddClinic',

    // ── Explore / Discovery ─────────────────────────────────────────────────────
    GetPractitioners: 'Explore/GetPractitioners',
    GetPractitionerById: 'Explore/GetPractitionerById',
    GetClinics: 'Explore/GetClinics',
    GetClinicById: 'Explore/GetClinicById',

    // ── Consultancy / Booking ────────────────────────────────────────────────────
    GetAvailability: 'Consultancy/GetAvailability',
    AddAvailability: 'ProviderCatalog/AddAvailability',
    BookConsultancy: 'Consultancy/BookConsultancy',
    MyBookings: 'Consultancy/MyBookings',

    // ── User / Patient ────────────────────────────────────────────────────────────
    SavePractitioner: 'User/SavePractitioner',
    GetSavedPractitioners: 'User/SavedPractitioners',
    RemoveSavedPractitioner: 'User/RemoveSavedPractitioner',
    AddUserSubscription: 'User/AddUserSubscription',
    GetUserSubscription: 'User/GetUserSubscription',
    GetUserProfile: 'User/GetProfile',
    GetPatientProfile: 'User/GetProfile',
    GetPractitionerProfile: 'Explore/GetPractitionerById',
    GetClinicProfile: 'Clinic/GetClinicProfile',
    UpdateProfile: 'User/UpdateProfile',
    UpdatePractitioner: 'Practitioner/AddPractitioner',
    UpdateClinic: 'Clinic/AddClinic',
    AddReview: 'Review/AddProviderReview',
    GetAllReviews: 'Review/GetAllReview',

    // ── Patient ───────────────────────────────────────────────────────────────────
    AddPatient: 'Patient/AddPatient',
    GetMyPatients: 'Patient/GetMyPatients',

    // ── Doctor Dashboard ──────────────────────────────────────────────────────────
    DoctorPatients: 'Doctor/Patients',
    DoctorPatientById: 'Doctor/Patient',
    DoctorAddPatient: 'Doctor/AddPatient',
    DoctorTreatmentPlans: 'Doctor/TreatmentPlans',
    DoctorAddTreatmentPlan: 'Doctor/AddTreatmentPlan',
    DoctorAppointments: 'Doctor/Appointments',
    DoctorStats: 'Doctor/Stats',
    DoctorUpdateAppointmentStatus: 'Doctor/UpdateAppointmentStatus',

    // ── Provider Catalog ──────────────────────────────────────────────────────────
    // GetAllExpertise: 'ProviderCatalog/GetAllExpertise',
    GetProviderPlans: 'ProviderCatalog/GetProviderPlans',
    AddProviderPlans: 'ProviderCatalog/AddProviderPlans',
    AddAddons: 'ProviderCatalog/AddAddons',
    GetAllAddOns: 'ProviderCatalog/GetAllAddOns',
    CreateAppointmentSlot: 'ProviderCatalog/CreateAppoimentSlot',
    GetAppointmentSlots: 'Appointment/GetAppoimentSlot',

    // ── Master Data ────────────────────────────────────────────────────────────────
    GetAllRoles: 'Master/GetAllRoles',
    GetAllSpecialization: 'Master/GetAllSpecialization',
    GetAllServices: 'Master/GetAllService',
    GetAllLanguage: 'Master/GetAllLanguage',
    GetAllQualification: 'Master/GetAllQualification',
    GetAllState: 'Master/GetAllState',
    GetAllCity: 'Master/GetAllCity',

    // ── Push Notifications ─────────────────────────────────────────────────────────
    PushSubscribe: 'Push/Subscribe',
    PushUnsubscribe: 'Push/Unsubscribe',

    // ── SideBar Menus ─────────────────────────────────────────────────────────
    GetAllMenu: 'Master/GetSideMenu',
};
