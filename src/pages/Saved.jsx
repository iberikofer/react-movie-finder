import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { setMediaType } from 'fetch';
import { useSavedMovies } from '../hooks/useSavedMovies';
import MediaTypeBadge from '../components/MediaTypeBadge/MediaTypeBadge';
import MovieCardRatingBadge from '../components/CriticsScore/MovieCardRatingBadge';
import SaveMovieButton from '../components/SaveMovieButton/SaveMovieButton';
import Loader from '../components/Loader/Loader';
import css from './Saved.module.css';

let hasLoadedSavedOnce = false;

export const Saved = () => {
  const { savedMovies, clearAll } = useSavedMovies();
  const [isInitialLoading, setIsInitialLoading] = useState(!hasLoadedSavedOnce);
  const [filterType, setFilterType] = useState('all'); // 'all', 'movie', 'tv'
  const [clearStatus, setClearStatus] = useState('idle'); // 'idle', 'confirming'
  const location = useLocation();

  // Guarantee 0.5s initial centered loader ONLY on first load / reload of Saved page
  useEffect(() => {
    if (!hasLoadedSavedOnce) {
      const timer = setTimeout(() => {
        hasLoadedSavedOnce = true;
        setIsInitialLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const moviesCount = useMemo(
    () => savedMovies.filter(m => m.media_type === 'movie').length,
    [savedMovies]
  );
  const tvCount = useMemo(
    () => savedMovies.filter(m => m.media_type === 'tv').length,
    [savedMovies]
  );

  const filteredMovies = useMemo(() => {
    if (filterType === 'all') return savedMovies;
    return savedMovies.filter(m => m.media_type === filterType);
  }, [savedMovies, filterType]);

  const handleClear = () => {
    if (clearStatus === 'idle') {
      setClearStatus('confirming');
      setTimeout(() => setClearStatus('idle'), 4000);
      return;
    }
    clearAll();
    setClearStatus('idle');
  };

  if (isInitialLoading) {
    return <Loader isCentered caption="Loading saved watchlist..." />;
  }

  return (
    <div className={css.container}>
      <section className={css.savedSection}>
        {savedMovies.length > 0 && (
          <div className={css.headerContainer}>
            <div className={css.titleRow}>
              <h1 className={css.mainTitle}>
                <span className={css.titleIcon} aria-hidden="true">
                  🔖
                </span>
                Saved Watchlist
                <span className={css.countBadge}>
                  {savedMovies.length} {savedMovies.length === 1 ? 'title' : 'titles'}
                </span>
              </h1>

              <button
                type="button"
                className={`${css.clearAllBtn} ${
                  clearStatus === 'confirming' ? css.clearAllBtnConfirm : ''
                }`}
                onClick={handleClear}
                title={
                  clearStatus === 'confirming'
                    ? 'Click again to permanently clear all saved titles'
                    : 'Clear all saved titles from your watchlist'
                }
              >
                {clearStatus === 'confirming'
                  ? '⚠️ Confirm Clear All'
                  : '🗑️ Clear Watchlist'}
              </button>
            </div>
            <p className={css.subtitle}>
              Your personal collection of saved movies and series stored directly in your browser.
            </p>
          </div>
        )}

        {savedMovies.length > 0 && (
          <div className={css.controlsRow}>
            <div className={css.filterTabs}>
              <button
                type="button"
                className={`${css.filterPill} ${
                  filterType === 'all' ? css.filterPillActive : ''
                }`}
                onClick={() => setFilterType('all')}
              >
                All ({savedMovies.length})
              </button>
              <button
                type="button"
                className={`${css.filterPill} ${
                  filterType === 'movie' ? css.filterPillActive : ''
                }`}
                onClick={() => setFilterType('movie')}
              >
                🎬 Movies ({moviesCount})
              </button>
              <button
                type="button"
                className={`${css.filterPill} ${
                  filterType === 'tv' ? css.filterPillActive : ''
                }`}
                onClick={() => setFilterType('tv')}
              >
                📺 Series ({tvCount})
              </button>
            </div>
          </div>
        )}

        {filteredMovies.length > 0 ? (
          <ul className={css.movieGrid}>
            {filteredMovies.map(movie => {
              const title = movie.title || movie.name;
              return (
                <li key={movie.id} className={css.movieCard}>
                  <Link
                    to={`/movies/${movie.id}${
                      movie.media_type === 'tv' ? '?type=tv' : ''
                    }`}
                    state={{ from: location, mediaType: movie.media_type }}
                    className={css.movieLink}
                    draggable="false"
                    onClick={e => {
                      const selection = window.getSelection();
                      if (
                        selection &&
                        selection.toString().trim().length > 0 &&
                        e.currentTarget.contains(selection.anchorNode)
                      ) {
                        e.preventDefault();
                        return;
                      }
                      if (movie.media_type) {
                        setMediaType(movie.id, movie.media_type);
                      }
                    }}
                  >
                    <div className={css.posterWrapper}>
                      <img
                        src={
                          movie.poster_path
                            ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                            : 'https://placehold.co/342x513/2a2a2a/ffffff?text=No+Poster'
                        }
                        alt={title}
                        className={css.poster}
                        loading="lazy"
                      />
                      <MovieCardRatingBadge movieId={movie.id} />
                      <MediaTypeBadge
                        mediaType={movie.media_type}
                        item={movie}
                      />
                      <SaveMovieButton movie={movie} />
                    </div>
                    <div className={css.titleWrapper}>
                      <span className={css.movieTitle}>{title}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div
            className={`${css.emptyState} ${
              savedMovies.length === 0 ? css.emptyStateFull : ''
            }`}
          >
            <h2 className={css.emptyTitle}>
              {savedMovies.length === 0
                ? 'Your watchlist is empty'
                : 'No titles found for this category'}
            </h2>
            <p className={css.emptyText}>
              {savedMovies.length === 0
                ? 'Explore trending movies and series or use the search bar to find titles you want to watch later.'
                : 'You have no saved titles in this specific category yet.'}
            </p>
            {savedMovies.length === 0 && (
              <div className={css.emptyActions}>
                <Link to="/trending" className={css.primaryCta}>
                  <span>🔥 Explore Trending Now</span>
                </Link>
                <Link to="/movies" className={css.secondaryCta}>
                  <span>🔍 Search Film Titles</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Saved;
