import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { setMediaType, getMovieDetails, matchesAgeFilter } from 'fetch';
import { useSavedMovies, getSavedMovies } from '../hooks/useSavedMovies';
import FilterBar, { SAVED_SORT_OPTIONS } from '../components/FilterBar/FilterBar';
import MediaTypeBadge from '../components/MediaTypeBadge/MediaTypeBadge';
import AgeRatingBadge from '../components/AgeRatingBadge/AgeRatingBadge';
import MovieCardRatingBadge from '../components/CriticsScore/MovieCardRatingBadge';
import SaveMovieButton from '../components/SaveMovieButton/SaveMovieButton';
import Loader from '../components/Loader/Loader';
import { clearPageSession } from '../utils/sessionStorage';
import css from './Saved.module.css';

let hasLoadedSavedOnce = false;
const DEFAULT_SAVED_SORT = 'popularity.desc';

const getMovieGenreIds = movie => {
  if (Array.isArray(movie.genre_ids) && movie.genre_ids.length > 0) {
    return movie.genre_ids.map(Number);
  }
  if (Array.isArray(movie.genres) && movie.genres.length > 0) {
    return movie.genres.map(g => Number(typeof g === 'object' ? g.id : g));
  }
  return [];
};

const matchesAgeRating = (ratingStr, filterAge) => {
  return matchesAgeFilter(ratingStr, filterAge);
};

