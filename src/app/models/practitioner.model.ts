export interface ApiResponse<T> {
  message: string;
  isSuccess: boolean;
  statusCode: number;
  data: T;
}

export interface PractitionerSummary {
  practitionerId: number;
  fullName: string;
  profileImage: string | null;
  specializationId: number;
  specialization: string;
  experienceYears: number;
  about: string;
  consultationFee: number;
  avgRating: number;
  totalReviews: number;
  isVerified: boolean;
  clinicId: number | null;
  clinicName: string | null;
}

export interface PractitionerFilter {
  city?: string;
  specializationId?: number;
  minRating?: number;
  maxPrice?: number;
  minExperience?: number;
  page: number;
  pageSize: number;
}

export interface PractitionerServiceItem {
  id: number;
  practitionerId?: number | null;
  clinicId?: number | null;
  serviceId: number;
  serviceName: string;
  description?: string;
}

export interface PractitionerLanguage {
  id: number;
  practitionerId?: number;
  clinicId?: number;
  languageId: number;
  languageName: string;
}

export interface PractitionerQualification {
  id?: number;
  practitionerId?: number;
  degree?: string;
  qualificationName?: string;
  institution?: string;
  university?: string;
  passingYear?: string | number;
  year?: string | number;
}

export interface PractitionerSubscriptionPlan {
  practitionerId?: number;
  subscriptionPlanId: number;
  planName: string;
  totalSessions: number;
  validityDays: number;
  price: number;
  isPopular?: boolean;
  isActive?: boolean;
  features?: string[];
}

export class PractitionerModel {
  name: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  tags: string[];
  location: string;
  city: string;
  state: string;
  image: string;
  about: string;
  avgRating: number;
  clinicId: number | null;
  clinicName: string | null;
  consultationFee: number;
  experienceYears: number;
  fullName: string;
  isVerified: boolean;
  practitionerId: number;
  profileImage: string;
  specialization: string;
  specializationId: number;
  totalReviews: number;
}

export interface PractitionerDetailedData {
  id: number;
  practitionerId: number;
  fullName: string;
  profileImage: string | null;
  userId?: number | null;
  clinicId?: number | null;
  specializationId: number;
  specialization: string;
  experienceYears: number;
  savedPractitioner: boolean;
  about: string;
  consultationFee: number;
  avgRating: number;
  totalReviews: number;
  isVerified: boolean;
  isActive: boolean;
  clinicName: string | null;
  isProfileCompleted: boolean;
  services: PractitionerServiceItem[];
  languages: PractitionerLanguage[];
  qualifications: PractitionerQualification[];
}

export interface SavedPractitioner {
  savedId: number;
  practitionerId: number;
  fullName: string;
  specialization: string;
  experienceYears: number;
  consultationFee: number;
  avgRating: number;
  totalReviews: number;
  profileImageUrl: string | null;
  clinicName: string | null;
}

export interface ClinicFilter {
  city?: string;
  page: number;
  pageSize: number;
}

export interface ClinicSummary {
  clinicId: number;
  id?: number;
  clinicName: string;
  description: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  email?: string;
  logo?: string | null;
  bannerImage?: string | null;
  avgRating?: number | null;
  totalReviews?: number;
  isApproved?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface ClinicGalleryItem {
  id: number;
  clinicId: number;
  file?: any;
  imageUrl: string;
}

export interface ClinicDetailedData {
  id: number;
  clinicId?: number;
  savedClinic: boolean;
  ownerUserId?: number;
  clinicName: string;
  consultancyFees: number;
  description: string;
  establishedYear?: number;
  phone?: string;
  email?: string;
  address: string;
  city: string;
  stateName?: string;
  state?: string;
  pincode?: string;
  logo?: string | null;
  logoFile?: any;
  logoUrl?: string | null;
  bannerImage?: string | null;
  bannerImageFile?: any;
  bannerImageUrl?: string | null;
  avgRating?: number | null;
  totalReviews?: number;
  isApproved?: boolean;
  isActive?: boolean;
  createdAt?: string;
  specializationId?: number | null;
  clinicMedia?: any;
  services: PractitionerServiceItem[];
  languages: PractitionerLanguage[];
  expertise: any[];
  subscriptionPlans: PractitionerSubscriptionPlan[];
  clinicGallery: ClinicGalleryItem[];
  practitioners: PractitionerSummary[];
  practitionerIds: number[];
}

export interface ProviderCatalogRequest {
  practitionerId?: number;
  clinicId?: number;
  providerId?: number;
  providerType?: string;
  expertiseId?: number;
  treatmentAddOnId?: number;
}

export interface ProviderExpertise {
  id: number;
  providerId: number;
  providerType: string;
  expertiseName: string;
  isSystem?: boolean;
}

export interface ProviderPlanBenefit {
  id: number;
  planId: number;
  type: number;
  benefitName: string;
  isSystem?: boolean;
}

export interface ProviderSubscriptionPlan {
  id: number;
  planName: string;
  totalSessions: number;
  validityDays: number;
  price: number;
  isPopular: boolean;
  isActive: boolean;
  providerType: string;
  providerId: number;
  expertiseId: number;
  benefits: ProviderPlanBenefit[];
}

export interface UserSubscription {
  id: number;
  userId: number;
  providerId: number;
  clinicId?: number;
  practitionerId?: number;
  providerType: string;
  planId: number;
  planName: string;
  price: number;
  validityDays: number;
  providerName: string;
  totalSessions: number;
  completedSessions: number;
  remainingSessions: number;
  isCurrent: boolean;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  daysRemaining: number;
  completionPercentage: number;
}

export interface UserSubscriptionFilter {
  userId: number;
  pageSize?: number;
  pageNo?: number;
}


export interface BookingState {
  providerId: number;
  providerName: string;
  providerSpecialty: string;
  providerImage?: string | null;
  clinicName?: string | null;
  clinicAddress?: string | null;
  consultationFee: number;
  selectedDay?: string;
  selectedTime?: string;
  bookingId?: string;
}

export class ReviewModel {
  PractitionerId: number;
  PractitioName: string;
  providerImage?: string | null;
  clinicName?: string | null;
  clinicId?: number | null;
  rating?: number | null;
  review: string;
}