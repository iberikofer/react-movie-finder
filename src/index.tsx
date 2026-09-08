import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from 'components/App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { LanguageProvider } from 'context/LanguageContext';
import './index.css';

// Ensure ambient iridescent gradient background is strictly synchronized with wall-clock epoch
const syncAmbientAnimation = (): void => {
  const now = Date.now() / 1000;
  const r = document.documentElement;
  r.style.setProperty('--gradient-delay', `-${(now % 28).toFixed(2)}s`);
  r.style.setProperty('--gradient-delay-2', `-${(now % 36).toFixed(2)}s`);
};
syncAmbientAnimation();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement as HTMLElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter
        basename="/react-movie-finder"
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();
