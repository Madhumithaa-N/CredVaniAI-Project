import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  ShieldCheck,
  AlertCircle,
  Bookmark,
  MessageSquare,
  LogOut,
  CheckCircle2,
  Globe,
  Save,
} from 'lucide-react';
import { useAuthLanguage } from '../contexts/AuthLanguageContext';
import { Language } from '../types';
import {
  ChatConversationItem,
  LoanPreferenceItem,
  getChatConversations,
  getLoanPreferences,
  saveLoanPreference,
  updateMe,
} from '../services/api';

export const UserDashboard: React.FC = () => {
  const { t } = useTranslation();
  const {
    user,
    language,
    supportedLanguages,
    setLanguage,
    setUserState,
    openAuthModal,
    signOut,
  } = useAuthLanguage();

  const [activeTab, setActiveTab] = useState<'profile' | 'prefs' | 'chats'>('profile');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<string>('');
  const [occupation, setOccupation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [employmentType, setEmploymentType] = useState('salaried');
  const [location, setLocation] = useState('');
  const [userCategory, setUserCategory] = useState('general');
  const [savingProfile, setSavingProfile] = useState(false);

  // Preferences & Chats
  const [preferences, setPreferences] = useState<LoanPreferenceItem[]>([]);
  const [conversations, setConversations] = useState<ChatConversationItem[]>([]);
  const [prefCategory, setPrefCategory] = useState('home');
  const [prefAmount, setPrefAmount] = useState('2500000');
  const [prefTenure, setPrefTenure] = useState('15');
  const [prefPurpose, setPrefPurpose] = useState('');
  const [savingPref, setSavingPref] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name || '');
    setAge(user.profile?.age ? String(user.profile.age) : '');
    setOccupation(user.profile?.occupation || '');
    setMonthlyIncome(user.profile?.monthly_income ? String(user.profile.monthly_income) : '');
    setEmploymentType(user.profile?.employment_type || 'salaried');
    setLocation(user.profile?.location || '');
    setUserCategory(user.profile?.user_category || 'general');

    getLoanPreferences().then(setPreferences).catch(() => {});
    getChatConversations().then(setConversations).catch(() => {});
  }, [user]);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setStatusMessage(null);
    try {
      const updated = await updateMe({
        full_name: fullName.trim() || user.full_name,
        age: age ? Number(age) : null,
        occupation: occupation.trim() || null,
        monthly_income: monthlyIncome ? Number(monthlyIncome) : null,
        employment_type: employmentType,
        location: location.trim() || null,
        user_category: userCategory,
      });
      setUserState(updated);
      setStatusMessage(t('dashProfileSaved'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreference = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPref(true);
    setStatusMessage(null);
    try {
      const created = await saveLoanPreference({
        loan_category: prefCategory,
        requested_amount: Number(prefAmount) || 500000,
        loan_purpose: prefPurpose.trim() || prefCategory,
        preferred_tenure: Number(prefTenure) || 5,
      });
      setPreferences((prev) => [created, ...prev]);
      setPrefPurpose('');
      setStatusMessage(t('dashPrefSaved'));
    } finally {
      setSavingPref(false);
    }
  };

  const handleLanguageChange = async (nextLang: Language) => {
    await setLanguage(nextLang);
    setStatusMessage(t('dashLangSaved'));
  };

  return (
    <section
      id="dashboard-section"
      className="py-10 sm:py-14 bg-[#000000] border-b border-white/15 scroll-mt-16 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-[16px] bg-[#0f0f0f] border border-white/15 p-5 sm:p-7"
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)' }}
        >
          {/* Dashboard Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#161616] border border-white/15 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-extrabold text-white tracking-tight">
                    {t('dashTitle')}
                  </h2>
                  {user.is_verified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{t('dashVerified')}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAuthModal('otp')}
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500/25 cursor-pointer"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>{t('dashUnverified')} · {t('dashVerifyNow')}</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {user.full_name} · {user.email} · {user.mobile_number}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-[#161616] border border-white/15 rounded-xl px-3 py-1.5 text-xs">
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                  aria-label={t('authPreferredLangLabel')}
                >
                  {supportedLanguages.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#0f0f0f]">
                      {l.nativeName} ({l.name})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161616] hover:bg-red-500/20 border border-white/15 hover:border-red-400/40 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>{t('navLogout')}</span>
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'profile'
                  ? 'bg-white text-black'
                  : 'bg-[#161616] text-zinc-300 border border-white/10 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t('dashProfileTab')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('prefs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'prefs'
                  ? 'bg-white text-black'
                  : 'bg-[#161616] text-zinc-300 border border-white/10 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{t('dashPrefsTab')} ({preferences.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'chats'
                  ? 'bg-white text-black'
                  : 'bg-[#161616] text-zinc-300 border border-white/10 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t('dashChatsTab')} ({conversations.length})</span>
            </button>
          </div>

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t('authFullNameLabel')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060606] border border-white/15 text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t('dashAgeLabel')}
                </label>
                <input
                  type="number"
                  min={18}
                  max={90}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060606] border border-white/15 text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t('dashOccupationLabel')}
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060606] border border-white/15 text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t('monthlyIncome')} (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060606] border border-white/15 text-sm font-mono text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t('selectEmploymentLabel')}
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060606] border border-white/15 text-sm text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="salaried">{t('salaried')}</option>
                  <option value="self_employed">{t('selfEmployed')}</option>
                  <option value="business">{t('businessOwner')}</option>
                  <option value="freelancer">{t('freelancer')}</option>
                  <option value="gov_psu">{t('govPsu')}</option>
                  <option value="farmer">{t('farmer')}</option>
                  <option value="student">{t('student')}</option>
                  <option value="retired">{t('retired')}</option>
                  <option value="homemaker">{t('homemaker')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t('dashLocationLabel')}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060606] border border-white/15 text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t('dashUserCategoryLabel')}
                </label>
                <select
                  value={userCategory}
                  onChange={(e) => setUserCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#060606] border border-white/15 text-sm text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="general">{t('dashCatGeneral')}</option>
                  <option value="women">{t('dashCatWomen')}</option>
                  <option value="disability">{t('dashCatDisability')}</option>
                  <option value="farmer">{t('dashCatFarmer')}</option>
                  <option value="student">{t('dashCatStudent')}</option>
                  <option value="senior">{t('dashCatSenior')}</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('dashSaveProfileBtn')}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: LOAN PREFERENCES */}
          {activeTab === 'prefs' && (
            <div className="mt-5 space-y-5">
              <form onSubmit={handleSavePreference} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#161616] p-4 rounded-xl border border-white/10">
                <select
                  value={prefCategory}
                  onChange={(e) => setPrefCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[#060606] border border-white/15 text-xs text-white"
                >
                  <option value="home">{t('loanHomeTitle')}</option>
                  <option value="personal">{t('loanPersonalTitle')}</option>
                  <option value="education">{t('loanEducationTitle')}</option>
                  <option value="vehicle">{t('loanVehicleTitle')}</option>
                  <option value="business">{t('loanBusinessTitle')}</option>
                  <option value="gold">{t('loanGoldTitle')}</option>
                  <option value="lap">{t('loanLapTitle')}</option>
                  <option value="credit_line">{t('loanCreditLineTitle')}</option>
                  <option value="women">{t('loanWomenTitle')}</option>
                  <option value="disability">{t('loanDisabilityTitle')}</option>
                  <option value="agriculture">{t('loanAgriTitle')}</option>
                </select>

                <input
                  type="number"
                  min={10000}
                  value={prefAmount}
                  onChange={(e) => setPrefAmount(e.target.value)}
                  placeholder={t('loanAmountLabel')}
                  className="px-3 py-2 rounded-lg bg-[#060606] border border-white/15 text-xs font-mono text-white"
                />

                <input
                  type="number"
                  min={1}
                  max={30}
                  value={prefTenure}
                  onChange={(e) => setPrefTenure(e.target.value)}
                  placeholder={`${t('desiredTenure')} (${t('years')})`}
                  className="px-3 py-2 rounded-lg bg-[#060606] border border-white/15 text-xs font-mono text-white"
                />

                <button
                  type="submit"
                  disabled={savingPref}
                  className="px-3 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs cursor-pointer"
                >
                  {t('dashSavePrefBtn')}
                </button>
              </form>

              {preferences.length === 0 ? (
                <p className="text-xs text-zinc-400">{t('dashNoPrefs')}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {preferences.map((pref) => (
                    <div key={pref.preference_id} className="p-3.5 rounded-xl bg-[#161616] border border-white/10 text-xs space-y-1">
                      <div className="font-bold text-teal-400 uppercase font-mono">{pref.loan_category}</div>
                      <div className="text-base font-bold text-white font-mono">
                        ₹{pref.requested_amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-zinc-400">
                        {pref.preferred_tenure} {t('years')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED AI CHATS */}
          {activeTab === 'chats' && (
            <div className="mt-5 space-y-3">
              {conversations.length === 0 ? (
                <p className="text-xs text-zinc-400">{t('dashNoChats')}</p>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.conversation_id} className="p-4 rounded-xl bg-[#161616] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span className="text-teal-400 font-bold uppercase">{conv.language}</span>
                      <span>{new Date(conv.created_at).toLocaleString()}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {conv.messages.slice(-4).map((m) => (
                        <div key={m.message_id} className={m.sender === 'user' ? 'text-white font-semibold' : 'text-zinc-300'}>
                          <span className="text-zinc-500 mr-1.5 uppercase font-mono">[{m.sender}]</span>
                          <span>{m.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
