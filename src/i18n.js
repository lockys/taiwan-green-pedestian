import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import zh from './locales/zh/translation.json';

const STORAGE_KEY = 'greenPedestrianLanguage';
const SUPPORTED_LANGUAGES = ['zh', 'en'];

function normalizeLanguage(value) {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(normalized)) {
    return normalized;
  }

  const baseLanguage = normalized.split('-')[0];
  return SUPPORTED_LANGUAGES.includes(baseLanguage) ? baseLanguage : null;
}

function detectInitialLanguage() {
  if (typeof window !== 'undefined') {
    const stored = normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
    if (stored) {
      return stored;
    }
  }

  if (typeof navigator !== 'undefined') {
    const browserLanguage = normalizeLanguage(navigator.language);
    if (browserLanguage) {
      return browserLanguage;
    }
  }

  return 'zh';
}

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    lng: detectInitialLanguage(),
    fallbackLng: 'zh',
    supportedLngs: ['zh', 'en'],
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: en,
      },
      zh: {
        translation: zh,
      },
    },
  });
}

i18next.on('languageChanged', language => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, language);
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
});

export default i18next;
