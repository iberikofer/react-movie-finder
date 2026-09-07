import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader/Loader';
import { clearPageSession } from '../utils/sessionStorage';
import css from './Home.module.css';

interface TechItem {
  name: string;
  icon: string;
  url: string;
  title: string;
}

const TECH_STACK: TechItem[] = [
  {
    name: 'React 18',
    icon: '⚛️',
    url: 'https://react.dev/',
    title: 'React Official Documentation',
  },
  {
    name: 'React Router v6',
    icon: '🗺️',
    url: 'https://reactrouter.com/',
    title: 'React Router Documentation',
  },
  {
    name: 'TMDB REST API',
    icon: '🎬',
    url: 'https://developer.themoviedb.org/docs',
    title: 'The Movie Database (TMDB) API Documentation',
  },
  {
    name: 'Session Navigation Sync',
    icon: '🧭',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage',
    title: 'SessionStorage state & scroll position restoration across routes',
  },
  {
    name: 'Vanilla CSS Modules',
    icon: '🎨',
    url: 'https://github.com/css-modules/css-modules',
    title: 'CSS Modules Specification & Repository',
  },
  {
    name: 'LocalStorage Event Bus',
    icon: '💾',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event',
    title: 'MDN Web Docs: Window storage event',
  },
  {
    name: 'Epoch Wall-Clock Sync',
    icon: '⏱️',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now',
    title: 'MDN Web Docs: Date.now() / Unix Epoch Time',
  },
  {
    name: 'Fullscreen Photo Lightbox',
    icon: '📸',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog',
    title: 'Interactive keyboard-navigable image gallery modal',
  },
];

let hasLoadedHomeOnce = false;

