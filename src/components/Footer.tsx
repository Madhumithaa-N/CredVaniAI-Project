import React from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';
import { useAuthLanguage } from '../contexts/AuthLanguageContext';
import { Sparkles, ShieldCheck, Globe } from 'lucide-react';

interface FooterProps {
  currentLanguage?: Language;
  onSelectLanguage?: (lang: Language) => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateSection }) => {
  const { t } = useTranslation();
  const { language, supportedLanguages, setLanguage } = useAuthLanguage();

  return (
    <footer className="bg-[#000000] border-t border-white/15 text-zinc-400 text-xs py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/15">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#161616] border border-white/20 flex items-center justify-center text-teal-400 font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                {t('brandName')}
              </span>
              <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-400/30">
                {t('heroBadge')}
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-md">
              {t('heroSubtext')}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-teal-400 pt-0.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('zeroCibilNote')}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <div className="font-mono font-bold text-white uppercase tracking-wider text-[11px]">
              {t('ctaExploreLoans')}
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li>
                <button
                  onClick={() => onNavigateSection('loans-section')}
                  className="hover:text-teal-400 transition-colors cursor-pointer"
                >
                  {t('navLoans')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('eligibility-section')}
                  className="hover:text-teal-400 transition-colors cursor-pointer"
                >
                  {t('navEligibility')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('compare-section')}
                  className="hover:text-teal-400 transition-colors cursor-pointer"
                >
                  {t('navCompare')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('emi-section')}
                  className="hover:text-teal-400 transition-colors cursor-pointer"
                >
                  {t('navEmi')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('documents-section')}
                  className="hover:text-teal-400 transition-colors cursor-pointer"
                >
                  {t('navDocuments')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('roadmap-section')}
                  className="hover:text-teal-400 transition-colors cursor-pointer"
                >
                  {t('navRoadmap')}
                </button>
              </li>
            </ul>
          </div>

          {/* All 14 Languages Selector */}
          <div className="space-y-2">
            <div className="font-mono font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('navLanguage')} (14)</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {supportedLanguages.map((langOpt) => (
                <button
                  key={langOpt.code}
                  onClick={() => setLanguage(langOpt.code)}
                  className={`text-start flex items-center gap-1 py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                    langOpt.code === language
                      ? 'bg-[#0f0f0f] text-teal-400 border border-white/15 font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-[#0f0f0f]/60 border border-transparent'
                  }`}
                >
                  <span className="truncate">{langOpt.nativeName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer Text */}
        <div className="pt-5 text-[11px] text-zinc-500 leading-relaxed space-y-2">
          <p>{t('footerDisclaimer')}</p>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/15 text-zinc-500 font-mono">
            <div>
              © {new Date().getFullYear()} {t('brandName')}. {t('allRightsReserved')}
            </div>
            <div className="text-teal-400">{t('heroStat2Value')}</div>
          </div>
        </div>
      </div>
    </footer>
  );
};
