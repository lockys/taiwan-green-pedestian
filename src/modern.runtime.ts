import { defineRuntimeConfig } from '@modern-js/runtime';
import i18next from 'i18next';
import en from './locales/en/translation.json';
import zh from './locales/zh/translation.json';

if (!i18next.isInitialized) {
  i18next.init({
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

export default defineRuntimeConfig({
  i18n: {
    i18nInstance: i18next,
  },
});
