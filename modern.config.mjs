import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
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
