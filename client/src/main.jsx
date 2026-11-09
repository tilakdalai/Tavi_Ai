import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register Progressive Web App (PWA) Service Worker
if ('serviceWorker' in navigator && !window.__TEST_ENV__) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[Tavi PWA] Service worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Tavi PWA] Service worker registration notice:', err.message);
      });
  });
}