export const Home: React.FC = () => {
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(!hasLoadedHomeOnce);

  useEffect(() => {
    if (!hasLoadedHomeOnce) {
      const timer = setTimeout(() => {
        hasLoadedHomeOnce = true;
        setIsInitialLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (isInitialLoading) {
    return <Loader isCentered caption="Loading home..." />;
  }

  return (
    <div className={css.homeContainer}>
      <section className={css.heroSection}>
        <h1 className={css.heroTitle}>
          Discover Movies with Precision Critics Scoring & Cinematic Elegance
        </h1>

        <p className={css.heroSubtitle}>
          MovieFinder combines real-time TMDB film intelligence with a bespoke 5-star community analytics engine, smooth animations, and an uninterrupted emerald-and-cherry ambient experience.
        </p>

        <div className={css.statsGrid}>
          <div className={css.statCard}>
            <span className={css.statNumber}>500k+</span>
            <span className={css.statLabel}>TMDB Movies & Series</span>
          </div>
          <div className={css.statCard}>
            <span className={css.statNumber}>5.0 ★</span>
            <span className={css.statLabel}>Half-Star Scoring Engine</span>
          </div>
          <div className={css.statCard}>
            <span className={css.statNumber}>19+</span>
            <span className={css.statLabel}>Curated Genre Filters</span>
          </div>
          <div className={css.statCard}>
            <span className={css.statNumber}>100%</span>
            <span className={css.statLabel}>Cross-Tab Synced</span>
          </div>
        </div>
      </section>

      <section className={css.featuresSection}>
        <div className={css.sectionHeader}>
          <span className={css.sectionCategory}>Next-Gen Architecture</span>
          <h2 className={css.sectionTitle}>Engineered for Cinephiles</h2>
          <p className={css.sectionSubtitle}>
            Every interaction is tuned for rapid exploration, deep filmography analysis, and seamless cross-tab synchronization.
          </p>
        </div>

        <div className={css.featuresGrid}>
          <div className={css.featureCard}>
            <div className={css.featureIcon}>⭐</div>
            <h3 className={css.featureTitle}>Dual Scoring Analytics</h3>
            <p className={css.featureText}>
              Toggle between TMDB's global 10-point scale and our 5-star precision critic engine with granular 0.5-star half-step resolution.
            </p>
            <ul className={css.featureList}>
              <li>Instant mathematical mapping between systems</li>
              <li>Interactive star-rating input for personal ratings</li>
              <li>Dynamic rating distribution breakdown tab</li>
            </ul>
          </div>

          <div className={css.featureCard}>
            <div className={css.featureIcon}>🔖</div>
            <h3 className={css.featureTitle}>Personal Saved Watchlist</h3>
            <p className={css.featureText}>
              Bookmark movies & TV series with a single click directly from poster cards or right beside the title in details view.
            </p>
            <ul className={css.featureList}>
              <li>Live header counter badge updated instantly</li>
              <li>Category filtering (All, Movies, TV Series)</li>
              <li>2-step safe clear confirmation protection</li>
            </ul>
          </div>

          <div className={css.featureCard}>
            <div className={css.featureIcon}>🏷️</div>
            <h3 className={css.featureTitle}>Unified Multi-Filter Suite</h3>
            <p className={css.featureText}>
              Discover movies and series with interactive filter dropdowns, multi-genre picking, and age certifications.
            </p>
            <ul className={css.featureList}>
              <li>Format selector (Movies / Series / All) with badge badges</li>
              <li>Multi-genre modal with quick Done confirmation and search</li>
              <li>Age certifications (0+, 6+, 12+, 16+, 18+) & multi-order sorting</li>
            </ul>
          </div>

          <div className={css.featureCard}>
            <div className={css.featureIcon}>📸</div>
            <h3 className={css.featureTitle}>Cinematic Lightbox & Media Hub</h3>
            <p className={css.featureText}>
              Deep-dive into each title with high-definition backdrop galleries, embedded trailers, and comprehensive crew information.
            </p>
            <ul className={css.featureList}>
              <li>Keyboard-navigable (Esc / Arrows) modal photo lightbox</li>
              <li>Embedded official YouTube trailer player</li>
              <li>Cast with character roles, community reviews & similar titles</li>
            </ul>
          </div>

          <div className={css.featureCard}>
            <div className={css.featureIcon}>🔄</div>
            <h3 className={css.featureTitle}>Zero-Latency Sync Bus</h3>
            <p className={css.featureText}>
              Rate a film or bookmark a title in one window and watch your dashboard update instantaneously across all other browser tabs.
            </p>
            <ul className={css.featureList}>
              <li>Cross-window DOM event dispatching</li>
              <li>Resilient LocalStorage fallback with automatic re-indexing</li>
              <li>Zero network overhead for local state changes</li>
            </ul>
          </div>

          <div className={css.featureCard}>
            <div className={css.featureIcon}>🧭</div>
            <h3 className={css.featureTitle}>Session Restoration & Atmosphere</h3>
            <p className={css.featureText}>
              Seamless session persistence remembers accumulated pagination, movie lists, and exact scroll position when returning from details.
            </p>
            <ul className={css.featureList}>
              <li>Automatic scroll restoration for Trending & Search</li>
              <li>Synchronized to real-world epoch time (never resets on F5)</li>
              <li>Anti-jitter clapperboard loader with 0.5s stabilization</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={css.techSection}>
        <h3 className={css.techTitle}>Built with Modern Web Technologies</h3>
        <div className={css.techPillGrid}>
          {TECH_STACK.map(tech => (
            <a
              key={tech.name}
              href={tech.url}
              target="_blank"
              rel="noopener noreferrer"
              className={css.techPill}
              title={tech.title}
            >
              <span className={css.pillIcon}>{tech.icon}</span>
              <span className={css.pillText}>{tech.name}</span>
            </a>
          ))}
        </div>
      </section>

      <section className={css.bottomCtaSection}>
        <div className={css.bottomCtaInner}>
          <h2 className={css.bottomCtaTitle}>Ready to Find Your Next Movie?</h2>
          <p className={css.bottomCtaDesc}>
            Explore the latest trending films, search across TMDB's massive library, or organize your personal watchlist.
          </p>
          <div className={css.bottomCtaButtons}>
            <Link
              to="/trending"
              className={css.primaryCta}
              onClick={() => clearPageSession('trending_session')}
            >
              <span>🔥 Explore Trending Now</span>
            </Link>
            <Link to="/movies" className={css.secondaryCta}>
              <span>🔍 Search Film Titles</span>
            </Link>
            <Link to="/saved" className={css.secondaryCta}>
              <span>🔖 My Saved Watchlist</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
