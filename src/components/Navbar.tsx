import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';
import { useAuthLanguage } from '../contexts/AuthLanguageContext';
import {
  Sparkles,
  Globe,
  ChevronDown,
  Bot,
  ShieldCheck,
  Menu,
  X,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  Search,
} from 'lucide-react';

interface NavbarProps {
  currentLanguage?: Language;
  onSelectLanguage?: (lang: Language) => void;
  onTriggerAskAi: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onTriggerAskAi,
  onNavigateSection,
}) => {
  const { t } = useTranslation();
  const {
    user,
    language,
    supportedLanguages,
    setLanguage,
    openLanguageModal,
    openAuthModal,
    signOut,
  } = useAuthLanguage();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentLangObj =
    supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  const handleNavClick = (sectionId: string) => {
    onNavigateSection(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#000000]/85 backdrop-blur-xl border-b border-white/15 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Tagline */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div
            className="w-9 h-9 rounded-xl bg-[#0f0f0f] border border-white/15 flex items-center justify-center group-hover:border-white/35 transition-colors"
            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)' }}
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                {t('brandName')}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium hidden xl:block leading-none">
              {t('brandTagline')}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs font-medium text-zinc-400">
          <button
            onClick={() => handleNavClick('loans-section')}
            className="hover:text-white transition-colors cursor-pointer py-1 whitespace-nowrap"
          >
            {t('navLoans')}
          </button>
          <button
            onClick={() => handleNavClick('eligibility-section')}
            className="hover:text-white transition-colors cursor-pointer py-1 whitespace-nowrap"
          >
            {t('navEligibility')}
          </button>
          <button
            onClick={() => handleNavClick('compare-section')}
            className="hover:text-white transition-colors cursor-pointer py-1 whitespace-nowrap"
          >
            {t('navCompare')}
          </button>
          <button
            onClick={() => handleNavClick('emi-section')}
            className="hover:text-white transition-colors cursor-pointer py-1 whitespace-nowrap"
          >
            {t('navEmi')}
          </button>
          <button
            onClick={() => handleNavClick('documents-section')}
            className="hover:text-white transition-colors cursor-pointer py-1 whitespace-nowrap"
          >
            {t('navDocuments')}
          </button>
          <button
            onClick={() => handleNavClick('roadmap-section')}
            className="hover:text-white transition-colors cursor-pointer py-1 whitespace-nowrap"
          >
            {t('navRoadmap')}
          </button>
          {user && (
            <button
              onClick={() => handleNavClick('dashboard-section')}
              className="text-teal-400 hover:text-teal-300 font-semibold transition-colors cursor-pointer py-1 whitespace-nowrap"
            >
              {t('navDashboard')}
            </button>
          )}
        </nav>

        {/* Right Action Island */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Prominent 14-Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0f0f0f] hover:bg-white/10 border border-white/15 text-white text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)' }}
              aria-label={t('navLanguage')}
              aria-expanded={langMenuOpen}
            >
              <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="text-white">{currentLangObj.nativeName}</span>
              <ChevronDown
                className={`w-3 h-3 text-zinc-400 transition-transform ${
                  langMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {langMenuOpen && (
              <div
                className="absolute end-0 mt-1.5 w-64 rounded-xl bg-[#0f0f0f] border border-white/15 shadow-2xl py-1 z-50 backdrop-blur-xl max-h-[75vh] overflow-y-auto"
                style={{
                  boxShadow:
                    'inset 0 1px 1px rgba(255,255,255,0.12), 0 20px 50px rgba(0,0,0,0.9)',
                }}
                role="menu"
              >
                <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                    {t('navLanguage')} (14)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLangMenuOpen(false);
                      openLanguageModal();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
                  >
                    <Search className="w-3 h-3" />
                    <span>{t('langPreviewTitle')}</span>
                  </button>
                </div>

                {supportedLanguages.map((langOpt) => {
                  const isSelected = langOpt.code === language;
                  return (
                    <button
                      key={langOpt.code}
                      onClick={() => {
                        setLanguage(langOpt.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-start text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-white/10 text-white font-bold border-s-2 border-teal-400'
                          : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                      }`}
                      role="menuitem"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 w-6">
                          {langOpt.code}
                        </span>
                        <div className="truncate">
                          <div className="leading-tight font-medium">
                            {langOpt.nativeName}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {langOpt.name}
                          </div>
                        </div>
                      </div>
                      {langOpt.code === 'kn' && !isSelected && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300">
                          {t('langPriorityTag')}
                        </span>
                      )}
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Auth Buttons */}
          {user ? (
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleNavClick('dashboard-section')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0f0f0f] hover:bg-white/10 border border-white/15 text-xs font-semibold text-teal-300 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="max-w-[90px] truncate">{user.full_name}</span>
              </button>
              <button
                type="button"
                onClick={signOut}
                className="p-1.5 rounded-lg bg-[#0f0f0f] hover:bg-red-500/20 border border-white/15 text-zinc-400 hover:text-red-300 cursor-pointer"
                title={t('navLogout')}
                aria-label={t('navLogout')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0f0f0f] hover:bg-white/10 border border-white/15 text-xs font-semibold text-white cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-teal-400" />
                <span>{t('navLogin')}</span>
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-xs font-semibold text-teal-300 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('navSignup')}</span>
              </button>
            </div>
          )}

          {/* Primary CTA: "Ask AI" */}
          <button
            onClick={onTriggerAskAi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 active:scale-95 text-black font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-black" />
            <span>{t('ctaAskAi')}</span>
          </button>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a0a0a] border-b border-white/15 px-4 pt-2 pb-5 space-y-2">
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { id: 'loans-section', label: t('navLoans') },
              { id: 'eligibility-section', label: t('navEligibility') },
              { id: 'compare-section', label: t('navCompare') },
              { id: 'emi-section', label: t('navEmi') },
              { id: 'documents-section', label: t('navDocuments') },
              { id: 'roadmap-section', label: t('navRoadmap') },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="text-start px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-zinc-200 text-xs font-semibold hover:bg-white/10"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            {user ? (
              <>
                <button
                  onClick={() => handleNavClick('dashboard-section')}
                  className="flex-1 py-2 rounded-lg bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-bold"
                >
                  {t('navDashboard')}
                </button>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-[#141414] border border-white/15 text-red-300 text-xs font-bold"
                >
                  {t('navLogout')}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="flex-1 py-2 rounded-lg bg-[#141414] border border-white/15 text-white text-xs font-bold"
                >
                  {t('navLogin')}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('signup');
                  }}
                  className="flex-1 py-2 rounded-lg bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-bold"
                >
                  {t('navSignup')}
                </button>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('zeroCibilNote')}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
