import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Language, LanguageOption } from '../types';

import en from './locales/en';
import kn from './locales/kn';
import ta from './locales/ta';
import hi from './locales/hi';
import te from './locales/te';
import ml from './locales/ml';
import mr from './locales/mr';
import ur from './locales/ur';
import bn from './locales/bn';
import gu from './locales/gu';
import pa from './locales/pa';
import orLocale from './locales/or';
import asLocale from './locales/as';
import kok from './locales/kok';

export const GUEST_LANGUAGE_STORAGE_KEY = 'credvani_guest_language';
export const LANGUAGE_CONFIRMED_KEY = 'credvani_language_confirmed';

// Ordered with Kannada prioritized right alongside English for Karnataka-first accessibility
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', priorityBadge: 'Karnataka Priority' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇮🇳', isRtl: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', flag: '🇮🇳' },
];

export const resources = {
  en: { translation: en },
  kn: { translation: kn },
  ta: { translation: ta },
  hi: { translation: hi },
  te: { translation: te },
  ml: { translation: ml },
  mr: { translation: mr },
  ur: { translation: ur },
  bn: { translation: bn },
  gu: { translation: gu },
  pa: { translation: pa },
  or: { translation: orLocale },
  as: { translation: asLocale },
  kok: { translation: kok },
};

export function isValidLanguageCode(code: string | null | undefined): code is Language {
  return Boolean(code && Object.prototype.hasOwnProperty.call(resources, code));
}

export function getInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(GUEST_LANGUAGE_STORAGE_KEY);
    if (isValidLanguageCode(saved)) return saved;
  }
  return 'en';
}

export function applyDocumentLanguageAttributes(lang: Language): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
  }
}

const initialLng = getInitialLanguage();
applyDocumentLanguageAttributes(initialLng);

i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: false, // Strict rule: never silently mask missing translations with English
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  returnEmptyString: false,
});

export default i18n;
