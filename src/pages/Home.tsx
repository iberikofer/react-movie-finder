import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader/Loader';
import { clearPageSession } from '../utils/sessionStorage';
import { useLanguage } from '../context/LanguageContext';
import css from './Home.module.css';

interface TechItem {
  name: string;
  icon: string;
  url: string;
  title: string;
  titleUk?: string;
}

const TECH_STACK: TechItem[] = [
  {
    name: 'React 18',
    icon: '⚛️',
    url: 'https://react.dev/',
    title: 'React Official Documentation',
    titleUk: 'Офіційна документація React',
  },
  {
    name: 'React Router v6',
    icon: '🗺️',
    url: 'https://reactrouter.com/',
    title: 'React Router Documentation',
    titleUk: 'Офіційна документація React Router',
  },
  {
    name: 'TMDB REST API',
    icon: '🎬',
    url: 'https://developer.themoviedb.org/docs',
    title: 'The Movie Database (TMDB) API Documentation',
    titleUk: 'Документація The Movie Database (TMDB) API',
  },
  {
    name: 'Session Navigation Sync',
    icon: '🧭',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage',
    title: 'SessionStorage state & scroll position restoration across routes',
    titleUk: 'Відновлення списку та координат скролу через SessionStorage',
  },
  {
    name: 'Vanilla CSS Modules',
    icon: '🎨',
    url: 'https://github.com/css-modules/css-modules',
    title: 'CSS Modules Specification & Repository',
    titleUk: 'Специфікація та репозиторій CSS Modules',
  },
  {
    name: 'LocalStorage Event Bus',
    icon: '💾',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event',
    title: 'MDN Web Docs: Window storage event',
    titleUk: 'MDN: Подія storage для міжвкладочної синхронізації',
  },
  {
    name: 'Epoch Wall-Clock Sync',
    icon: '⏱️',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now',
    title: 'MDN Web Docs: Date.now() / Unix Epoch Time',
    titleUk: 'MDN: Unix Epoch Time для безперервної фонової анімації',
  },
  {
    name: 'Fullscreen Photo Lightbox',
    icon: '📸',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog',
    title: 'Interactive keyboard-navigable image gallery modal',
    titleUk: 'Інтерактивна модальна галерея фото з навігацією клавішами',
  },
  {
    name: 'Bilingual Localization (UA/EN)',
    icon: '🇺🇦',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language',
    title: 'End-to-end Ukrainian & English bilingual support with flag switch',
    titleUk: 'Повна двомовна локалізація (UA/EN) з перемикачем у формі прапора',
  },
  {
    name: 'PWA & Offline Cache',
    icon: '📱',
    url: 'https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps',
    title: 'Progressive Web App with Service Worker & offline caching',
    titleUk: 'Progressive Web App із Service Worker та кешуванням офлайн',
  },
];

let hasLoadedHomeOnce = false;

