// Language constants for the radio content management system
export const SUPPORTED_LANGUAGES = {
  en: { code: 'en', name: 'English', flag: '🇺🇸' },
  es: { code: 'es', name: 'Español', flag: '🇪🇸' },
  fr: { code: 'fr', name: 'Français', flag: '🇫🇷' },
  de: { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  it: { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  pt: { code: 'pt', name: 'Português', flag: '🇵🇹' },
  hi: { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  ar: { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  zh: { code: 'zh', name: '中文', flag: '🇨🇳' },
  ja: { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ko: { code: 'ko', name: '한국어', flag: '🇰🇷' },
  ru: { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  nl: { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  sv: { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  da: { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  no: { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  fi: { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  pl: { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  tr: { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  th: { code: 'th', name: 'ไทย', flag: '🇹🇭' },
} as const;

export const DEFAULT_LANGUAGE = 'en';

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;
export type Language = typeof SUPPORTED_LANGUAGES[LanguageCode];

export const getLanguageOptions = () => {
  return Object.values(SUPPORTED_LANGUAGES).map(lang => ({
    value: lang.code,
    label: `${lang.flag} ${lang.name}`,
    name: lang.name,
    flag: lang.flag
  }));
};

export const getLanguageName = (code: string): string => {
  return SUPPORTED_LANGUAGES[code as LanguageCode]?.name || code;
};

export const getLanguageFlag = (code: string): string => {
  return SUPPORTED_LANGUAGES[code as LanguageCode]?.flag || '🌐';
};