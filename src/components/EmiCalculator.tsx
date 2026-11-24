import React, { useState, useMemo, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';
import { Calculator, TrendingDown, Calendar, Zap, Sparkles } from 'lucide-react';

interface EmiCalculatorProps {
  currentLanguage?: Language;
  presetAmount?: number;
  presetRate?: number;
  presetTenureYears?: number;
  onAskAiLoanQuestion: (question: string) => void;
}

export const EmiCalculator: React.FC<EmiCalculatorProps> = ({
  presetAmount = 3500000,
  presetRate = 8.5,
  presetTenureYears = 20,
  onAskAiLoanQuestion,
}) => {
  const { t } = useTranslation();
  const loanAmountInputId = useId();
  const interestRateInputId = useId();
  const tenureInputId = useId();

  const [loanAmount, setLoanAmount] = useState<number>(presetAmount);
  const [interestRate, setInterestRate] = useState<number>(presetRate);
  const [tenureYears, setTenureYears] = useState<number>(presetTenureYears);
  const [tenureType, setTenureType] = useState<'years' | 'months'>('years');
  const [extraPrepaymentMonthly, setExtraPrepaymentMonthly] = useState<number>(2500);

  React.useEffect(() => {
    if (presetAmount) setLoanAmount(presetAmount);
    if (presetRate) setInterestRate(presetRate);
    if (presetTenureYears) setTenureYears(presetTenureYears);
  }, [presetAmount, presetRate, presetTenureYears]);

  const calculation = useMemo(() => {
    const totalMonths = tenureType === 'years' ? tenureYears * 12 : tenureYears;
    const monthlyRate = interestRate / (12 * 100);

    if (loanAmount <= 0 || totalMonths <= 0) {
      return {
        monthlyEmi: 0,
        totalInterest: 0,
        totalPayable: 0,
        principalPct: 100,
        interestPct: 0,
        savedInterestWithPrepayment: 0,
        savedMonthsWithPrepayment: 0,
      };
    }

    const emi = Math.round(
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
    );

    const totalPayable = emi * totalMonths;
    const totalInterest = Math.max(0, totalPayable - loanAmount);
    const principalPct = Math.round((loanAmount / totalPayable) * 100);
    const interestPct = 100 - principalPct;

    let balance = loanAmount;
    let monthsWithPrepay = 0;
    let totalInterestWithPrepay = 0;
    const acceleratedEmi = emi + extraPrepaymentMonthly;

    while (balance > 0 && monthsWithPrepay < 600) {
      const monthInterest = balance * monthlyRate;
      totalInterestWithPrepay += monthInterest;
      const principalPaid = acceleratedEmi - monthInterest;
      balance -= principalPaid;
      monthsWithPrepay++;
    }

    const savedMonths = Math.max(0, totalMonths - monthsWithPrepay);
    const savedInterest = Math.max(0, totalInterest - Math.round(totalInterestWithPrepay));

    return {
      monthlyEmi: emi,
      totalInterest,
      totalPayable,
      principalPct,
      interestPct,
      savedInterestWithPrepayment: savedInterest,
      savedMonthsWithPrepayment: savedMonths,
    };
  }, [loanAmount, interestRate, tenureYears, tenureType, extraPrepaymentMonthly]);

  const amortizationPreview = useMemo(() => {
    const schedule: {
      year: number;
      openingBalance: number;
      principalPaid: number;
      interestPaid: number;
      closingBalance: number;
    }[] = [];
    const monthlyRate = interestRate / (12 * 100);
    let balance = loanAmount;
    const emi = calculation.monthlyEmi;

    for (let yr = 1; yr <= Math.min(5, tenureYears); yr++) {
      let yrPrincipal = 0;
      let yrInterest = 0;
      const opening = balance;

      for (let m = 1; m <= 12; m++) {
        if (balance <= 0) break;
        const interest = balance * monthlyRate;
        const principal = emi - interest;
        yrInterest += interest;
        yrPrincipal += principal;
        balance = Math.max(0, balance - principal);
      }

      schedule.push({
        year: yr,
        openingBalance: Math.round(opening),
        principalPaid: Math.round(yrPrincipal),
        interestPaid: Math.round(yrInterest),
        closingBalance: Math.round(balance),
      });
    }

    return schedule;
  }, [loanAmount, interestRate, tenureYears, calculation.monthlyEmi]);

  const formatIndianCurrency = (num: number) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <section
      id="emi-section"
      className="py-12 sm:py-16 bg-[#000000] border-b border-white/15 scroll-mt-16 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-teal-400 uppercase mb-1.5">
            <Calculator className="w-3.5 h-3.5 text-teal-400" />
            <span>{t('navEmi')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('emiTitle')}
          </h2>
          <p className="mt-1 text-zinc-400 text-xs sm:text-sm">{t('emiSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sliders & Controls */}
          <div
            className="lg:col-span-7 bg-[#0f0f0f] border border-white/15 rounded-[16px] p-5 sm:p-7 space-y-5"
            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={loanAmountInputId} className="text-xs sm:text-sm font-semibold text-zinc-300">
                  {t('loanAmountLabel')}
                </label>
                <div className="text-base font-bold text-teal-400 font-mono">
                  {formatIndianCurrency(loanAmount)}
                </div>
              </div>
              <input
                id={loanAmountInputId}
                type="range"
                min="50000"
                max="20000000"
                step="50000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full h-2 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={interestRateInputId} className="text-xs sm:text-sm font-semibold text-zinc-300">
                  {t('interestRateSliderLabel')}
                </label>
                <div className="text-base font-bold text-amber-400 font-mono">
                  {interestRate}%{' '}
                  <span className="text-xs font-normal text-zinc-500">{t('pAnn')}</span>
                </div>
              </div>
              <input
                id={interestRateInputId}
                type="range"
                min="4.0"
                max="20.0"
                step="0.05"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-2 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={tenureInputId} className="text-xs sm:text-sm font-semibold text-zinc-300">
                  {t('tenureSliderLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <div className="text-base font-bold text-white font-mono">
                    {tenureYears} {tenureType === 'years' ? t('years') : t('months')}
                  </div>
                  <div className="flex items-center p-0.5 bg-[#181818] border border-white/15 rounded-lg text-xs">
                    <button
                      onClick={() => setTenureType('years')}
                      className={`px-2 py-0.5 rounded cursor-pointer font-mono ${
                        tenureType === 'years' ? 'bg-white text-black font-bold' : 'text-zinc-400'
                      }`}
                    >
                      {t('years')}
                    </button>
                    <button
                      onClick={() => setTenureType('months')}
                      className={`px-2 py-0.5 rounded cursor-pointer font-mono ${
                        tenureType === 'months' ? 'bg-white text-black font-bold' : 'text-zinc-400'
                      }`}
                    >
                      {t('months')}
                    </button>
                  </div>
                </div>
              </div>
              <input
                id={tenureInputId}
                type="range"
                min={tenureType === 'years' ? 1 : 6}
                max={tenureType === 'years' ? 30 : 360}
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full h-2 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>

            {/* Prepayment Booster */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">{t('prepaymentTip')}</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  +₹{extraPrepaymentMonthly.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25000"
                step="500"
                value={extraPrepaymentMonthly}
                onChange={(e) => setExtraPrepaymentMonthly(Number(e.target.value))}
                className="w-full h-1.5 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              {extraPrepaymentMonthly > 0 && calculation.savedMonthsWithPrepayment > 0 && (
                <div className="mt-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {(calculation.savedMonthsWithPrepayment / 12).toFixed(1)} {t('years')}
                    </span>
                  </div>
                  <strong className="font-mono text-emerald-400">
                    -₹{(calculation.savedInterestWithPrepayment / 100000).toFixed(2)} L
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Results Card */}
          <div
            className="lg:col-span-5 bg-[#0f0f0f] border border-white/15 rounded-[16px] p-5 sm:p-7 space-y-5"
            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)' }}
          >
            <div>
              <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                {t('monthlyEmiLabel')}
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-teal-400 font-mono tracking-tight mt-0.5">
                ₹{calculation.monthlyEmi.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
              <div className="bg-[#161616] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] font-mono text-zinc-500 block uppercase font-semibold">
                  {t('principalAmountLabel')}
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  {formatIndianCurrency(loanAmount)}
                </span>
                <span className="text-[10px] font-mono text-teal-400 font-semibold block mt-0.5">
                  {calculation.principalPct}%
                </span>
              </div>

              <div className="bg-[#161616] p-3 rounded-xl border border-white/10">
                <span className="text-[10px] font-mono text-zinc-500 block uppercase font-semibold">
                  {t('totalInterestLabel')}
                </span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  {formatIndianCurrency(calculation.totalInterest)}
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-semibold block mt-0.5">
                  {calculation.interestPct}%
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#161616] border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 block">{t('totalPayableLabel')}</span>
                <span className="text-base font-bold text-white font-mono">
                  {formatIndianCurrency(calculation.totalPayable)}
                </span>
              </div>
              <div className="text-end text-[11px] font-mono text-zinc-400">
                {tenureYears} {tenureType === 'years' ? t('years') : t('months')}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-zinc-300 mb-1.5">
                {t('principalVsInterest')}
              </div>
              <div className="h-3 w-full rounded-full bg-[#1a1a1a] flex overflow-hidden border border-white/10">
                <div style={{ width: `${calculation.principalPct}%` }} className="bg-teal-400 transition-all duration-300" />
                <div style={{ width: `${calculation.interestPct}%` }} className="bg-amber-400 transition-all duration-300" />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  <span>{t('principalAmountLabel')}: {calculation.principalPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>{t('totalInterestLabel')}: {calculation.interestPct}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                onAskAiLoanQuestion(
                  `${t('loanAmountLabel')}: ₹${(loanAmount / 100000).toFixed(1)}L, ${interestRate}%`
                )
              }
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('ctaAskAi')}</span>
            </button>
          </div>
        </div>

        {/* Amortization Preview */}
        <div
          className="mt-8 p-5 rounded-[16px] bg-[#0f0f0f] border border-white/15"
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>{t('amortizationTitle')}</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-white/15 bg-[#161616] text-zinc-400 text-[10px] uppercase">
                  <th className="py-2.5 px-3">{t('colYear')}</th>
                  <th className="py-2.5 px-3">{t('colOpening')}</th>
                  <th className="py-2.5 px-3 text-teal-400">{t('colPrincipal')}</th>
                  <th className="py-2.5 px-3 text-amber-400">{t('colInterest')}</th>
                  <th className="py-2.5 px-3">{t('colClosing')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-zinc-300">
                {amortizationPreview.map((row) => (
                  <tr key={row.year} className="hover:bg-white/[0.04]">
                    <td className="py-2.5 px-3 font-bold text-white">{row.year}</td>
                    <td className="py-2.5 px-3">₹{row.openingBalance.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-teal-400 font-semibold">
                      ₹{row.principalPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-amber-400 font-semibold">
                      ₹{row.interestPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      ₹{row.closingBalance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
