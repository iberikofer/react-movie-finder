import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import css from './Header.module.css';

export const Header = () => {
  // status: 'idle' | 'confirming' | 'deleted'
  const [status, setStatus] = useState('idle');
  const timerRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();

  // Reset confirmation state only when navigating to a different route
  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname;
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus('idle');
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

          <nav className={css.navigation} aria-label="Main navigation">
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
                  ? 'Confirm Clear All?'
                  : status === 'deleted'
                  ? 'All ratings deleted'
                  : 'Clear All Ratings'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className={css.mainContent}>
        <Outlet />
      </main>
    </>
  );
};

export default Header;
