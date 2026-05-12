import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const container = document.querySelector('#app');

if (!container) {
  throw new Error('Expected #app mount node.');
}

createRoot(container).render(<App />);
