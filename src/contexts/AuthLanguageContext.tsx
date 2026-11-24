import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthUser, Language, LanguageOption } from '../types';
import {
  SUPPORTED_LANGUAGES,
  GUEST_LANGUAGE_STORAGE_KEY,
  LANGUAGE_CONFIRMED_KEY,
  applyDocumentLanguageAttributes,
  getInitialLanguage,
  isValidLanguageCode,
} from '../i18n';
import {
  fetchLanguages,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  updateUserLanguage,
  verifyOtp,
  getMe,
} from '../services/api';

export type AuthModalTab = 'login' | 'signup' | 'otp' | 'forgot' | 'reset';

interface AuthLanguageContextValue {
  user: AuthUser | null;
  authLoading: boolean;
  language: Language;
  supportedLanguages: LanguageOption[];
  languageModalOpen: boolean;
  authModalOpen: boolean;
  authModalTab: AuthModalTab;
  pendingOtpNotice: string | null;
  pendingIdentifier: string;
  setLanguage: (lang: Language) => Promise<void>;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
  openAuthModal: (tab?: AuthModalTab) => void;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: AuthModalTab) => void;
  signIn: (identifier: string, password: string, rememberMe: boolean) => Promise<void>;
  signUp: (payload: {
    full_name: string;
    email: string;
    mobile_number: string;
    password: string;
    confirm_password: string;
    preferred_language: Language;
    consent_accepted: boolean;
  }) => Promise<void>;
  submitOtp: (identifier: string, otpCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
  setUserState: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

const AuthLanguageContext = createContext<AuthLanguageContextValue | undefined>(undefined);

export const AuthLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [supportedLanguages, setSupportedLanguages] = useState<LanguageOption[]>(SUPPORTED_LANGUAGES);
  const [languageModalOpen, setLanguageModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('login');
  const [pendingOtpNotice, setPendingOtpNotice] = useState<string | null>(null);
  const [pendingIdentifier, setPendingIdentifier] = useState<string>('');

  const applyLanguageLocally = useCallback(
    async (lang: Language) => {
      setLanguageState(lang);
      applyDocumentLanguageAttributes(lang);
      await i18n.changeLanguage(lang);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(GUEST_LANGUAGE_STORAGE_KEY, lang);
        window.localStorage.setItem(LANGUAGE_CONFIRMED_KEY, '1');
      }
    },
    [i18n]
  );

  // Sync supported languages from backend & restore existing refresh session on mount
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [langsRes, restoredUser] = await Promise.all([
          fetchLanguages().catch(() => SUPPORTED_LANGUAGES),
          refreshSession().catch(() => null),
        ]);

        if (!active) return;

        if (langsRes && langsRes.length >= 14) {
          // Keep Karnataka priority ordering (Kannada first) while preserving backend status
          const byCode = new Map(langsRes.map((l) => [l.code, l]));
          const ordered = SUPPORTED_LANGUAGES.map((item) => ({
            ...item,
            ...(byCode.get(item.code) || {}),
          }));
          setSupportedLanguages(ordered);
        }

        if (restoredUser) {
          setUser(restoredUser);
          if (isValidLanguageCode(restoredUser.preferred_language)) {
            await applyLanguageLocally(restoredUser.preferred_language);
          }
        } else if (typeof window !== 'undefined') {
          const confirmed = window.localStorage.getItem(LANGUAGE_CONFIRMED_KEY);
          if (!confirmed) {
            setLanguageModalOpen(true);
          }
        }
      } finally {
        if (active) setAuthLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [applyLanguageLocally]);

  const setLanguage = useCallback(
    async (lang: Language) => {
      await applyLanguageLocally(lang);
      if (user) {
        try {
          const updated = await updateUserLanguage(lang);
          setUser(updated);
        } catch {
          // Optimistically keep updated UI language even if transient failure
        }
      }
    },
    [applyLanguageLocally, user]
  );

  const signIn = useCallback(
    async (identifier: string, password: string, rememberMe: boolean) => {
      const res = await loginUser({ identifier, password, remember_me: rememberMe });
      setUser(res.user);
      if (isValidLanguageCode(res.user.preferred_language)) {
        await applyLanguageLocally(res.user.preferred_language);
      }
      setAuthModalOpen(false);
    },
    [applyLanguageLocally]
  );

  const signUp = useCallback(
    async (payload: {
      full_name: string;
      email: string;
      mobile_number: string;
      password: string;
      confirm_password: string;
      preferred_language: Language;
      consent_accepted: boolean;
    }) => {
      const res = await registerUser(payload);
      setUser(res.user);
      await applyLanguageLocally(res.user.preferred_language);
      setPendingIdentifier(res.user.email);
      setPendingOtpNotice(res.verification_notice || null);
      setAuthModalTab('otp');
    },
    [applyLanguageLocally]
  );

  const submitOtp = useCallback(async (identifier: string, otpCode: string) => {
    const res = await verifyOtp({ identifier, otp_code: otpCode });
    setUser(res.user);
    setPendingOtpNotice(null);
    setAuthModalOpen(false);
  }, []);

  const signOut = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  const reloadUser = useCallback(async () => {
    try {
      const u = await getMe();
      setUser(u);
    } catch {
      // ignore
    }
  }, []);

  const openLanguageModal = useCallback(() => setLanguageModalOpen(true), []);
  const closeLanguageModal = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_CONFIRMED_KEY, '1');
    }
    setLanguageModalOpen(false);
  }, []);

  const openAuthModal = useCallback((tab: AuthModalTab = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  }, []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  return (
    <AuthLanguageContext.Provider
      value={{
        user,
        authLoading,
        language,
        supportedLanguages,
        languageModalOpen,
        authModalOpen,
        authModalTab,
        pendingOtpNotice,
        pendingIdentifier,
        setLanguage,
        openLanguageModal,
        closeLanguageModal,
        openAuthModal,
        closeAuthModal,
        setAuthModalTab,
        signIn,
        signUp,
        submitOtp,
        signOut,
        reloadUser,
        setUserState: setUser,
      }}
    >
      {children}
    </AuthLanguageContext.Provider>
  );
};

export function useAuthLanguage(): AuthLanguageContextValue {
  const ctx = useContext(AuthLanguageContext);
  if (!ctx) {
    throw new Error('useAuthLanguage must be used within AuthLanguageProvider');
  }
  return ctx;
}
