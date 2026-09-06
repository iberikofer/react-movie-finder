import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from 'components/App';
import './index.css';

// Ensure ambient iridescent gradient background is strictly synchronized with wall-clock epoch
const syncAmbientAnimation = () => {
  const now = Date.now() / 1000;
  const r = document.documentElement;
  r.style.setProperty('--gradient-delay', `-${(now % 28).toFixed(2)}s`);
  r.style.setProperty('--gradient-delay-2', `-${(now % 36).toFixed(2)}s`);
};
syncAmbientAnimation();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      basename="/react-movie-finder"
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
