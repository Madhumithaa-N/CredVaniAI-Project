import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  User,
  Globe,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { useAuthLanguage } from '../contexts/AuthLanguageContext';
import { Language } from '../types';
import {
  ApiError,
  forgotPassword,
  mapErrorCodeToI18nKey,
  resetPassword,
} from '../services/api';

export const AuthModal: React.FC = () => {
  const { t } = useTranslation();
  const {
    language,
    supportedLanguages,
    authModalOpen,
    authModalTab,
    pendingOtpNotice,
    pendingIdentifier,
    setAuthModalTab,
    closeAuthModal,
    signIn,
    signUp,
    submitOtp,
    setLanguage,
  } = useAuthLanguage();

  // Shared UI states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Login fields
  const [loginIdent, setLoginIdent] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Signup fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [prefLang, setPrefLang] = useState<Language>(language);
  const [consent, setConsent] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);

  // OTP fields
  const [otpIdent, setOtpIdent] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Forgot & Reset fields
  const [forgotIdent, setForgotIdent] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');

  useEffect(() => {
    setPrefLang(language);
  }, [language]);

  useEffect(() => {
    if (pendingIdentifier) {
      setOtpIdent(pendingIdentifier);
    }
    if (pendingOtpNotice) {
      setInfoMsg(pendingOtpNotice);
    }
  }, [pendingIdentifier, pendingOtpNotice]);

  useEffect(() => {
    setErrorMsg(null);
  }, [authModalTab, authModalOpen]);

  if (!authModalOpen) return null;

  const translateApiError = (err: unknown): string => {
    if (err instanceof ApiError) {
      const key = mapErrorCodeToI18nKey(err.code);
      return t(key);
    }
    return t('errNetwork');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    if (!loginIdent.trim() || !loginPassword) {
      setErrorMsg(t('errInvalidCredentials'));
      return;
    }
    setSubmitting(true);
    try {
      await signIn(loginIdent.trim(), loginPassword, rememberMe);
    } catch (err) {
      setErrorMsg(translateApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg(t('errInvalidEmail'));
      return;
    }
    let digits = mobile.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setErrorMsg(t('errInvalidMobile'));
      return;
    }
    if (signupPassword.length < 8 || !/[A-Za-z]/.test(signupPassword) || !/\d/.test(signupPassword)) {
      setErrorMsg(t('errWeakPassword'));
      return;
    }
    if (signupPassword !== confirmPassword) {
      setErrorMsg(t('errPasswordMismatch'));
      return;
    }
    if (!consent) {
      setErrorMsg(t('errConsentRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await signUp({
        full_name: fullName.trim(),
        email: cleanEmail,
        mobile_number: digits,
        password: signupPassword,
        confirm_password: confirmPassword,
        preferred_language: prefLang,
        consent_accepted: consent,
      });
      setInfoMsg(t('msgAccountCreated'));
    } catch (err) {
      setErrorMsg(translateApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await submitOtp(otpIdent.trim(), otpCode.trim());
    } catch (err) {
      setErrorMsg(translateApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      const res = await forgotPassword(forgotIdent.trim());
      if (res.reset_token_preview) {
        setResetToken(res.reset_token_preview);
        setInfoMsg(`${res.message} (${res.reset_token_preview})`);
      } else {
        setInfoMsg(res.message);
      }
      setAuthModalTab('reset');
    } catch (err) {
      setErrorMsg(translateApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setErrorMsg(t('errWeakPassword'));
      return;
    }
    if (newPassword !== newConfirmPassword) {
      setErrorMsg(t('errPasswordMismatch'));
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword({
        token: resetToken.trim(),
        new_password: newPassword,
        confirm_password: newConfirmPassword,
      });
      setInfoMsg(t('msgResetSuccess'));
      setAuthModalTab('login');
    } catch (err) {
      setErrorMsg(translateApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[16px] bg-[#0f0f0f] border border-white/15 p-5 sm:p-7 text-white shadow-2xl"
        style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 25px 60px rgba(0,0,0,0.9)' }}
      >
        {/* Top bar */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#161616] border border-white/15 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                {authModalTab === 'login' && t('authLoginTitle')}
                {authModalTab === 'signup' && t('authSignupTitle')}
                {authModalTab === 'otp' && t('authOtpTitle')}
                {authModalTab === 'forgot' && t('authForgotTitle')}
                {authModalTab === 'reset' && t('authResetTitle')}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {authModalTab === 'login' && t('authLoginSubtitle')}
                {authModalTab === 'signup' && t('authSignupSubtitle')}
                {authModalTab === 'otp' && t('authOtpSubtitle')}
                {authModalTab === 'forgot' && t('authForgotSubtitle')}
                {authModalTab === 'reset' && t('authForgotSubtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label={t('compareModalClose')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Quick Switcher inside Auth */}
        <div className="mt-3 flex items-center justify-between gap-2 bg-[#161616] border border-white/10 rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-300">
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span>{t('authPreferredLangLabel')}</span>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-[#0a0a0a] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal-400"
          >
            {supportedLanguages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName} ({l.name})
              </option>
            ))}
          </select>
        </div>

        {/* Error & Info Banners */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/35 text-xs text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {infoMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="break-all">{infoMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {authModalTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {t('authIdentifierLabel')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginIdent}
                  onChange={(e) => setLoginIdent(e.target.value)}
                  placeholder={t('authIdentifierPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {t('authPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPw ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={t('authPasswordPlaceholder')}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPw(!showLoginPw)}
                  aria-label={showLoginPw ? t('authHidePassword') : t('authShowPassword')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded accent-teal-400"
                />
                <span>{t('authRememberMe')}</span>
              </label>
              <button
                type="button"
                onClick={() => setAuthModalTab('forgot')}
                className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
              >
                {t('authForgotLink')}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {t('authLoginBtn')}
            </button>

            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAuthModalTab('signup')}
                className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
              >
                {t('authCreateAccountLink')}
              </button>
              <button
                type="button"
                onClick={closeAuthModal}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                {t('authGuestContinue')}
              </button>
            </div>
          </form>
        )}

        {/* SIGNUP FORM */}
        {authModalTab === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {t('authFullNameLabel')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('authFullNamePlaceholder')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {t('authEmailLabel')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('authEmailPlaceholder')}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {t('authMobileLabel')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder={t('authMobilePlaceholder')}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {t('authPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    type={showSignupPw ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder={t('authPasswordPlaceholder')}
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPw(!showSignupPw)}
                    aria-label={showSignupPw ? t('authHidePassword') : t('authShowPassword')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showSignupPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {t('authConfirmPasswordLabel')}
                </label>
                <input
                  type={showSignupPw ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('authConfirmPasswordPlaceholder')}
                  className="w-full px-3 py-2 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {t('authPreferredLangLabel')}
              </label>
              <select
                value={prefLang}
                onChange={(e) => setPrefLang(e.target.value as Language)}
                className="w-full px-3 py-2 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm text-white focus:outline-none"
              >
                {supportedLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} — {l.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-start gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded accent-teal-400"
              />
              <span>{t('authConsentText')}</span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {t('authSignupBtn')}
            </button>

            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAuthModalTab('login')}
                className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
              >
                {t('authAlreadyAccountLink')}
              </button>
              <button
                type="button"
                onClick={closeAuthModal}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                {t('authGuestContinue')}
              </button>
            </div>
          </form>
        )}

        {/* OTP VERIFICATION FORM */}
        {authModalTab === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {t('authIdentifierLabel')}
              </label>
              <input
                type="text"
                required
                value={otpIdent}
                onChange={(e) => setOtpIdent(e.target.value)}
                placeholder={t('authIdentifierPlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {t('authOtpCodeLabel')}
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm font-mono tracking-widest text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {t('authVerifyOtpBtn')}
            </button>
            <button
              type="button"
              onClick={closeAuthModal}
              className="w-full py-2 text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              {t('authGuestContinue')}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {authModalTab === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {t('authIdentifierLabel')}
              </label>
              <input
                type="text"
                required
                value={forgotIdent}
                onChange={(e) => setForgotIdent(e.target.value)}
                placeholder={t('authIdentifierPlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm text-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {t('authSendResetBtn')}
            </button>
            <button
              type="button"
              onClick={() => setAuthModalTab('login')}
              className="w-full py-1.5 text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
            >
              {t('authBackToLogin')}
            </button>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {authModalTab === 'reset' && (
          <form onSubmit={handleResetSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {t('authResetTokenLabel')}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm font-mono text-white focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {t('authNewPasswordLabel')}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('authPasswordPlaceholder')}
                className="w-full px-3 py-2 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {t('authConfirmPasswordLabel')}
              </label>
              <input
                type="password"
                required
                value={newConfirmPassword}
                onChange={(e) => setNewConfirmPassword(e.target.value)}
                placeholder={t('authConfirmPasswordPlaceholder')}
                className="w-full px-3 py-2 rounded-xl bg-[#060606] border border-white/15 focus:border-teal-400/60 text-sm text-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {t('authResetSubmitBtn')}
            </button>
            <button
              type="button"
              onClick={() => setAuthModalTab('login')}
              className="w-full py-1.5 text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
            >
              {t('authBackToLogin')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
