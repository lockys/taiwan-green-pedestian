import { appTools, defineConfig } from '@modern-js/app-tools';
import { i18nPlugin } from '@modern-js/plugin-i18n';

export default defineConfig({
  plugins: [
    appTools(),
    i18nPlugin({
      localeDetection: {
        languages: ['zh', 'en'],
        fallbackLanguage: 'zh',
        detection: {
          order: ['localStorage', 'navigator'],
          caches: ['localStorage'],
          lookupLocalStorage: 'greenPedestrianLanguage',
        },
      },
      htmlLangAttr: true,
    }),
  ],
  output: {
    assetPrefix: process.env.ASSET_PREFIX || '/',
  },
  source: {
    entries: {
      index: {
        entry: './src/main.jsx',
        disableMount: true,
      },
    },
    disableDefaultEntries: true,
    mainEntryName: 'index',
  },
  html: {
    template: './index.html',
  },
  dev: {
    host: '127.0.0.1',
  },
  server: {
    port: 3001,
  },
});
