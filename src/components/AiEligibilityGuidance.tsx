import React, { useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Language, LoanCategory, EmploymentType } from '../types';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Calculator,
  UserCheck,
  Building,
  Briefcase,
  Laptop,
  Landmark,
  Wheat,
  GraduationCap,
  HeartHandshake,
  Home,
  Layers,
} from 'lucide-react';

interface AiEligibilityGuidanceProps {
  currentLanguage?: Language;
  preSelectedLoanCategory?: LoanCategory;
  onNavigateToEmi: (amount: number, tenureYears: number) => void;
  onAskAiWithContext: (prompt: string) => void;
}

export const AiEligibilityGuidance: React.FC<AiEligibilityGuidanceProps> = ({
  preSelectedLoanCategory = 'home',
  onNavigateToEmi,
  onAskAiWithContext,
}) => {
  const { t } = useTranslation();
  const incomeInputId = useId();
  const existingEmiInputId = useId();
  const cibilInputId = useId();
  const tenureInputId = useId();

  const [monthlyIncome, setMonthlyIncome] = useState<number>(75000);
  const [existingEmis, setExistingEmis] = useState<number>(12000);
  const [cibilScore, setCibilScore] = useState<number>(760);
  const [employmentType, setEmploymentType] = useState<EmploymentType>('salaried');
  const [loanCategory, setLoanCategory] = useState<LoanCategory>(preSelectedLoanCategory);
  const [tenureYears, setTenureYears] = useState<number>(20);

  React.useEffect(() => {
    if (preSelectedLoanCategory) {
      setLoanCategory(preSelectedLoanCategory);
    }
  }, [preSelectedLoanCategory]);

  const EMPLOYMENT_OPTIONS: {
    id: EmploymentType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'salaried', label: t('salaried'), icon: <UserCheck className="w-3.5 h-3.5" /> },
    { id: 'self_employed', label: t('selfEmployed'), icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'business', label: t('businessOwner'), icon: <Building className="w-3.5 h-3.5" /> },
    { id: 'freelancer', label: t('freelancer'), icon: <Laptop className="w-3.5 h-3.5" /> },
    { id: 'gov_psu', label: t('govPsu'), icon: <Landmark className="w-3.5 h-3.5" /> },
    { id: 'farmer', label: t('farmer'), icon: <Wheat className="w-3.5 h-3.5" /> },
    { id: 'student', label: t('student'), icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'retired', label: t('retired'), icon: <HeartHandshake className="w-3.5 h-3.5" /> },
    { id: 'homemaker', label: t('homemaker'), icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'other', label: t('other'), icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  let maxAllowedFoirPct = 50;
  if (employmentType === 'gov_psu') {
    maxAllowedFoirPct = monthlyIncome < 50000 ? 55 : monthlyIncome <= 100000 ? 60 : 65;
  } else if (employmentType === 'salaried') {
    maxAllowedFoirPct = monthlyIncome < 50000 ? 50 : monthlyIncome <= 100000 ? 55 : 60;
  } else if (employmentType === 'business' || employmentType === 'self_employed') {
    maxAllowedFoirPct = monthlyIncome < 60000 ? 45 : 55;
  } else if (employmentType === 'freelancer' || employmentType === 'retired' || employmentType === 'other') {
    maxAllowedFoirPct = 45;
  }

  const maxPermissibleTotalEmi = (monthlyIncome * maxAllowedFoirPct) / 100;
  const safeMonthlyEmiCapacity = Math.max(0, maxPermissibleTotalEmi - existingEmis);
  const currentFoir = monthlyIncome > 0 ? Math.round((existingEmis / monthlyIncome) * 100) : 0;

  let baseRate =
    loanCategory === 'home'
      ? 8.4
      : loanCategory === 'personal'
      ? 11.0
      : loanCategory === 'agriculture' || loanCategory === 'disability'
      ? 4.5
      : loanCategory === 'women'
      ? 8.25
      : 9.0;

  if (employmentType === 'gov_psu') {
    baseRate = Math.max(4.0, baseRate - 0.25);
  } else if (employmentType === 'farmer' && loanCategory === 'agriculture') {
    baseRate = 4.0;
  } else if (employmentType === 'homemaker' || employmentType === 'student') {
    baseRate = Math.max(4.0, baseRate - 0.05);
  }

  const monthlyRate = baseRate / (12 * 100);
  const totalMonths = tenureYears * 12;
  const factor = (1 - Math.pow(1 + monthlyRate, -totalMonths)) / monthlyRate;
  const rawMaxLoan = safeMonthlyEmiCapacity > 0 ? Math.round(safeMonthlyEmiCapacity * factor) : 0;

  let cibilMultiplier = cibilScore >= 780 ? 1.05 : cibilScore >= 720 ? 1.0 : cibilScore >= 650 ? 0.8 : 0.4;
  if (employmentType === 'gov_psu') cibilMultiplier *= 1.05;
  if (employmentType === 'student') cibilMultiplier = Math.max(0.9, cibilMultiplier);

  const finalMaxLoan = Math.round(rawMaxLoan * cibilMultiplier);

  let verdict: 'high' | 'moderate' | 'low' = 'high';
  if (cibilScore < 650 || currentFoir > 55 || safeMonthlyEmiCapacity <= 5000) {
    verdict = 'low';
  } else if (cibilScore < 720 || currentFoir > 45) {
    verdict = 'moderate';
  }

  const loanChoices: { id: LoanCategory; label: string; rate: string }[] = [
    { id: 'home', label: t('loanHomeTitle'), rate: '8.35%' },
    { id: 'personal', label: t('loanPersonalTitle'), rate: '10.5%' },
    { id: 'vehicle', label: t('loanVehicleTitle'), rate: '8.75%' },
    { id: 'education', label: t('loanEducationTitle'), rate: '8.15%' },
    { id: 'business', label: t('loanBusinessTitle'), rate: '9.25%' },
    { id: 'women', label: t('loanWomenTitle'), rate: '8.25%' },
    { id: 'disability', label: t('loanDisabilityTitle'), rate: '4.0%' },
    { id: 'agriculture', label: t('loanAgriTitle'), rate: '4.0%' },
  ];

  const selectedProfileLabel =
    EMPLOYMENT_OPTIONS.find((e) => e.id === employmentType)?.label || t('salaried');
  const selectedLoanLabel =
    loanChoices.find((l) => l.id === loanCategory)?.label || t('loanHomeTitle');

  return (
    <section
      id="eligibility-section"
      className="py-12 sm:py-16 bg-[#000000] border-b border-white/15 scroll-mt-16 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-teal-400 uppercase mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>{t('zeroCibilNote')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('eligibilityTitle')}
          </h2>
          <p className="mt-1 text-zinc-400 text-xs sm:text-sm">
            {t('eligibilitySubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Inputs */}
          <div
            className="lg:col-span-7 bg-[#0f0f0f] border border-white/15 rounded-[16px] p-5 sm:p-7 space-y-5"
            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)' }}
          >
            {/* Employment Type Segmented Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  {t('selectEmploymentLabel')}
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {EMPLOYMENT_OPTIONS.map((item) => {
                  const isSelected = employmentType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEmploymentType(item.id)}
                      className={`p-2.5 rounded-lg border transition-all text-start cursor-pointer flex flex-col justify-between min-h-[54px] ${
                        isSelected
                          ? 'bg-white text-black border-white font-bold shadow-md'
                          : 'bg-[#161616] border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={isSelected ? 'text-black' : 'text-zinc-400'}>
                          {item.icon}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <div className="mt-1 text-xs font-bold leading-tight truncate">
                        [ {item.label} ]
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monthly Income Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={incomeInputId} className="text-xs sm:text-sm font-semibold text-zinc-300">
                  {t('monthlyIncome')}
                </label>
                <div className="text-base font-bold text-teal-400 font-mono">
                  ₹{monthlyIncome.toLocaleString('en-IN')}
                </div>
              </div>
              <input
                id={incomeInputId}
                type="range"
                min="10000"
                max="500000"
                step="5000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full h-2 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>

            {/* Existing EMIs Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={existingEmiInputId} className="text-xs sm:text-sm font-semibold text-zinc-300">
                  {t('existingEmis')}
                </label>
                <div className="text-base font-bold text-white font-mono">
                  ₹{existingEmis.toLocaleString('en-IN')}
                </div>
              </div>
              <input
                id={existingEmiInputId}
                type="range"
                min="0"
                max="200000"
                step="2000"
                value={existingEmis}
                onChange={(e) => setExistingEmis(Number(e.target.value))}
                className="w-full h-2 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>

            {/* CIBIL Score & Target Tenure Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor={cibilInputId} className="text-xs sm:text-sm font-semibold text-zinc-300">
                    {t('cibilScore')}
                  </label>
                  <span
                    className={`text-sm font-extrabold font-mono ${
                      cibilScore >= 750
                        ? 'text-emerald-400'
                        : cibilScore >= 680
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {cibilScore}
                  </span>
                </div>
                <input
                  id={cibilInputId}
                  type="range"
                  min="550"
                  max="850"
                  step="10"
                  value={cibilScore}
                  onChange={(e) => setCibilScore(Number(e.target.value))}
                  className="w-full h-2 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor={tenureInputId} className="text-xs sm:text-sm font-semibold text-zinc-300">
                    {t('desiredTenure')}
                  </label>
                  <span className="text-sm font-bold text-white font-mono">
                    {tenureYears} {t('years')}
                  </span>
                </div>
                <input
                  id={tenureInputId}
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full h-2 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
              </div>
            </div>

            {/* Target Loan Type Selector */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2">
                {t('desiredLoanType')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {loanChoices.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLoanCategory(item.id)}
                    className={`py-2 px-3 rounded-lg border text-start transition-all cursor-pointer ${
                      loanCategory === item.id
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-[#161616] border-white/10 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{item.label}</div>
                    <div
                      className={`text-[10px] font-mono ${
                        loanCategory === item.id ? 'text-zinc-600' : 'text-zinc-500'
                      }`}
                    >
                      {item.rate}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Result Card */}
          <div className="lg:col-span-5 space-y-4">
            <div
              className="bg-[#0f0f0f] border border-white/15 rounded-[16px] p-5 sm:p-6 relative overflow-hidden"
              style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)' }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  {t('eligibilityScore')}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold ${
                    verdict === 'high'
                      ? 'text-emerald-400'
                      : verdict === 'moderate'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {verdict === 'high' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {verdict === 'moderate' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  {verdict === 'low' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                  <span>
                    {verdict === 'high'
                      ? t('aiVerdictHigh')
                      : verdict === 'moderate'
                      ? t('aiVerdictModerate')
                      : t('aiVerdictLow')}
                  </span>
                </span>
              </div>

              <div className="py-4 border-b border-white/10">
                <div className="text-xs text-zinc-400 font-medium">
                  {t('maxEligibleAmount')}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                    ₹{(finalMaxLoan / 100000).toFixed(2)} L
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    (₹{finalMaxLoan.toLocaleString('en-IN')})
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400 font-mono">
                  FOIR {maxAllowedFoirPct}% · [ {selectedProfileLabel} ]
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-b border-white/10 text-xs">
                <div>
                  <div className="text-zinc-500">{t('estimatedMonthlyEmi')}</div>
                  <div className="text-sm font-bold text-teal-400 font-mono mt-0.5">
                    ₹{safeMonthlyEmiCapacity.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">{t('foirRatio')}</div>
                  <div className="mt-0.5 font-mono">
                    <span
                      className={`text-sm font-bold ${
                        currentFoir <= 40
                          ? 'text-emerald-400'
                          : currentFoir <= 50
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {currentFoir}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>{t('aiTipTitle')}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {t('eligibilitySubtitle')}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigateToEmi(finalMaxLoan, tenureYears)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-zinc-200 active:scale-95 text-black text-xs font-bold transition-all cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{t('calcLimitEmiBtn')}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAskAiWithContext(
                      `${selectedLoanLabel} (${selectedProfileLabel}): ₹${monthlyIncome}/mo, EMI ₹${existingEmis}, CIBIL ${cibilScore}`
                    )
                  }
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#161616] hover:bg-white/10 text-white text-xs font-bold transition-colors cursor-pointer border border-white/15"
                >
                  <span>{t('ctaAskAi')}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
