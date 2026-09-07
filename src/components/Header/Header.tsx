import React, { useState, useRef, useEffect, Suspense } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSavedMovies } from '../../hooks/useSavedMovies';
import { hasSavedPageScroll, clearPageSession } from '../../utils/sessionStorage';
import Loader from '../Loader/Loader';
import PWAInstallPrompt from '../PWAInstallPrompt/PWAInstallPrompt';
import css from './Header.module.css';

interface AnimState {
  key: number;
  type: 'increase' | 'decrease' | null;
}

interface IndicatorStyle {
  left: number;
  width: number;
  opacity: number;
}

export const Header: React.FC = () => {
  const { savedCount } = useSavedMovies();
  const [animState, setAnimState] = useState<AnimState>({ key: 0, type: null });
  const prevSavedCountRef = useRef<number>(savedCount);
  const isInitialMountRef = useRef<boolean>(true);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (savedCount > prevSavedCountRef.current) {
      setAnimState(prev => ({ key: prev.key + 1, type: 'increase' }));
    } else if (savedCount < prevSavedCountRef.current) {
      setAnimState(prev => ({ key: prev.key + 1, type: 'decrease' }));
    }
    prevSavedCountRef.current = savedCount;
  }, [savedCount]);

  const [status, setStatus] = useState<'idle' | 'confirming' | 'deleted'>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();

  const navRef = useRef<HTMLElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [hasTransition, setHasTransition] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasTransition(true);
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  const isMovieDetails = /(?:^|\/react-movie-finder)\/movies\/[^/]+/.test(location.pathname);
  const movieOrigin = isMovieDetails
    ? (location.state?.source || sessionStorage.getItem('movie_origin_tab') || 'movies')
    : null;

  const isHomeActive = !isMovieDetails && location.pathname === '/';
  const isSearchActive = isMovieDetails
    ? movieOrigin === 'movies'
    : (location.pathname.startsWith('/movies') && !isMovieDetails);
  const isTrendingActive = isMovieDetails
    ? movieOrigin === 'trending'
    : location.pathname.startsWith('/trending');
  const isSavedActive = isMovieDetails
    ? movieOrigin === 'saved'
    : location.pathname.startsWith('/saved');

  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;
      const activeEl = navRef.current.querySelector<HTMLElement>(`.${css.activeLink}`);
      if (activeEl) {
        const navRect = navRef.current.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        setIndicatorStyle({
          left: activeRect.left - navRect.left,
          width: activeRect.width,
          opacity: 1,
        });
      } else {
        setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateIndicator);
    }

    window.addEventListener('resize', updateIndicator);
    return () => {
      window.removeEventListener('resize', updateIndicator);
    };
  }, [location.pathname, location.state, savedCount, isMovieDetails, movieOrigin]);

  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      const prevPath = prevPathnameRef.current;
      const nextPath = location.pathname;
      prevPathnameRef.current = location.pathname;
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus('idle');

      const movieRegex = /(?:^|\/react-movie-finder)\/movies\/([^/]+)/;
      const prevMovieMatch = prevPath.match(movieRegex);
      const nextMovieMatch = nextPath.match(movieRegex);
      const isSameMovieSubtab =
        prevMovieMatch &&
        nextMovieMatch &&
        prevMovieMatch[1] === nextMovieMatch[1];

      const isTrending = /(?:^|\/react-movie-finder)\/trending\/?$/.test(nextPath);
      const isMovies = /(?:^|\/react-movie-finder)\/movies\/?$/.test(nextPath);
      const hasSavedTrendingScroll = isTrending && hasSavedPageScroll('trending_session');
      const hasSavedMoviesScroll = isMovies && hasSavedPageScroll('movies_session');

      if (!isSameMovieSubtab && !hasSavedTrendingScroll && !hasSavedMoviesScroll) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    if (status !== 'confirming') return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setStatus('idle');
      }
    };

    const delayTimer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(delayTimer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [status]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClearAll = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (status === 'deleted') return;

    if (status === 'idle') {
      setStatus('confirming');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setStatus('idle');
      }, 4000);
      return;
    }

    if (status === 'confirming') {
      if (timerRef.current) clearTimeout(timerRef.current);

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('critics_score_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      window.dispatchEvent(
        new CustomEvent('critics_score_updated', {
          detail: { all: true },
        })
      );

      setStatus('deleted');
      timerRef.current = setTimeout(() => {
        setStatus('idle');
      }, 2000);
    }
  };

  return (
    <>
      <header className={css.header}>
        <div className={css.headerInner}>
          <div className={css.logoWrapper}>
            <NavLink to="/" className={css.logoLink}>
              <span className={css.logoIcon}>🎬</span>
              <span className={css.logoText}>MovieFinder</span>
            </NavLink>
          </div>

          <nav
            className={css.navigation}
            ref={navRef}
            aria-label="Main navigation"
          >
            <NavLink
              to="/"
              end
              className={`${css.navLink} ${isHomeActive ? css.activeLink : ''}`}
            >
              Home
            </NavLink>
            <NavLink
              to="/movies"
              end
              className={`${css.navLink} ${isSearchActive ? css.activeLink : ''}`}
            >
              Search
            </NavLink>
            <NavLink
              to="/trending"
              className={`${css.navLink} ${isTrendingActive ? css.activeLink : ''}`}
              onClick={() => {
                clearPageSession('trending_session');
                window.dispatchEvent(new CustomEvent('trending_nav_click'));
                window.scrollTo({ top: 0, behavior: 'auto' });
              }}
            >
              Trending
            </NavLink>
            <NavLink
              to="/saved"
              className={`${css.navLink} ${isSavedActive ? css.activeLink : ''}`}
            >
              <span>Saved</span>
              {savedCount > 0 && (
                <span
                  key={animState.key}
                  className={`${css.savedBadge} ${
                    animState.type === 'increase'
                      ? css.savedBadgeBump
                      : animState.type === 'decrease'
                      ? css.savedBadgeShrink
                      : ''
                  }`}
                >
                  {savedCount}
                </span>
              )}
            </NavLink>
            <span
              className={`${css.navIndicator} ${
                hasTransition ? css.navIndicatorTransition : ''
              }`}
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity,
              }}
              aria-hidden="true"
            />
          </nav>

          <div className={css.headerActions}>
            <PWAInstallPrompt />
            <button
              ref={buttonRef}
              type="button"
              disabled={status === 'deleted'}
              className={`${css.clearAllBtn} ${
                status === 'confirming' ? css.clearAllBtnConfirm : ''
              } ${status === 'deleted' ? css.clearAllBtnDeleted : ''}`}
              onClick={handleClearAll}
              title={
                status === 'confirming'
                  ? 'Click again to confirm clearing all ratings'
                  : status === 'deleted'
                  ? 'All ratings have been deleted'
                  : 'Clear all critics ratings across all movies'
              }
            >
              <span aria-hidden="true">
                {status === 'confirming'
                  ? '⚠️'
                  : status === 'deleted'
                  ? '✅'
                  : '🗑️'}
              </span>
              <span className={css.clearBtnText}>
                {status === 'confirming'
                  ? 'Confirm Clearing ALL Ratings'
                  : status === 'deleted'
                  ? 'All ratings deleted'
                  : 'Clear ALL Ratings'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className={css.mainContent}>
        <Suspense fallback={<Loader isCentered caption="Loading scene..." />}>
          <div className={css.contentFadeIn}>
            <Outlet />
          </div>
        </Suspense>
      </main>
    </>
  );
};

export default Header;
