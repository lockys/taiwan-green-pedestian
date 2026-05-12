import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    assetPrefix: process.env.ASSET_PREFIX || '/',
  },
  source: {
    entry: {
      index: './src/main.js',
    },
  },
  html: {
    template: './index.html',
  },
  dev: {
    setupMiddlewares: [
      (middlewares) => {
        middlewares.unshift((req, _res, next) => {
          if (req.url === '/editor') {
            req.url = '/index.html';
          }
          next();
        });
      },
    ],
  },
});
