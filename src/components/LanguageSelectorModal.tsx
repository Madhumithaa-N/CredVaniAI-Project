import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Search, Check, Sparkles, X, Compass } from 'lucide-react';
import { useAuthLanguage } from '../contexts/AuthLanguageContext';
import { Language } from '../types';
import { resources } from '../i18n';

export const LanguageSelectorModal: React.FC = () => {
  const { t } = useTranslation();
  const {
    language,
    supportedLanguages,
    languageModalOpen,
    setLanguage,
    closeLanguageModal,
  } = useAuthLanguage();

  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (languageModalOpen) {
      setSelectedLang(language);
      setSearchQuery('');
    }
  }, [languageModalOpen, language]);

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return supportedLanguages;
    return supportedLanguages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [searchQuery, supportedLanguages]);

  if (!languageModalOpen) return null;

  const previewTr = resources[selectedLang]?.translation || resources.en.translation;
  const isRtlPreview = selectedLang === 'ur';

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await setLanguage(selectedLang);
      closeLanguageModal();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-modal-title"
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-[16px] bg-[#0f0f0f] border border-white/15 p-5 sm:p-7 text-white shadow-2xl"
        style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 25px 60px rgba(0,0,0,0.9)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#161616] border border-white/15 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 id="lang-modal-title" className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {t('langModalTitle')}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                {t('langModalSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeLanguageModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label={t('compareModalClose')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('langSearchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />
        </div>

        {/* 14-Language Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {filteredLanguages.map((langOpt) => {
            const isSelected = langOpt.code === selectedLang;
            return (
              <button
                key={langOpt.code}
                type="button"
                onClick={() => setSelectedLang(langOpt.code)}
                className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[76px] ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-[#161616] text-zinc-200 border-white/15 hover:border-teal-400/50 hover:bg-[#1b1b1b]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="text-xs font-mono uppercase opacity-70">{langOpt.code}</span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-600 text-white">
                      <Check className="w-2.5 h-2.5" />
                      <span>{t('langSelectedBadge')}</span>
                    </span>
                  )}
                  {!isSelected && langOpt.code === 'kn' && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-400/30">
                      {t('langPriorityTag')}
                    </span>
                  )}
                </div>

                <div className="mt-1.5" dir={langOpt.isRtl ? 'rtl' : 'ltr'}>
                  <div className="text-sm font-bold leading-snug">{langOpt.nativeName}</div>
                  <div className={`text-[11px] ${isSelected ? 'text-zinc-700' : 'text-zinc-400'}`}>
                    {langOpt.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Translated Preview Card */}
        <div
          dir={isRtlPreview ? 'rtl' : 'ltr'}
          className="mt-5 p-4 rounded-xl bg-[#0a0a0a] border border-white/15 space-y-2.5"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider text-teal-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{previewTr.langPreviewTitle}</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              {selectedLang.toUpperCase()} {isRtlPreview ? '· RTL' : '· LTR'}
            </span>
          </div>

          <div className="text-sm font-bold text-white">
            {previewTr.heroHeadlinePart1} {previewTr.heroHeadlinePart2} {previewTr.heroHeadlinePart3}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[
              previewTr.langPreviewExplore,
              previewTr.langPreviewEligibility,
              previewTr.langPreviewEmi,
              previewTr.langPreviewApply,
            ].map((phrase, idx) => (
              <div
                key={idx}
                className="px-2.5 py-2 rounded-lg bg-[#161616] border border-white/10 text-xs font-medium text-zinc-200 flex items-center gap-1.5"
              >
                <Compass className="w-3 h-3 text-teal-400 shrink-0" />
                <span className="truncate">{phrase}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-400">{t('langChangeHint')}</p>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-95 text-black font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            {previewTr.langSaveContinue}
          </button>
        </div>
      </div>
    </div>
  );
};
