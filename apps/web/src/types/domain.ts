// Tipos de dominio sincronizados con la API (§32, §34). Sin `any`.
export type VerificationStatus =
  | 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'OUTDATED' | 'REJECTED';

export type PricingType = 'FIXED' | 'RANGE' | 'FROM' | 'CONTACT';

export type ProfessionalType =
  | 'VETERINARIAN' | 'VETERINARY_TECHNICIAN' | 'SPECIALIST' | 'OTHER';

export interface Price {
  min_amount: number | null;
  max_amount: number | null;
  pricing_type: PricingType;
  currency: string;
  verified_at: string | null;
}

export interface ClinicSummary {
  slug: string;
  name: string;
  commune: string;
  commune_slug: string;
  verification_status: VerificationStatus;
  verified_at: string | null;
  is_emergency: boolean;
  is_24h: boolean;
  is_premium: boolean;
  is_sponsored: boolean;
  open_now: boolean | null;
  km: number | null;
  min_price: number | null;
}

export interface ProfileItem {
  slug: string;
  name: string;
  verification_status: VerificationStatus;
  verified_at: string | null;
}

export interface ProfilePricedItem extends ProfileItem, Price {}

export interface ProfileProfessional {
  display_name: string;
  professional_type: ProfessionalType;
  role: string | null;
  specialties: string;
}

export interface ScheduleEntry {
  day_of_week: number;
  opening_time: string | null;
  closing_time: string | null;
  is_closed: boolean;
  is_overnight: boolean;
  label: string | null;
}

export interface ClinicPhoto {
  url: string;
  alt_text: string | null;
  is_primary: boolean;
}

export interface ClinicProfile {
  slug: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp: string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  is_emergency: boolean;
  is_24h: boolean;
  is_premium: boolean;
  is_sponsored: boolean;
  open_now: boolean | null;
  address: string | null;
  commune: string | null;
  latitude: number | null;
  longitude: number | null;
  services: ProfilePricedItem[];
  exams: ProfilePricedItem[];
  professionals: ProfileProfessional[];
  schedules: ScheduleEntry[];
  photos: ClinicPhoto[];
  animals: string[];
  equipment: Array<{ name: string }>;
}
