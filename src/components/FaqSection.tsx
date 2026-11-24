import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, ChevronDown, ExternalLink, ShieldCheck } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const { t } = useTranslation();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    { q: t('faq1Q'), a: t('faq1A') },
    { q: t('faq2Q'), a: t('faq2A') },
    { q: t('faq3Q'), a: t('faq3A') },
    { q: t('faq4Q'), a: t('faq4A') },
  ];

  const officialSchemes = [
    { name: 'NHFDC Divyangjan', url: 'https://www.nhfdc.nic.in/' },
    { name: 'Stand-Up India', url: 'https://www.standupmitra.in/' },
    { name: 'Vidya Lakshmi', url: 'https://www.vidyalakshmi.co.in/' },
    { name: 'Udyam / CGTMSE', url: 'https://www.udyamimitra.in/' },
  ];

  return (
    <section id="faq-section" className="py-12 sm:py-16 bg-[#000000] border-b border-white/15 scroll-mt-16 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-teal-400 uppercase mb-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t('heroBadge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('faqTitle')}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400">
            {t('faqSubtitle')}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-[#0f0f0f] border border-white/15 overflow-hidden"
                style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)' }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-start flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.03]"
                >
                  <span className="text-sm font-bold text-white">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-teal-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-white/10">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Official Verified Scheme Links */}
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>{t('officialSourceLabel')}:</span>
          </span>
          {officialSchemes.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#0f0f0f] hover:bg-white/10 border border-white/15 text-xs text-teal-300 transition-colors"
            >
              <span>{s.name}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
