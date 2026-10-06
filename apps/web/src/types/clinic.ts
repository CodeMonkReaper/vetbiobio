export interface ClinicCard {
  slug: string;
  name: string;
  commune: string;
  km?: number;
  verified_at?: string | null;
}
