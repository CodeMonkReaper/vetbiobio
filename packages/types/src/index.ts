// Enums centralizados — única fuente de verdad (§50). No usar strings mágicos.
export enum ClinicStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CLOSED = 'CLOSED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  VERIFIED = 'VERIFIED',
  OUTDATED = 'OUTDATED',
  REJECTED = 'REJECTED',
}

export enum VerificationSource {
  OFFICIAL_WEBSITE = 'OFFICIAL_WEBSITE',
  OFFICIAL_SOCIAL_MEDIA = 'OFFICIAL_SOCIAL_MEDIA',
  PHONE = 'PHONE',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  DIRECT_COMMUNICATION = 'DIRECT_COMMUNICATION',
  PUBLIC_SOURCE = 'PUBLIC_SOURCE',
  ADMIN_RESEARCH = 'ADMIN_RESEARCH',
  OTHER = 'OTHER',
}

export enum PricingType {
  FIXED = 'FIXED',
  RANGE = 'RANGE',
  FROM = 'FROM',
  CONTACT = 'CONTACT',
}

export enum ProfessionalType {
  VETERINARIAN = 'VETERINARIAN',
  VETERINARY_TECHNICIAN = 'VETERINARY_TECHNICIAN',
  SPECIALIST = 'SPECIALIST',
  OTHER = 'OTHER',
}

export enum AnimalSpecies {
  DOG = 'DOG',
  CAT = 'CAT',
  RABBIT = 'RABBIT',
  BIRD = 'BIRD',
  REPTILE = 'REPTILE',
  RODENT = 'RODENT',
  EXOTIC = 'EXOTIC',
  OTHER = 'OTHER',
}

export enum SortOption {
  RELEVANCE = 'RELEVANCE',
  DISTANCE = 'DISTANCE',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  VERIFICATION = 'VERIFICATION',
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
