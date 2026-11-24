import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Language, LoanCategory, EmploymentType } from '../types';
import { DOCUMENT_CHECKLIST_ITEMS } from '../data/loanData';
import { FileCheck2, CheckSquare, Square, Copy, Check, Sparkles } from 'lucide-react';

interface DocumentChecklistProps {
  currentLanguage?: Language;
  preSelectedCategory?: LoanCategory;
  onAskAiDocQuestion: (query: string) => void;
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  preSelectedCategory = 'home',
  onAskAiDocQuestion,
}) => {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<EmploymentType>('salaried');
  const [selectedLoan, setSelectedLoan] = useState<LoanCategory>(preSelectedCategory);
  const [checkedDocIds, setCheckedDocIds] = useState<string[]>(['kyc_pan', 'kyc_aadhaar']);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (preSelectedCategory) setSelectedLoan(preSelectedCategory);
  }, [preSelectedCategory]);

  const applicableDocs = DOCUMENT_CHECKLIST_ITEMS.filter((doc) => {
    const matchesLoan = doc.applicableLoans.includes(selectedLoan);
    const matchesProfile = doc.mandatoryFor.includes(profile);
    return matchesLoan && matchesProfile;
  });

  const toggleCheck = (id: string) => {
    if (checkedDocIds.includes(id)) {
      setCheckedDocIds(checkedDocIds.filter((dId) => dId !== id));
    } else {
      setCheckedDocIds([...checkedDocIds, id]);
    }
  };

  const handleMarkAll = () => {
    const allIds = applicableDocs.map((d) => d.id);
    setCheckedDocIds(Array.from(new Set([...checkedDocIds, ...allIds])));
  };

  const handleReset = () => {
    setCheckedDocIds([]);
  };

  const completedCount = applicableDocs.filter((d) => checkedDocIds.includes(d.id)).length;
  const progressPct =
    applicableDocs.length > 0
      ? Math.round((completedCount / applicableDocs.length) * 100)
      : 0;

  const handleCopyChecklist = () => {
    const textToCopy =
      `CredVani (${selectedLoan.toUpperCase()} - ${profile.toUpperCase()}):\n` +
      applicableDocs
        .map((d, i) => `${i + 1}. [${checkedDocIds.includes(d.id) ? '✓' : ' '}] ${d.nameKey} - ${d.descKey}`)
        .join('\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const EMPLOYMENT_LIST: { id: EmploymentType; label: string }[] = [
    { id: 'salaried', label: t('salaried') },
    { id: 'self_employed', label: t('selfEmployed') },
    { id: 'business', label: t('businessOwner') },
    { id: 'freelancer', label: t('freelancer') },
    { id: 'gov_psu', label: t('govPsu') },
    { id: 'farmer', label: t('farmer') },
    { id: 'student', label: t('student') },
    { id: 'retired', label: t('retired') },
    { id: 'homemaker', label: t('homemaker') },
    { id: 'other', label: t('other') },
  ];

  const LOAN_TABS: { id: LoanCategory; label: string }[] = [
    { id: 'home', label: t('loanHomeTitle') },
    { id: 'personal', label: t('loanPersonalTitle') },
    { id: 'education', label: t('loanEducationTitle') },
    { id: 'business', label: t('loanBusinessTitle') },
    { id: 'women', label: t('loanWomenTitle') },
    { id: 'disability', label: t('loanDisabilityTitle') },
    { id: 'agriculture', label: t('loanAgriTitle') },
    { id: 'lap', label: t('loanLapTitle') },
  ];

  return (
    <section
      id="documents-section"
      className="py-12 sm:py-16 bg-[#000000] border-b border-white/15 scroll-mt-16 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-teal-400 uppercase mb-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('navDocuments')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('docTitle')}
            </h2>
            <p className="mt-1 text-zinc-400 text-xs sm:text-sm max-w-2xl">
              {t('docSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {LOAN_TABS.map((loan) => (
              <button
                key={loan.id}
                type="button"
                onClick={() => setSelectedLoan(loan.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  selectedLoan === loan.id
                    ? 'bg-white text-black border-white font-bold shadow-sm'
                    : 'bg-[#0f0f0f] text-zinc-400 border-white/15 hover:bg-[#161616] hover:text-white'
                }`}
              >
                {loan.label}
              </button>
            ))}
          </div>
        </div>

        {/* 10 Profile Selector */}
        <div className="mb-6">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2">
            {t('selectEmploymentLabel')}
          </div>
          <div
            className="flex flex-wrap gap-1.5 p-2 bg-[#0f0f0f] border border-white/15 rounded-xl"
            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)' }}
          >
            {EMPLOYMENT_LIST.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => setProfile(emp.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  profile === emp.id
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'bg-[#161616] text-zinc-300 hover:bg-[#222222] hover:text-white border border-white/10'
                }`}
              >
                [ {emp.label} ]
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar & Actions */}
        <div
          className="mb-6 p-4 rounded-xl bg-[#0f0f0f] border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)' }}
        >
          <div className="flex-1 max-w-md">
            <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1.5">
              <span>{t('checklistProgress')}</span>
              <span
                className={`font-mono font-bold ${
                  progressPct === 100 ? 'text-emerald-400' : 'text-teal-400'
                }`}
              >
                {completedCount} / {applicableDocs.length} ({progressPct}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#1a1a1a] border border-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  progressPct === 100 ? 'bg-emerald-400' : 'bg-teal-400'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAll}
              className="px-3 py-1.5 text-xs font-semibold bg-[#161616] hover:bg-[#222222] text-zinc-200 rounded-lg border border-white/15 transition-colors cursor-pointer"
            >
              {t('markAllReady')}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-semibold bg-[#161616] hover:bg-[#222222] text-zinc-200 rounded-lg border border-white/15 transition-colors cursor-pointer"
            >
              {t('resetBtn')}
            </button>
            <button
              type="button"
              onClick={handleCopyChecklist}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-zinc-200 text-black rounded-lg transition-all shadow-sm cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t('copiedText') : t('copyDossier')}</span>
            </button>
          </div>
        </div>

        {/* Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {applicableDocs.map((doc) => {
            const isChecked = checkedDocIds.includes(doc.id);
            return (
              <div
                key={doc.id}
                onClick={() => toggleCheck(doc.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  isChecked
                    ? 'bg-teal-500/10 border-teal-400/40'
                    : 'bg-[#0f0f0f] border-white/15 hover:border-white/30 hover:bg-[#141414]'
                }`}
                style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)' }}
              >
                <div className="mt-0.5 shrink-0">
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-teal-400" />
                  ) : (
                    <Square className="w-5 h-5 text-zinc-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-xs sm:text-sm font-bold truncate ${
                        isChecked ? 'text-teal-200 line-through opacity-75' : 'text-white'
                      }`}
                    >
                      {doc.nameKey}
                    </h4>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#161616] text-zinc-300 border border-white/15 shrink-0">
                      {doc.category}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                    {doc.descKey}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Verify CTA */}
        <div
          className="mt-6 p-4 rounded-xl bg-[#0f0f0f] border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)' }}
        >
          <div className="flex items-center gap-2 text-zinc-300">
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{t('docSubtitle')}</span>
          </div>
          <button
            type="button"
            onClick={() =>
              onAskAiDocQuestion(`${selectedLoan.toUpperCase()} (${profile}): ${t('askAiDocsBtn')}`)
            }
            className="font-bold text-teal-400 hover:text-teal-300 transition-colors cursor-pointer shrink-0"
          >
            {t('askAiDocsBtn')} →
          </button>
        </div>
      </div>
    </section>
  );
};
