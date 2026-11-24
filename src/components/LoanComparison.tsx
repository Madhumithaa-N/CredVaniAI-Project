import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';
import { BANK_COMPARISONS } from '../data/loanData';
import { Scale, X, Sparkles, Clock } from 'lucide-react';

interface LoanComparisonProps {
  currentLanguage?: Language;
  onAskAiToCompare: (banks: string[]) => void;
}

export const LoanComparison: React.FC<LoanComparisonProps> = ({
  onAskAiToCompare,
}) => {
  const { t } = useTranslation();

  const [activeBankType, setActiveBankType] = useState<string>('all');
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>(['sbi', 'hdfc']);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const filteredBanks = BANK_COMPARISONS.filter((item) => {
    if (activeBankType === 'all') return true;
    if (activeBankType === 'public') return item.bankType === 'Public Sector';
    if (activeBankType === 'private') return item.bankType === 'Private Bank';
    if (activeBankType === 'nbfc')
      return item.bankType === 'NBFC' || item.bankType === 'Rural/Govt';
    return true;
  });

  const toggleSelectBank = (id: string) => {
    if (selectedBankIds.includes(id)) {
      setSelectedBankIds(selectedBankIds.filter((bId) => bId !== id));
    } else if (selectedBankIds.length < 3) {
      setSelectedBankIds([...selectedBankIds, id]);
    }
  };

  const selectedBankObjects = BANK_COMPARISONS.filter((b) =>
    selectedBankIds.includes(b.id)
  );

  return (
    <section
      id="compare-section"
      className="py-12 sm:py-16 bg-[#000000] border-b border-white/15 scroll-mt-16 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-teal-400 uppercase mb-1.5">
              <Scale className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('navCompare')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('compareTitle')}
            </h2>
            <p className="mt-1 text-zinc-400 text-xs sm:text-sm max-w-2xl">
              {t('compareSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#0f0f0f] border border-white/15 rounded-xl overflow-x-auto max-w-full">
            {[
              { id: 'all', label: t('filterAll') },
              { id: 'public', label: t('filterPublic') },
              { id: 'private', label: t('filterPrivate') },
              { id: 'nbfc', label: t('filterNbfc') },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveBankType(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                  activeBankType === tab.id
                    ? 'bg-white text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {selectedBankIds.length > 0 && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#0f0f0f] border border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-semibold text-zinc-300">
                ({selectedBankIds.length}/3)
              </span>
              <div className="flex items-center gap-2">
                {selectedBankObjects.map((b) => (
                  <span
                    key={b.id}
                    className="text-xs font-mono font-bold text-white bg-[#1a1a1a] px-2.5 py-1 rounded-md border border-white/15 flex items-center gap-1.5"
                  >
                    {b.bankLogoText}
                    <button
                      onClick={() => toggleSelectBank(b.id)}
                      className="text-zinc-400 hover:text-red-400 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompareModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{t('compareSelected')}</span>
              </button>
              <button
                onClick={() => setSelectedBankIds([])}
                className="px-2 py-1 text-zinc-400 hover:text-white text-xs font-medium cursor-pointer"
              >
                {t('clearSelection')}
              </button>
            </div>
          </div>
        )}

        <div
          className="overflow-x-auto rounded-[16px] border border-white/15 bg-[#0f0f0f]"
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)' }}
        >
          <table className="w-full text-start border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/15 bg-[#161616] text-zinc-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                <th className="py-3.5 px-3 w-10 text-center">✓</th>
                <th className="py-3.5 px-3">{t('bankHeader')}</th>
                <th className="py-3.5 px-3">{t('interestRateHeader')}</th>
                <th className="py-3.5 px-3">{t('cibilReqHeader')}</th>
                <th className="py-3.5 px-3">{t('processingFeeHeader')}</th>
                <th className="py-3.5 px-3">{t('prepaymentHeader')}</th>
                <th className="py-3.5 px-3">{t('approvalHeader')}</th>
                <th className="py-3.5 px-3">{t('verdictHeader')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-zinc-300">
              {filteredBanks.map((item) => {
                const isSelected = selectedBankIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-white/[0.04] transition-colors ${
                      isSelected ? 'bg-white/[0.06]' : ''
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectBank(item.id)}
                        disabled={!isSelected && selectedBankIds.length >= 3}
                        className="w-4 h-4 rounded accent-teal-400 bg-[#181818] border-white/25 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-white">{item.bankName}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {item.bankLogoText} · ★ {item.rating}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-amber-400 text-sm font-mono">
                        {item.interestRateRange}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-medium">
                      <span className="text-emerald-400 font-semibold">
                        {item.minCibil}+
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-zinc-300">
                      {item.processingFee}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-zinc-300">
                      {item.prepaymentCharges}
                    </td>
                    <td className="py-3.5 px-3 text-xs font-medium text-zinc-200">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span>{item.approvalSpeed}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-zinc-400 max-w-xs">
                      <div className="flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                        <span>{item.aiVerdictKey}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {compareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div
              className="bg-[#0f0f0f] border border-white/15 rounded-[16px] max-w-3xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
              style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)' }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-teal-400" />
                  <h3 className="text-lg font-bold text-white">
                    {t('compareModalTitle')}
                  </h3>
                </div>
                <button
                  onClick={() => setCompareModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 my-5">
                {selectedBankObjects.map((bank) => (
                  <div
                    key={bank.id}
                    className="p-4 rounded-xl bg-[#161616] border border-white/15 space-y-2.5"
                  >
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-teal-400">
                        {bank.bankLogoText}
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        {bank.bankName}
                      </h4>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-300 pt-2 border-t border-white/10">
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-mono uppercase">
                          {t('interestRateHeader')}
                        </span>
                        <strong className="text-amber-400 font-mono">
                          {bank.interestRateRange}
                        </strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-mono uppercase">
                          {t('cibilReqHeader')}
                        </span>
                        <span className="font-semibold font-mono text-emerald-400">
                          {bank.minCibil}+
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-mono uppercase">
                          {t('processingFeeHeader')}
                        </span>
                        <span>{bank.processingFee}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-mono uppercase">
                          {t('prepaymentHeader')}
                        </span>
                        <span>{bank.prepaymentCharges}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-mono uppercase">
                          {t('approvalHeader')}
                        </span>
                        <span className="font-mono">{bank.approvalSpeed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/15">
                <button
                  onClick={() => {
                    setCompareModalOpen(false);
                    onAskAiToCompare(selectedBankObjects.map((b) => b.bankName));
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('askAiCompareBtn')}</span>
                </button>
                <button
                  onClick={() => setCompareModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-xs font-medium cursor-pointer"
                >
                  {t('compareModalClose')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
