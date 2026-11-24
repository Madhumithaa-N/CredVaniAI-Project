export type Language =
  | 'en'
  | 'kn'
  | 'ta'
  | 'hi'
  | 'te'
  | 'ml'
  | 'mr'
  | 'ur'
  | 'bn'
  | 'gu'
  | 'pa'
  | 'or'
  | 'as'
  | 'kok';

export type LoanCategory =
  | 'home'
  | 'personal'
  | 'vehicle'
  | 'education'
  | 'business'
  | 'agriculture'
  | 'gold'
  | 'lap'
  | 'credit_line'
  | 'women'
  | 'disability';

export type EmploymentType =
  | 'salaried'
  | 'self_employed'
  | 'business'
  | 'freelancer'
  | 'gov_psu'
  | 'farmer'
  | 'student'
  | 'retired'
  | 'homemaker'
  | 'other';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface QuickAction {
  label: string;
  actionType: 'open_emi' | 'open_compare' | 'open_checklist' | 'open_eligibility';
  payload?: {
    amount?: number;
    rate?: number;
    tenure?: number;
    category?: LoanCategory;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  spokenAudioText?: string;
  spokenPhoneticSlang?: string;
  spokenSlangDialect?: string;
  language: Language;
  timestamp: Date;
  metadata?: {
    estimatedAmount?: number;
    recommendedRate?: string;
    quickActions?: QuickAction[];
  };
}

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  isRtl?: boolean;
  priorityBadge?: string;
}

export interface UserProfileData {
  age: number | null;
  occupation: string | null;
  monthly_income: number | null;
  employment_type: string | null;
  location: string | null;
  user_category: string | null;
}

export interface AuthUser {
  user_id: number;
  full_name: string;
  email: string;
  mobile_number: string;
  preferred_language: Language;
  is_verified: boolean;
  created_at: string;
  profile?: UserProfileData | null;
}

export interface LoanProduct {
  id: LoanCategory;
  titleKey: string;
  descKey: string;
  iconName: string;
  interestRateMin: number;
  maxAmount: string;
  maxTenure: string;
  bestFor: string;
  keyFeatures: string[];
  officialUrl: string;
}

export interface BankComparisonItem {
  id: string;
  bankName: string;
  bankLogoText: string;
  bankType: 'Public Sector' | 'Private Bank' | 'NBFC' | 'Rural/Govt';
  rating: number;
  interestRateRange: string;
  minCibil: number;
  processingFee: string;
  prepaymentCharges: string;
  approvalSpeed: string;
  aiVerdictKey: string;
  specialFeature: string;
}

export interface DocumentChecklistItem {
  id: string;
  nameKey: string;
  descKey: string;
  category: 'Identity & KYC' | 'Income Proof' | 'Banking & Tax' | 'Asset & Specific';
  applicableLoans: LoanCategory[];
  mandatoryFor: EmploymentType[];
}

export interface RoadmapStep {
  step: number;
  title: string;
  timeline: string;
  action: string;
  tip: string;
  icon: 'ShieldCheck' | 'FileText' | 'CheckCircle2' | 'Search' | 'Banknote';
}
