import React from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';
import { CardCarousel3D } from './CardCarousel3D';
import { Bot, ArrowRight, ShieldCheck, Scale, Lock } from 'lucide-react';

interface HeroProps {
  currentLanguage?: Language;
  onAskAiClick: () => void;
  onExploreLoansClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onAskAiClick,
  onExploreLoansClick,
}) => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-[#000000] pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-white/15 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          {/* Left Column: High-Contrast Obsidian Editorial Copy & CTAs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-teal-400 uppercase">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>{t('heroBadge')}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-[1.22]">
              <span>{t('heroHeadlinePart1')} </span>
              <span className="text-teal-400">{t('heroHeadlinePart2')}</span>{' '}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-teal-300 font-black">
                  {t('heroHeadlinePart3')}
                </span>
                <span className="absolute -bottom-1 inset-x-0 w-full h-[2px] bg-gradient-to-r from-teal-400 via-blue-400 to-white/60 rounded-full" />
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl font-normal">
              {t('heroSubtext')}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
              <button
                onClick={onAskAiClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white hover:bg-zinc-200 active:scale-95 text-black font-bold text-sm sm:text-base transition-all cursor-pointer group"
              >
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                <span>{t('ctaAskAi')}</span>
                <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onExploreLoansClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[#0f0f0f] hover:bg-white/10 text-white font-semibold text-sm sm:text-base border border-white/15 hover:border-white/30 transition-all cursor-pointer"
                style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)' }}
              >
                <Scale className="w-4 h-4 text-teal-400" />
                <span>{t('ctaExploreLoans')}</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs text-zinc-400 sm:ms-1 font-mono">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('zeroCibilNote')}</span>
              </div>
            </div>

            {/* 4 Trust Metrics Strip */}
            <div className="pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-5">
              <div>
                <div className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight flex items-baseline gap-1.5">
                  <span>{t('heroStat1Value')}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                  {t('heroStat1Label')}
                </div>
              </div>

              <div>
                <div className="text-lg sm:text-xl font-bold font-mono text-teal-400 tracking-tight">
                  {t('heroStat2Value')}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                  {t('heroStat2Label')}
                </div>
              </div>

              <div>
                <div className="text-lg sm:text-xl font-bold font-mono text-amber-400 tracking-tight">
                  {t('heroStat3Value')}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                  {t('heroStat3Label')}
                </div>
              </div>

              <div>
                <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 tracking-tight">
                  {t('heroStat4Value')}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                  {t('heroStat4Label')}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 60fps Volumetric 3D Card Cylinder Carousel (Keep LTR for 3D geometry) */}
          <div className="lg:col-span-6 relative" dir="ltr">
            <CardCarousel3D />
          </div>
        </div>
      </div>
    </section>
  );
};
