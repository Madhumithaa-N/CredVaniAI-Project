/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LoanCategory } from './types';
import { AuthLanguageProvider, useAuthLanguage } from './contexts/AuthLanguageContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { UserDashboard } from './components/UserDashboard';
import { VoiceAiAdvisor } from './components/VoiceAiAdvisor';
import { LoanTypeCards } from './components/LoanTypeCards';
import { AiEligibilityGuidance } from './components/AiEligibilityGuidance';
import { LoanComparison } from './components/LoanComparison';
import { EmiCalculator } from './components/EmiCalculator';
import { DocumentChecklist } from './components/DocumentChecklist';
import { ApplicationGuidance } from './components/ApplicationGuidance';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { AuthModal } from './components/AuthModal';

function CredVaniAppShell() {
  const { language, setLanguage } = useAuthLanguage();
  const [externalAiPrompt, setExternalAiPrompt] = useState<string | null>(null);

  const [emiAmount, setEmiAmount] = useState<number>(3500000);
  const [emiRate, setEmiRate] = useState<number>(8.4);
  const [emiTenureYears, setEmiTenureYears] = useState<number>(20);
  const [eligibilityCategory, setEligibilityCategory] = useState<LoanCategory>('home');
  const [documentCategory, setDocumentCategory] = useState<LoanCategory>('home');

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAskAi = (prompt?: string) => {
    if (prompt) {
      setExternalAiPrompt(prompt);
    }
    scrollToSection('ai-advisor');
  };

  const handleSelectEmiFromCard = (loanId: LoanCategory, defaultRate: number) => {
    let suggestedAmount = 3500000;
    let suggestedTenure = 20;

    if (loanId === 'home') {
      suggestedAmount = 4500000;
      suggestedTenure = 25;
    } else if (loanId === 'personal') {
      suggestedAmount = 500000;
      suggestedTenure = 5;
    } else if (loanId === 'vehicle') {
      suggestedAmount = 1200000;
      suggestedTenure = 7;
    } else if (loanId === 'education') {
      suggestedAmount = 2500000;
      suggestedTenure = 10;
    } else if (loanId === 'business') {
      suggestedAmount = 2000000;
      suggestedTenure = 7;
    } else if (loanId === 'agriculture' || loanId === 'disability') {
      suggestedAmount = 300000;
      suggestedTenure = 5;
    } else if (loanId === 'gold') {
      suggestedAmount = 400000;
      suggestedTenure = 2;
    } else if (loanId === 'lap') {
      suggestedAmount = 6000000;
      suggestedTenure = 15;
    } else if (loanId === 'women') {
      suggestedAmount = 1500000;
      suggestedTenure = 7;
    } else if (loanId === 'credit_line') {
      suggestedAmount = 500000;
      suggestedTenure = 3;
    }

    setEmiAmount(suggestedAmount);
    setEmiRate(defaultRate);
    setEmiTenureYears(suggestedTenure);
    scrollToSection('emi-section');
  };

  const handleSelectEligibilityFromCard = (loanId: LoanCategory) => {
    setEligibilityCategory(loanId);
    scrollToSection('eligibility-section');
  };

  const handleNavigateSection = (sectionId: string, payload?: any) => {
    if (payload) {
      if (payload.amount) setEmiAmount(payload.amount);
      if (payload.rate) setEmiRate(payload.rate);
      if (payload.tenure) setEmiTenureYears(payload.tenure);
      if (payload.category) {
        setEligibilityCategory(payload.category);
        setDocumentCategory(payload.category);
      }
    }
    scrollToSection(sectionId);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col selection:bg-white selection:text-black">
      <Navbar
        currentLanguage={language}
        onSelectLanguage={setLanguage}
        onTriggerAskAi={() => handleAskAi()}
        onNavigateSection={scrollToSection}
      />

      <main className="flex-1">
        <Hero
          currentLanguage={language}
          onAskAiClick={() => handleAskAi()}
          onExploreLoansClick={() => scrollToSection('loans-section')}
        />

        {/* Protected User Dashboard (visible when authenticated) */}
        <UserDashboard />

        <VoiceAiAdvisor
          currentLanguage={language}
          onNavigateSection={handleNavigateSection}
          externalTriggerPrompt={externalAiPrompt}
        />

        <LoanTypeCards
          currentLanguage={language}
          onSelectEmiLoan={handleSelectEmiFromCard}
          onSelectEligibilityLoan={handleSelectEligibilityFromCard}
          onAskAiAboutLoan={(title) => handleAskAi(title)}
        />

        <AiEligibilityGuidance
          currentLanguage={language}
          preSelectedLoanCategory={eligibilityCategory}
          onNavigateToEmi={(amount, tenure) => {
            setEmiAmount(amount);
            setEmiTenureYears(tenure);
            scrollToSection('emi-section');
          }}
          onAskAiWithContext={handleAskAi}
        />

        <LoanComparison
          currentLanguage={language}
          onAskAiToCompare={(banks) => handleAskAi(banks.join(' vs '))}
        />

        <EmiCalculator
          currentLanguage={language}
          presetAmount={emiAmount}
          presetRate={emiRate}
          presetTenureYears={emiTenureYears}
          onAskAiLoanQuestion={handleAskAi}
        />

        <DocumentChecklist
          currentLanguage={language}
          preSelectedCategory={documentCategory}
          onAskAiDocQuestion={handleAskAi}
        />

        <ApplicationGuidance
          currentLanguage={language}
          onAskAiGuidance={handleAskAi}
        />

        <FaqSection />
      </main>

      <Footer
        currentLanguage={language}
        onSelectLanguage={setLanguage}
        onNavigateSection={scrollToSection}
      />

      <LanguageSelectorModal />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthLanguageProvider>
      <CredVaniAppShell />
    </AuthLanguageProvider>
  );
}
