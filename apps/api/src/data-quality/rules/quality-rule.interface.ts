export interface RuleEvaluationContext {
  clinic: {
    id: bigint;
    name: string;
    slug: string;
    phoneE164: string | null;
    whatsappE164: string | null;
    email: string | null;
    website: string | null;
    description: string | null;
    status: string;
    verificationStatus: string;
    verifiedAt: Date | null;
    nextReviewAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  location?: {
    clinicId: bigint;
    address: string | null;
    communeId: bigint;
    latitude: number;
    longitude: number;
    verificationStatus: string;
    verifiedAt: Date | null;
    nextReviewAt: Date | null;
  } | null;
  schedules: Array<{
    id: bigint;
    clinicId: bigint;
    dayOfWeek: number;
    openingTime: Date | string | null;
    closingTime: Date | string | null;
    isClosed: boolean;
    isOvernight: boolean;
    validFrom: Date | null;
    validUntil: Date | null;
  }>;
  services: Array<{
    id: bigint;
    clinicId: bigint;
    serviceId: bigint;
    isAvailable: boolean;
    serviceName?: string;
  }>;
  prices: Array<{
    id: bigint;
    clinicServiceId: bigint;
    minAmount: number | null;
    maxAmount: number | null;
    pricingType: string;
    validFrom: Date;
    validUntil: Date | null;
    verifiedAt: Date | null;
  }>;
  allClinicsPhones: Array<{
    clinicId: bigint;
    phoneE164: string;
    clinicName: string;
  }>;
}

export interface RuleViolation {
  ruleCode: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  causeDescription: string;
  recommendedAction: string;
  metadata?: Record<string, any>;
  targetEntityId?: string | number;
}

export interface QualityRule {
  readonly code: string;
  readonly name: string;
  readonly defaultSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evaluate(ctx: RuleEvaluationContext): RuleViolation[];
}