export const Saved = () => {
  const { savedMovies, clearAll, removeMovie } = useSavedMovies();
  const [isInitialLoading, setIsInitialLoading] = useState(!hasLoadedSavedOnce);
  const [queryText, setQueryText] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'movie', 'tv'
  const [filterAge, setFilterAge] = useState('all');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortBy, setSortBy] = useState(DEFAULT_SAVED_SORT);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [clearStatus, setClearStatus] = useState('idle'); // 'idle', 'confirming'
  const [removingIds, setRemovingIds] = useState(() => new Set());
  const removeTimersRef = useRef(new Map());
  const timerRef = useRef(null);
  const buttonRef = useRef(null);
  const inputRef = useRef(null);
  const location = useLocation();

  // Cleanup removal timers on unmount
  useEffect(() => {
    const timers = removeTimersRef.current;
    return () => {
      timers.forEach(timerId => clearTimeout(timerId));
      timers.clear();
    };
  }, []);

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

  // Handle outside click when in 'confirming' state
  useEffect(() => {
    if (clearStatus !== 'confirming') return;

    const handleOutsideClick = event => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setClearStatus('idle');
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
  }, [clearStatus]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Auto-enrich existing saved movies in background if they lack genre_ids, age_rating, or popularity
  useEffect(() => {
    if (!savedMovies || savedMovies.length === 0) return;

    const unpopulated = savedMovies.filter(
      m =>
        !Array.isArray(m.genre_ids) ||
        m.genre_ids.length === 0 ||
        !m.age_rating ||
        !m.popularity
    );
    if (unpopulated.length === 0) return;

    let isCancelled = false;

    const enrichItems = async () => {
      try {
        const enrichedResults = await Promise.allSettled(
          unpopulated.map(async item => {
            try {
              const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
              const details = await getMovieDetails(item.id, mediaType);
              if (!details) return null;
              const genreIds = Array.isArray(details.genres)
                ? details.genres.map(g => (typeof g === 'object' ? g.id : g))
                : Array.isArray(details.genre_ids)
                ? details.genre_ids
                : [];
              return {
                id: item.id,
                genre_ids: genreIds,
                age_rating: details.age_rating || null,
                popularity: details.popularity || item.popularity || 0,
              };
            } catch {
              return null;
            }
          })
        );

        if (isCancelled) return;

        const updatesMap = new Map();
        enrichedResults.forEach(res => {
          if (res.status === 'fulfilled' && res.value && res.value.id) {
            updatesMap.set(String(res.value.id), res.value);
          }
        });

        if (updatesMap.size > 0) {
          const current = getSavedMovies();
          let hasChange = false;
          const updatedList = current.map(m => {
            const update = updatesMap.get(String(m.id));
            if (update) {
              const newGenres =
                Array.isArray(m.genre_ids) && m.genre_ids.length > 0
                  ? m.genre_ids
                  : update.genre_ids;
              const newAge = m.age_rating || update.age_rating;
              const newPop = m.popularity || update.popularity;

              if (
                newGenres !== m.genre_ids ||
                newAge !== m.age_rating ||
                newPop !== m.popularity
              ) {
                hasChange = true;
                return {
                  ...m,
                  genre_ids: newGenres,
                  age_rating: newAge,
                  popularity: newPop,
                };
              }
            }
            return m;
          });

          if (hasChange) {
            localStorage.setItem('movie_finder_saved_movies', JSON.stringify(updatedList));
            window.dispatchEvent(
              new CustomEvent('saved_movies_updated', {
                detail: { enriched: true },
              })
            );
          }
        }
      } catch (err) {
        console.error('Failed to enrich saved movies:', err);
      }
    };

    enrichItems();

    return () => {
      isCancelled = true;
    };
  }, [savedMovies]);

  const hasActiveFilters =
    Boolean(queryText.trim()) ||
    filterType !== 'all' ||
    filterAge !== 'all' ||
    selectedGenres.length > 0 ||
    sortBy !== DEFAULT_SAVED_SORT;

  const handleToggleGenre = genreId => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
    );
  };

  const handleGenresChange = newGenres => {
    setSelectedGenres(newGenres);
  };

  const handleResetAllFilters = () => {
    setQueryText('');
    setFilterType('all');
    setFilterAge('all');
    setSelectedGenres([]);
    setSortBy(DEFAULT_SAVED_SORT);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const filteredMovies = useMemo(() => {
    let list = savedMovies;

    // Filter by Type (movie / tv)
    if (filterType !== 'all') {
      list = list.filter(m => m.media_type === filterType);
    }

    // Filter by Query (text search in title or name)
    if (queryText.trim()) {
      const q = queryText.trim().toLowerCase();
      list = list.filter(m => {
        const title = (m.title || m.name || '').toLowerCase();
        return title.includes(q);
      });
    }

    // Filter by Genres
    if (selectedGenres.length > 0) {
      list = list.filter(m => {
        const itemGenres = getMovieGenreIds(m);
        if (itemGenres.length === 0) return false;
        return selectedGenres.every(id => itemGenres.includes(Number(id)));
      });
    }

    // Filter by Age rating
    if (filterAge !== 'all') {
      list = list.filter(m => {
        if (!m.age_rating) return false;
        return matchesAgeRating(m.age_rating, filterAge);
      });
    }

    // Sorting
    const sorted = [...list];
    if (sortBy === 'saved_at.desc') {
      sorted.sort((a, b) => {
        const timeA = a.savedAt || 0;
        const timeB = b.savedAt || 0;
        if (timeA && timeB) return timeB - timeA;
        if (timeA) return -1;
        if (timeB) return 1;
        return savedMovies.indexOf(a) - savedMovies.indexOf(b);
      });
    } else if (sortBy === 'saved_at.asc') {
      sorted.sort((a, b) => {
        const timeA = a.savedAt || 0;
        const timeB = b.savedAt || 0;
        if (timeA && timeB) return timeA - timeB;
        if (timeA) return 1;
        if (timeB) return -1;
        return savedMovies.indexOf(b) - savedMovies.indexOf(a);
      });
    } else if (sortBy === 'vote_average.desc') {
      sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else if (sortBy === 'primary_release_date.desc') {
      sorted.sort((a, b) => {
        const dateA = a.release_date || a.first_air_date || '';
        const dateB = b.release_date || b.first_air_date || '';
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.localeCompare(dateA);
      });
    } else if (sortBy === 'original_title.asc') {
      sorted.sort((a, b) => {
        const nameA = (a.title || a.name || '').trim();
        const nameB = (b.title || b.name || '').trim();
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      });
    } else {
      // Default: popularity.desc
      sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    return sorted;
  }, [savedMovies, filterType, queryText, selectedGenres, filterAge, sortBy]);

  const handleRemoveMovie = useCallback(
    movie => {
      if (!movie || !movie.id) return;
      const movieId = movie.id;
      setRemovingIds(prev => {
        if (prev.has(movieId)) return prev;
        const next = new Set(prev);
        next.add(movieId);
        return next;
      });

      const timerId = setTimeout(() => {
        removeMovie(movieId);
        removeTimersRef.current.delete(movieId);
        setRemovingIds(prev => {
          const next = new Set(prev);
          next.delete(movieId);
          return next;
        });
      }, 320);

      removeTimersRef.current.set(movieId, timerId);
    },
    [removeMovie]
  );

  const handleClear = event => {
    event.stopPropagation();
    if (clearStatus === 'idle') {
      setClearStatus('confirming');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setClearStatus('idle');
      }, 4000);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    const allIds = filteredMovies.map(m => m.id);
    setRemovingIds(new Set(allIds));
    const timerId = setTimeout(() => {
      clearAll();
      setClearStatus('idle');
      setRemovingIds(new Set());
    }, 320);
    removeTimersRef.current.set('clear_all', timerId);
  };

  if (isInitialLoading) {
    return <Loader isCentered caption="Loading saved watchlist..." />;
  }

  return (
    <div className={css.container}>
      <section className={css.savedSection}>
        {savedMovies.length > 0 && (
          <div className={css.headerContainer}>
            <div className={css.headerLeft}>
              <h1 className={css.mainTitle}>
                <span className={css.titleIcon} aria-hidden="true">
                  🔖
                </span>
                Saved Watchlist
                <span className={css.countBadge}>
                  {savedMovies.length} {savedMovies.length === 1 ? 'title' : 'titles'}
                </span>
              </h1>
              <p className={css.subtitle}>
                Your personal collection of saved movies and series stored directly in your browser.
              </p>
            </div>

            <button
              ref={buttonRef}
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
        )}

        {savedMovies.length > 0 && (
          <form className={css.searchForm} onSubmit={e => e.preventDefault()} role="search">
            <div className={css.formInner}>
              <div className={css.searchCard}>
                <div className={css.inputWrapper}>
                  <input
                    ref={inputRef}
                    className={css.searchInput}
                    type="search"
                    placeholder="Search saved movies & series..."
                    aria-label="Search saved movies & series"
                    value={queryText}
                    onChange={e => setQueryText(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                  />
                  {queryText && (
                    <button
                      type="button"
                      className={css.clearBtn}
                      onClick={() => {
                        setQueryText('');
                        if (inputRef.current) inputRef.current.focus();
                      }}
                      aria-label="Clear search input"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <FilterBar
                  type={filterType}
                  onTypeChange={setFilterType}
                  age={filterAge}
                  onAgeChange={setFilterAge}
                  selectedGenres={selectedGenres}
                  onToggleGenre={handleToggleGenre}
                  onClearGenres={() => setSelectedGenres([])}
                  onGenresChange={handleGenresChange}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onResetFilters={handleResetAllFilters}
                  hasActiveFilters={hasActiveFilters}
                  variant="attached"
                  isFocused={isInputFocused}
                  sortOptions={SAVED_SORT_OPTIONS}
                  defaultSort={DEFAULT_SAVED_SORT}
                />
              </div>
            </div>
          </form>
        )}

        {filteredMovies.length > 0 ? (
          <ul className={css.movieGrid}>
            {filteredMovies.map(movie => {
              const title = movie.title || movie.name;
              const isRemoving = removingIds.has(movie.id);
              return (
                <li
                  key={movie.id}
                  className={`${css.movieCard} ${
                    isRemoving ? css.movieCardRemoving : ''
                  }`}
                >
                  <Link
                    to={`/movies/${movie.id}${
                      movie.media_type === 'tv' ? '?type=tv' : ''
                    }`}
                    state={{ from: location, mediaType: movie.media_type, source: 'saved' }}
                    className={css.movieLink}
                    draggable="false"
                    onClick={e => {
                      sessionStorage.setItem('movie_origin_tab', 'saved');
                      if (isRemoving) {
                        e.preventDefault();
                        return;
                      }
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
                        onFilterType={setFilterType}
                      />
                      <AgeRatingBadge
                        movie={movie}
                        onFilterAge={setFilterAge}
                      />
                      <SaveMovieButton
                        movie={movie}
                        onBeforeRemove={handleRemoveMovie}
                      />
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
                : 'No saved titles match your filters'}
            </h2>
            <p className={css.emptyText}>
              {savedMovies.length === 0
                ? 'Explore trending movies and series or use the search bar to find titles you want to watch later.'
                : 'Try adjusting your search query, format, genres, or age filters.'}
            </p>
            {savedMovies.length === 0 ? (
              <div className={css.emptyActions}>
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
              </div>
            ) : (
              <button
                type="button"
                className={css.resetFiltersBtn}
                onClick={handleResetAllFilters}
              >
                🔄 Reset Filters
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Saved;
