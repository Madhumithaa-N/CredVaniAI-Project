import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Language, LoanCategory } from '../types';
import { LOAN_PRODUCTS } from '../data/loanData';
import {
  Home,
  UserCheck,
  Car,
  GraduationCap,
  Briefcase,
  Sprout,
  Coins,
  Building2,
  CreditCard,
  HeartHandshake,
  Accessibility,
  ArrowRight,
  Calculator,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface LoanTypeCardsProps {
  currentLanguage?: Language;
  onSelectEmiLoan: (loanId: LoanCategory, defaultRate: number) => void;
  onSelectEligibilityLoan: (loanId: LoanCategory) => void;
  onAskAiAboutLoan: (loanTitle: string) => void;
}

const ACCENT_PALETTE: Record<
  LoanCategory,
  { colorHex: string; accentText: string }
> = {
  home: { colorHex: '#2563EB', accentText: '#60A5FA' },
  vehicle: { colorHex: '#0D9488', accentText: '#2DD4BF' },
  education: { colorHex: '#7C3AED', accentText: '#A78BFA' },
  business: { colorHex: '#4F46E5', accentText: '#818CF8' },
  personal: { colorHex: '#D97706', accentText: '#FBBF24' },
  agriculture: { colorHex: '#16A34A', accentText: '#4ADE80' },
  gold: { colorHex: '#CA8A04', accentText: '#FACC15' },
  lap: { colorHex: '#0284C7', accentText: '#38BDF8' },
  credit_line: { colorHex: '#0891B2', accentText: '#22D3EE' },
  women: { colorHex: '#DB2777', accentText: '#F472B6' },
  disability: { colorHex: '#10B981', accentText: '#34D399' },
};

export const LoanTypeCards: React.FC<LoanTypeCardsProps> = ({
  onSelectEmiLoan,
  onSelectEligibilityLoan,
  onAskAiAboutLoan,
}) => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'property' | 'retail' | 'inclusion'
  >('all');

  const getIcon = (iconName: string, colorHex: string) => {
    const style = { color: colorHex };
    switch (iconName) {
      case 'Home':
        return <Home className="w-5 h-5" style={style} />;
      case 'UserCheck':
        return <UserCheck className="w-5 h-5" style={style} />;
      case 'Car':
        return <Car className="w-5 h-5" style={style} />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" style={style} />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5" style={style} />;
      case 'Sprout':
        return <Sprout className="w-5 h-5" style={style} />;
      case 'Coins':
        return <Coins className="w-5 h-5" style={style} />;
      case 'Building2':
        return <Building2 className="w-5 h-5" style={style} />;
      case 'CreditCard':
        return <CreditCard className="w-5 h-5" style={style} />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-5 h-5" style={style} />;
      case 'Accessibility':
        return <Accessibility className="w-5 h-5" style={style} />;
      default:
        return <Sparkles className="w-5 h-5" style={style} />;
    }
  };

  const filteredLoans = LOAN_PRODUCTS.filter((product) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'property')
      return ['home', 'lap', 'gold'].includes(product.id);
    if (activeFilter === 'retail')
      return ['personal', 'vehicle', 'education', 'credit_line'].includes(product.id);
    if (activeFilter === 'inclusion')
      return ['business', 'women', 'disability', 'agriculture'].includes(product.id);
    return true;
  });

  return (
    <section
      id="loans-section"
      className="py-12 sm:py-16 bg-[#000000] border-b border-white/15 scroll-mt-16 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-teal-400 uppercase mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('ctaExploreLoans')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('loansTitle')}
            </h2>
            <p className="mt-1.5 text-zinc-400 text-xs sm:text-sm max-w-2xl">
              {t('loansSubtitle')}
            </p>
          </div>

          {/* Interactive Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#0f0f0f] border border-white/15 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('loansFilterAll')} ({LOAN_PRODUCTS.length})
            </button>
            <button
              onClick={() => setActiveFilter('property')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeFilter === 'property'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('loansFilterProperty')}
            </button>
            <button
              onClick={() => setActiveFilter('retail')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeFilter === 'retail'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('loansFilterRetail')}
            </button>
            <button
              onClick={() => setActiveFilter('inclusion')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeFilter === 'inclusion'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('loansFilterInclusion')}
            </button>
          </div>
        </div>

        {/* Loan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredLoans.map((loan) => {
            const localizedTitle = t(loan.titleKey);
            const localizedDesc = t(loan.descKey);
            const palette = ACCENT_PALETTE[loan.id] || {
              colorHex: '#0D9488',
              accentText: '#2DD4BF',
            };

            return (
              <div
                key={loan.id}
                className="group relative flex flex-col justify-between rounded-[16px] bg-[#0f0f0f] border border-white/15 hover:border-white/30 p-5 transition-all duration-200 overflow-hidden"
                style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)' }}
              >
                <div
                  className="absolute top-0 inset-x-0 h-[2px] opacity-85"
                  style={{ backgroundColor: palette.colorHex }}
                />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 border border-white/10"
                      style={{ backgroundColor: `${palette.colorHex}22` }}
                    >
                      {getIcon(loan.iconName, palette.accentText)}
                    </div>

                    <div className="text-end">
                      <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider">
                        {t('startingFrom')}
                      </div>
                      <div
                        className="text-lg font-bold font-mono tracking-tight"
                        style={{ color: palette.accentText }}
                      >
                        {loan.interestRateMin}%{' '}
                        <span className="text-[11px] font-normal text-zinc-400">
                          {t('pAnn')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">
                    {localizedTitle}
                  </h3>

                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed min-h-[40px]">
                    {localizedDesc}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px] font-mono uppercase font-semibold">
                        {t('maxAmountLabel')}
                      </span>
                      <span className="font-bold font-mono text-white">
                        {loan.maxAmount}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] font-mono uppercase font-semibold">
                        {t('maxTenureLabel')}
                      </span>
                      <span className="font-bold font-mono text-white">
                        {loan.maxTenure}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <a
                      href={loan.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-zinc-400 hover:text-teal-400 transition-colors"
                    >
                      <span>{t('officialSourceLabel')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      type="button"
                      onClick={() => onAskAiAboutLoan(localizedTitle)}
                      className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                    >
                      {t('ctaAskAi')}
                    </button>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                  <button
                    onClick={() => onSelectEmiLoan(loan.id, loan.interestRateMin)}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-[#161616] hover:bg-white/10 text-zinc-200 text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
                  >
                    <Calculator className="w-3 h-3 text-zinc-400" />
                    <span>{t('calcEmiBtn')}</span>
                  </button>

                  <button
                    onClick={() => onSelectEligibilityLoan(loan.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer"
                    style={{
                      color: palette.accentText,
                      borderColor: `${palette.colorHex}55`,
                      backgroundColor: `${palette.colorHex}1F`,
                    }}
                  >
                    <span>{t('checkEligibilityBtn')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
