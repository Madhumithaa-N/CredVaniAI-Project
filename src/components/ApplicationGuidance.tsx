import React from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';
import { APPLICATION_ROADMAP_STEPS } from '../data/loanData';
import {
  Compass,
  AlertOctagon,
  Sparkles,
  ShieldCheck,
  FileText,
  Search,
  Banknote,
  CheckCircle2,
} from 'lucide-react';

interface ApplicationGuidanceProps {
  currentLanguage?: Language;
  onAskAiGuidance: (topic: string) => void;
}

export const ApplicationGuidance: React.FC<ApplicationGuidanceProps> = ({
  onAskAiGuidance,
}) => {
  const { t } = useTranslation();

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4 text-teal-400" />;
      case 'FileText':
        return <FileText className="w-4 h-4 text-teal-400" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-4 h-4 text-teal-400" />;
      case 'Search':
        return <Search className="w-4 h-4 text-teal-400" />;
      case 'Banknote':
        return <Banknote className="w-4 h-4 text-teal-400" />;
      default:
        return <Compass className="w-4 h-4 text-teal-400" />;
    }
  };

  const pitfalls = [
    {
      title: 'Multiple Simultaneous Hard Credit Inquiries',
      risk: 'Triggers multiple bureau pulls dropping CIBIL score.',
      solution: 'Run CredVani AI soft pre-check first, then apply to 1–2 lenders.',
    },
    {
      title: 'High Credit Card Utilization (>30%)',
      risk: 'Signals high credit dependence to bank risk engines.',
      solution: 'Pay balances below 30% one billing cycle before applying.',
    },
    {
      title: 'Unexplained Cash Deposits in Statements',
      risk: 'Underwriters flag untraceable cash inflows.',
      solution: 'Maintain a clean 6-month digital banking trail.',
    },
    {
      title: 'Mismatched KYC Spelling Across Documents',
      risk: 'Automatic CERSAI / PAN-Aadhaar node rejection.',
      solution: 'Ensure identical character-for-character spelling across PAN, Aadhaar & Bank.',
    },
  ];

  return (
    <section
      id="roadmap-section"
      className="py-12 sm:py-16 bg-[#000000] border-b border-white/15 scroll-mt-16 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-teal-400 uppercase mb-1.5">
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>{t('navRoadmap')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('roadmapTitle')}
          </h2>
          <p className="mt-1 text-zinc-400 text-xs sm:text-sm">{t('roadmapSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 relative">
          {APPLICATION_ROADMAP_STEPS.map((step) => (
            <div
              key={step.step}
              className="relative p-4 rounded-xl bg-[#0f0f0f] border border-white/15 flex flex-col justify-between hover:border-teal-400/50 hover:bg-[#141414] transition-all"
              style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)' }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-400/30 flex items-center justify-center">
                    {getStepIcon(step.icon)}
                  </div>
                  <span className="text-[11px] font-mono font-bold text-zinc-500">
                    0{step.step}
                  </span>
                </div>

                <div className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider mb-1">
                  {step.timeline}
                </div>

                <h3 className="text-sm font-bold text-white mb-1.5 leading-snug">
                  {step.title}
                </h3>

                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  {step.action}
                </p>
              </div>

              <div className="pt-2.5 border-t border-white/10 text-[11px] text-zinc-300 bg-[#161616] p-2.5 rounded-lg border border-white/10">
                <strong className="text-amber-400 block mb-0.5 font-semibold">
                  {t('aiTipTitle')}:
                </strong>
                <span>{step.tip}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-10 border-t border-white/15">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-amber-400 uppercase mb-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('eligibilityScore')}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-6">
            {t('rejectionPitfallsTitle')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pitfalls.map((pitfall, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-[#0f0f0f] border border-white/15 space-y-2"
                style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)' }}
              >
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span>{pitfall.title}</span>
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <span className="text-red-400 font-semibold">{t('riskLabel')}: </span>
                  {pitfall.risk}
                </p>
                <p className="text-xs text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg mt-1.5">
                  <strong className="font-semibold text-emerald-400">{t('fixLabel')}: </strong>
                  {pitfall.solution}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-7 text-center">
            <button
              type="button"
              onClick={() => onAskAiGuidance(t('roadmapSubtitle'))}
              className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-teal-300 bg-[#0f0f0f] border border-white/20 hover:border-teal-400/60 px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('ctaAskAi')} →</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
