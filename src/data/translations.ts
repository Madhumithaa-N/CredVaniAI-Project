import { Language, LanguageOption } from '../types';
import { SUPPORTED_LANGUAGES, resources } from '../i18n';

export const LANGUAGES: LanguageOption[] = SUPPORTED_LANGUAGES;

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: resources.en.translation,
  kn: resources.kn.translation,
  ta: resources.ta.translation,
  hi: resources.hi.translation,
  te: resources.te.translation,
  ml: resources.ml.translation,
  mr: resources.mr.translation,
  ur: resources.ur.translation,
  bn: resources.bn.translation,
  gu: resources.gu.translation,
  pa: resources.pa.translation,
  or: resources.or.translation,
  as: resources.as.translation,
  kok: resources.kok.translation,
};
