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