export const Home: React.FC = () => {
  const { language, t } = useLanguage();
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
    return <Loader isCentered caption={t('home.loading', 'Loading home...')} />;
  }

  return (
    <div className={css.homeContainer}>
      <section className={css.heroSection}>
        <h1 className={css.heroTitle}>
          {t('home.heroTitle')}
        </h1>

        <p className={css.heroSubtitle}>
          {t('home.heroSubtitle')}
        </p>

        <div className={css.statsGrid}>
          <div className={css.statCard}>
            <span className={css.statNumber}>500k+</span>
            <span className={css.statLabel}>{t('home.statMovies')}</span>
          </div>
          <div className={css.statCard}>
            <span className={css.statNumber}>5.0 ★</span>
            <span className={css.statLabel}>{t('home.statScoring')}</span>
          </div>
          <div className={css.statCard}>
            <span className={css.statNumber}>19+</span>
            <span className={css.statLabel}>{t('home.statGenres')}</span>
          </div>
          <div className={css.statCard}>
            <span className={css.statNumber}>100%</span>
            <span className={css.statLabel}>{t('home.statSync')}</span>
          </div>
        </div>
      </section>

      <section className={css.featuresSection}>
        <div className={css.sectionHeader}>
          <span className={css.sectionCategory}>{t('home.featuresCategory')}</span>
          <h2 className={css.sectionTitle}>{t('home.featuresTitle')}</h2>
          <p className={css.sectionSubtitle}>
            {t('home.featuresSubtitle')}
          </p>
        </div>

        <div className={css.featuresGrid}>
          <div className={css.featureCard}>
            <div className={css.featureIcon}>⭐</div>
            <h3 className={css.featureTitle}>{t('home.f1Title')}</h3>
            <p className={css.featureText}>
              {t('home.f1Text')}
            </p>
            <ul className={css.featureList}>
              <li>{t('home.f1i1')}</li>
              <li>{t('home.f1i2')}</li>
              <li>{t('home.f1i3')}</li>
            </ul>
          </div>

          <div className={css.featureCard}>
            <div className={css.featureIcon}>🔖</div>
            <h3 className={css.featureTitle}>{t('home.f2Title')}</h3>
            <p className={css.featureText}>
              {t('home.f2Text')}
            </p>
            <ul className={css.featureList}>
              <li>{t('home.f2i1')}</li>
              <li>{t('home.f2i2')}</li>
              <li>{t('home.f2i3')}</li>
            </ul>
          </div>

          <div className={css.featureCard}>
            <div className={css.featureIcon}>🏷️</div>
            <h3 className={css.featureTitle}>{t('home.f3Title')}</h3>
            <p className={css.featureText}>
              {t('home.f3Text')}
            </p>
            <ul className={css.featureList}>
              <li>{t('home.f3i1')}</li>
              <li>{t('home.f3i2')}</li>
              <li>{t('home.f3i3')}</li>
            </ul>
          </div>

          <div className={css.featureCard}>
            <div className={css.featureIcon}>📸</div>
            <h3 className={css.featureTitle}>{t('home.f4Title')}</h3>
            <p className={css.featureText}>
              {t('home.f4Text')}
            </p>
            <ul className={css.featureList}>
              <li>{t('home.f4i1')}</li>
              <li>{t('home.f4i2')}</li>
              <li>{t('home.f4i3')}</li>
            </ul>
          </div>

          <div className={css.featureCard}>
            <div className={css.featureIcon}>🔄</div>
            <h3 className={css.featureTitle}>{t('home.f5Title')}</h3>
            <p className={css.featureText}>
              {t('home.f5Text')}
            </p>
            <ul className={css.featureList}>
              <li>{t('home.f5i1')}</li>
              <li>{t('home.f5i2')}</li>
              <li>{t('home.f5i3')}</li>
            </ul>
          </div>

          <div className={css.featureCard}>
            <div className={css.featureIcon}>🧭</div>
            <h3 className={css.featureTitle}>{t('home.f6Title')}</h3>
            <p className={css.featureText}>
              {t('home.f6Text')}
            </p>
            <ul className={css.featureList}>
              <li>{t('home.f6i1')}</li>
              <li>{t('home.f6i2')}</li>
              <li>{t('home.f6i3')}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={css.dbNoticeSection} aria-label={t('home.dbNoticeTitle')}>
        <div className={css.dbNoticeCard}>
          <div className={css.dbNoticeIconWrap}>
            <span className={css.dbNoticeIcon} role="img" aria-hidden="true">ℹ️</span>
          </div>
          <div className={css.dbNoticeBody}>
            <h3 className={css.dbNoticeTitle}>{t('home.dbNoticeTitle')}</h3>
            <p className={css.dbNoticeText}>{t('home.dbNoticeText')}</p>
            <p className={css.dbNoticeSubtext}>{t('home.dbNoticeSorting')}</p>
          </div>
        </div>
      </section>

      <section className={css.techSection}>
        <h3 className={css.techTitle}>{t('home.techTitle')}</h3>
        <div className={css.techPillGrid}>
          {TECH_STACK.map(tech => (
            <a
              key={tech.name}
              href={tech.url}
              target="_blank"
              rel="noopener noreferrer"
              className={css.techPill}
              title={language === 'uk' && tech.titleUk ? tech.titleUk : tech.title}
            >
              <span className={css.pillIcon}>{tech.icon}</span>
              <span className={css.pillText}>{tech.name}</span>
            </a>
          ))}
        </div>
      </section>

      <section className={css.bottomCtaSection}>
        <div className={css.bottomCtaInner}>
          <h2 className={css.bottomCtaTitle}>{t('home.ctaTitle')}</h2>
          <p className={css.bottomCtaDesc}>
            {t('home.ctaDesc')}
          </p>
          <div className={css.bottomCtaButtons}>
            <Link
              to="/trending"
              className={css.primaryCta}
              onClick={() => clearPageSession('trending_session')}
            >
              <span>{t('home.exploreTrending')}</span>
            </Link>
            <Link to="/movies" className={css.secondaryCta}>
              <span>{t('home.searchTitles')}</span>
            </Link>
            <Link to="/saved" className={css.secondaryCta}>
              <span>{t('home.myWatchlist')}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
