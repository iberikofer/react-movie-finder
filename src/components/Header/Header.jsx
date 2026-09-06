import { useState, useRef, useEffect, Suspense } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSavedMovies } from '../../hooks/useSavedMovies';
import { hasSavedPageScroll } from '../../utils/sessionStorage';
import Loader from '../Loader/Loader';
import css from './Header.module.css';

export const Header = () => {
  const { savedCount } = useSavedMovies();
  // status: 'idle' | 'confirming' | 'deleted'
  const [status, setStatus] = useState('idle');
  const timerRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();

  const navRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [hasTransition, setHasTransition] = useState(false);

  // Enable sliding transition after initial mount positioning
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasTransition(true);
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  // Update sliding underline position when route or saved count changes
  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;
      const activeEl = navRef.current.querySelector(`.${css.activeLink}`);
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
  }, [location.pathname, savedCount]);

  // Reset confirmation state & scroll to top when navigating to a different route
  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      const prevPath = prevPathnameRef.current;
      const nextPath = location.pathname;
      prevPathnameRef.current = location.pathname;
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus('idle');

      // Do NOT scroll to top if navigating between subtabs of the same movie
      const movieRegex = /(?:^|\/react-movie-finder)\/movies\/([^/]+)/;
      const prevMovieMatch = prevPath.match(movieRegex);
      const nextMovieMatch = nextPath.match(movieRegex);
      const isSameMovieSubtab =
        prevMovieMatch &&
        nextMovieMatch &&
        prevMovieMatch[1] === nextMovieMatch[1];

      // Do NOT scroll to top if navigating to Trending or Movies with a saved scroll position
      const isTrending = /(?:^|\/react-movie-finder)\/trending\/?$/.test(nextPath);
      const isMovies = /(?:^|\/react-movie-finder)\/movies\/?$/.test(nextPath);
      const hasSavedTrendingScroll = isTrending && hasSavedPageScroll('trending_session');
      const hasSavedMoviesScroll = isMovies && hasSavedPageScroll('movies_session');

      if (!isSameMovieSubtab && !hasSavedTrendingScroll && !hasSavedMoviesScroll) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    }
  }, [location.pathname]);

  // Handle outside click when in 'confirming' state
  useEffect(() => {
    if (status !== 'confirming') return;

    const handleOutsideClick = event => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setStatus('idle');
      }
    };

    // Attach click listener on next tick to avoid capturing the initiating click
    const delayTimer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(delayTimer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [status]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClearAll = event => {
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

      // Perform deletion
      const keysToRemove = [];
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

      // Switch to 'deleted' state for exactly 2.0s
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
              className={({ isActive }) =>
                `${css.navLink} ${isActive ? css.activeLink : ''}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/movies"
              className={({ isActive }) =>
                `${css.navLink} ${isActive ? css.activeLink : ''}`
              }
            >
              Search
            </NavLink>
            <NavLink
              to="/trending"
              className={({ isActive }) =>
                `${css.navLink} ${isActive ? css.activeLink : ''}`
              }
            >
              Trending
            </NavLink>
            <NavLink
              to="/saved"
              className={({ isActive }) =>
                `${css.navLink} ${isActive ? css.activeLink : ''}`
              }
            >
              <span>Saved</span>
              {savedCount > 0 && (
                <span className={css.savedBadge}>{savedCount}</span>
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
