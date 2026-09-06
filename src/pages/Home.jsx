import { Link } from 'react-router-dom';
import css from './Home.module.css';

const TECH_STACK = [
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
    name: 'Suspense Code Splitting',
    icon: '⚡',
    url: 'https://react.dev/reference/react/Suspense',
    title: 'React Documentation: Suspense & Code Splitting',
  },
];

export const Home = () => {
  return (
    <div className={css.homeContainer}>
      <section className={css.heroSection}>
        <h1 className={css.heroTitle}>
          Discover Movies with <span className={css.titleHighlight}>Precision Critics Scoring</span> & Cinematic Elegance
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
            <span className={css.statNumber}>60 FPS</span>
            <span className={css.statLabel}>Ambient Canvas Wave</span>
          </div>
          <div className={css.statCard}>
            <span className={css.statNumber}>100%</span>
            <span className={css.statLabel}>Responsive Layout</span>
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
              <li>Dynamic color feedback (emerald, amber, rose)</li>
            </ul>
          </div>

          <div className={css.featureCard}>
            <div className={css.featureIcon}>🔄</div>
            <h3 className={css.featureTitle}>Zero-Latency Sync Bus</h3>
            <p className={css.featureText}>
              Rate a film or add it to favorites in one window and watch your dashboard update instantaneously across all other browser tabs.
            </p>
            <ul className={css.featureList}>
              <li>Cross-window DOM event dispatching</li>
              <li>Resilient LocalStorage fallback with automatic re-indexing</li>
              <li>Zero network overhead for local state changes</li>
            </ul>
          </div>

          <div className={css.featureCard}>
            <div className={css.featureIcon}>⚡</div>
            <h3 className={css.featureTitle}>Suspense-Driven Code Splitting</h3>
            <p className={css.featureText}>
              Sub-second initial payload delivery powered by asynchronous route chunking and lazy-loaded movie sub-views.
            </p>
            <ul className={css.featureList}>
              <li>Asynchronous Cast, Reviews, and Trailers</li>
              <li>Non-blocking background image prefetching</li>
              <li>Smooth fallback loaders with shimmer effects</li>
            </ul>
          </div>

          <div className={css.featureCard}>
            <div className={css.featureIcon}>🌊</div>
            <h3 className={css.featureTitle}>Persistent Ambient Canvas</h3>
            <p className={css.featureText}>
              A pure linear iridescent background in deep emerald green with warm cherry wine accents that flows perpetually across 28s and 36s orbital wave cycles.
            </p>
            <ul className={css.featureList}>
              <li>Lives outside React root for 100% route immunity</li>
              <li>Synchronized to real-world epoch time (never resets on F5)</li>
              <li>GPU-composited transforms for silky 60 FPS performance</li>
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
            Explore the latest trending films or search across TMDB's massive library.
          </p>
          <div className={css.bottomCtaButtons}>
            <Link to="/trending" className={css.primaryCta}>
              <span>🔥 Explore Trending Now</span>
            </Link>
            <Link to="/movies" className={css.secondaryCta}>
              <span>🔍 Search Film Titles</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
