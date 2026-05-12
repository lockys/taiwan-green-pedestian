import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import zh from './locales/zh/translation.json';

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    lng: 'zh',
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

export default i18next;
