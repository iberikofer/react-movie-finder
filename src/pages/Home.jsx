import { Link } from 'react-router-dom';
import css from './Home.module.css';

export const Home = () => {
  return (
    <div className={css.homeContainer}>
      {/* Hero Section */}
      <section className={css.heroSection}>
        <h1 className={css.heroTitle}>
          Discover Movies with <span className={css.titleHighlight}>Precision Critics Scoring</span> & Cinematic Elegance
        </h1>

        <p className={css.heroSubtitle}>
          MovieFinder combines real-time TMDB film intelligence with a bespoke 5-star community analytics engine, smooth animations, and an uninterrupted emerald-and-cherry ambient experience.
        </p>

        {/* Quick Facts Counter Grid */}
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
            <span className={css.statNumber}>100%</span>
            <span className={css.statLabel}>Real-time Local Persistence</span>
          </div>
          <div className={css.statCard}>
            <span className={css.statNumber}>60 FPS</span>
            <span className={css.statLabel}>Fluid Ambient Shimmer</span>
          </div>
        </div>
      </section>

      {/* Feature Showcase Pillars */}
      <section className={css.featuresSection}>
        <div className={css.sectionHeader}>
          <span className={css.sectionCategory}>Core Capabilities</span>
          <h2 className={css.sectionTitle}>Engineered for True Cinephiles</h2>
          <p className={css.sectionSubtitle}>
            Every interaction is tuned with micro-animations, glassmorphism aesthetics, and real-time state synchronization.
          </p>
        </div>

        <div className={css.featuresGrid}>
          {/* Feature 1 */}
          <div className={css.featureCard}>
            <div className={css.featureIcon}>⭐</div>
            <h3 className={css.featureTitle}>5-Star Critics Rating System</h3>
            <p className={css.featureText}>
              A standalone rating system with 0.5-star granularity, satisfaction progress meter, rating distribution analytics tiers (from 0.5★ to 5.0★), and instant cross-tab storage synchronization.
            </p>
            <ul className={css.featureList}>
              <li>Half-star hover hitboxes with contextual tooltips</li>
              <li>Calculated satisfaction score percentage bar</li>
              <li>Double-click confirmation with protected 2s delete state</li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className={css.featureCard}>
            <div className={css.featureIcon}>🎬</div>
            <h3 className={css.featureTitle}>Cinematic Clapperboard Loader</h3>
            <p className={css.featureText}>
              Replaced standard circular spinners with a crafted vector clapperboard. Features diagonal emerald stripes, a crisp 0.3s snap shut, 1s steady hold, and smooth upward lift.
            </p>
            <ul className={css.featureList}>
              <li>Guaranteed 500ms minimum pacing on all fetches</li>
              <li>Pulsing film metadata typography ("SCENE 01 / TAKE 01")</li>
              <li>Zero glitching, bouncing, or twitching</li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className={css.featureCard}>
            <div className={css.featureIcon}>💬</div>
            <h3 className={css.featureTitle}>Dynamic Soft Review Palettes</h3>
            <p className={css.featureText}>
              Community reviews are displayed with uniquely generated soft accent colors (soft sky blue, warm orange, mint, lavender, rose), ensuring each review stands out elegantly.
            </p>
            <ul className={css.featureList}>
              <li>Custom border and author color styling per review</li>
              <li>Dedicated flush-docked sub-route tab bar</li>
              <li>Zero page jump or scroll reset when toggling tabs</li>
            </ul>
          </div>

          {/* Feature 4 */}
          <div className={css.featureCard}>
            <div className={css.featureIcon}>🌌</div>
            <h3 className={css.featureTitle}>Uninterrupted Ambient Shimmer</h3>
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

      {/* Tech Stack Pills */}
      <section className={css.techSection}>
        <h3 className={css.techTitle}>Built with Modern Web Technologies</h3>
        <div className={css.techPillGrid}>
          <span className={css.techPill}>⚛️ React 18</span>
          <span className={css.techPill}>🗺️ React Router v6</span>
          <span className={css.techPill}>🎬 TMDB REST API</span>
          <span className={css.techPill}>🎨 Vanilla CSS Modules</span>
          <span className={css.techPill}>💾 LocalStorage Event Bus</span>
          <span className={css.techPill}>⏱️ Epoch Wall-Clock Sync</span>
          <span className={css.techPill}>⚡ Suspense Code Splitting</span>
        </div>
      </section>

      {/* Bottom CTA Banner */}
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
