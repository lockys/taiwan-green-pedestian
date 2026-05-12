import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import App from './App.jsx';
import i18n from './i18n.js';

const container = document.querySelector('#app');

if (!container) {
  throw new Error('Expected #app mount node.');
}

createRoot(container).render(
  <I18nextProvider i18n={i18n}>
    <App />
  </I18nextProvider>,
);
