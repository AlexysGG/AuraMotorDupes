export interface PerfumeItem {
  id: string;
  name: string;
  brand: string;
  estimatedPrice: number;
  savingsPercent: number;
  matchScore: number;
  olfactoryFamily: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  longevityHours: string;
  sillage: string;
  bestOccasions: string[];
  whyItMatches: string;
  pros: string[];
  badge: string;
  vibeDescription: string;
}

export interface RecommendationResponse {
  originalReference: string;
  originalEstimatedPrice: number;
  analysis: string;
  recommendations: PerfumeItem[];
}
