import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { setMediaType, getMovieDetails, matchesAgeFilter, isAlphabeticalTitle } from 'fetch';
import { MediaItem } from 'types';
import { useSavedMovies, getSavedMovies, SavedMediaItem } from '../hooks/useSavedMovies';
import FilterBar, { SAVED_SORT_OPTIONS } from '../components/FilterBar/FilterBar';
import MediaTypeBadge from '../components/MediaTypeBadge/MediaTypeBadge';
import AgeRatingBadge from '../components/AgeRatingBadge/AgeRatingBadge';
import MovieCardRatingBadge from '../components/CriticsScore/MovieCardRatingBadge';
import SaveMovieButton from '../components/SaveMovieButton/SaveMovieButton';
import Loader from '../components/Loader/Loader';
import { clearPageSession } from '../utils/sessionStorage';
import { useLanguage } from '../context/LanguageContext';
import css from './Saved.module.css';

let hasLoadedSavedOnce = false;
const DEFAULT_SAVED_SORT = 'popularity.desc';

const getMovieGenreIds = (movie: MediaItem): number[] => {
  if (Array.isArray(movie.genre_ids) && movie.genre_ids.length > 0) {
    return movie.genre_ids.map(Number);
  }
  if (Array.isArray(movie.genres) && movie.genres.length > 0) {
    return movie.genres.map(g => Number(typeof g === 'object' ? g.id : g));
  }
  return [];
};

const matchesAgeRating = (ratingStr: string, filterAge: string | string[]): boolean => {
  return matchesAgeFilter(ratingStr, filterAge);
};

export const Saved: React.FC = () => {
  const { t, language } = useLanguage();
  const { savedMovies, clearAll, removeMovie } = useSavedMovies();
  const [localizedTitles, setLocalizedTitles] = useState<Record<string | number, string>>({});
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(!hasLoadedSavedOnce);
  const [queryText, setQueryText] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAge, setFilterAge] = useState<string>('all');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<string>(DEFAULT_SAVED_SORT);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const [clearStatus, setClearStatus] = useState<'idle' | 'confirming'>('idle');
  const [removingIds, setRemovingIds] = useState<Set<number>>(() => new Set());
  const removeTimersRef = useRef<Map<string | number, NodeJS.Timeout>>(new Map());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    const timers = removeTimersRef.current;
    return () => {
      timers.forEach(timerId => clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!savedMovies || savedMovies.length === 0) return;
    let isMounted = true;
    const fetchLocalizedTitles = async () => {
      const titles: Record<string | number, string> = {};
      await Promise.allSettled(
        savedMovies.map(async m => {
          try {
            const cacheKey = `title_${m.id}_${language}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
              titles[m.id] = cached;
              return;
            }
            const data = await getMovieDetails(m.id, m.media_type === 'tv' ? 'tv' : 'movie');
            const locTitle = data?.title || data?.name;
            if (locTitle) {
              titles[m.id] = locTitle;
              sessionStorage.setItem(cacheKey, locTitle);
            }
          } catch {
            // ignore
          }
        })
      );
      if (isMounted) {
        setLocalizedTitles(prev => ({ ...prev, ...titles }));
      }
    };
    fetchLocalizedTitles();
    return () => {
      isMounted = false;
    };
  }, [savedMovies, language]);

  useEffect(() => {
    if (!hasLoadedSavedOnce) {
      const timer = setTimeout(() => {
        hasLoadedSavedOnce = true;
        setIsInitialLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (clearStatus !== 'confirming') return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setClearStatus('idle');
      }
    };

    const delayTimer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(delayTimer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [clearStatus]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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
              const details = await getMovieDetails(item.id, mediaType === 'tv' ? 'tv' : 'movie');
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

        const updatesMap = new Map<string, any>();
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

  const handleToggleGenre = (genreId: number) => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
    );
  };

  const handleGenresChange = (newGenres: number[]) => {
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
    let list: SavedMediaItem[] = savedMovies;

    if (filterType !== 'all') {
      list = list.filter(m => m.media_type === filterType);
    }

    if (queryText.trim()) {
      const q = queryText.trim().toLowerCase();
      list = list.filter(m => {
        const title = (localizedTitles[m.id] || m.title || m.name || '').toLowerCase();
        return title.includes(q);
      });
    }

    if (selectedGenres.length > 0) {
      list = list.filter(m => {
        const itemGenres = getMovieGenreIds(m);
        if (itemGenres.length === 0) return false;
        return selectedGenres.every(id => itemGenres.includes(Number(id)));
      });
    }

    if (filterAge !== 'all') {
      list = list.filter(m => {
        if (!m.age_rating) return false;
        return matchesAgeRating(m.age_rating, filterAge);
      });
    }

    let sorted = [...list];
    if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
      sorted = sorted.filter(m => {
        const title = localizedTitles[m.id] || m.title || m.name || '';
        return isAlphabeticalTitle(title);
      });
    }

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
        const nameA = (localizedTitles[a.id] || a.title || a.name || '').trim();
        const nameB = (localizedTitles[b.id] || b.title || b.name || '').trim();
        return nameA.localeCompare(nameB, language === 'uk' ? 'uk' : 'en', { sensitivity: 'base' });
      });
    } else if (sortBy === 'original_title.desc') {
      sorted.sort((a, b) => {
        const nameA = (localizedTitles[a.id] || a.title || a.name || '').trim();
        const nameB = (localizedTitles[b.id] || b.title || b.name || '').trim();
        return nameB.localeCompare(nameA, language === 'uk' ? 'uk' : 'en', { sensitivity: 'base' });
      });
    } else {
      sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    return sorted;
  }, [savedMovies, filterType, queryText, selectedGenres, filterAge, sortBy, localizedTitles, language]);

  const handleRemoveMovie = useCallback(
    (movie: MediaItem) => {
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

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
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
    return <Loader isCentered caption={t('saved.loading', 'Loading saved watchlist...')} />;
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
                {t('saved.title')}
                <span className={css.countBadge}>
                  {savedMovies.length} {savedMovies.length === 1 ? t('saved.titleOne') : t('saved.titles')}
                </span>
              </h1>
              <p className={css.subtitle}>
                {t('saved.subtitle')}
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
                  ? t('saved.confirmClear')
                  : t('saved.clearWatchlist')
              }
            >
              {clearStatus === 'confirming'
                ? `⚠️ ${t('saved.confirmClear')}`
                : `🗑️ ${t('saved.clearWatchlist')}`}
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
                    placeholder={t('saved.searchPlaceholder')}
                    aria-label={t('saved.searchPlaceholder')}
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
                      aria-label={t('saved.clearSearch', 'Clear search')}
                      title={t('saved.clearSearch', 'Clear search')}
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
              const title = localizedTitles[movie.id] || movie.title || movie.name;
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
                        onFilterType={setFilterType as any}
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
                ? t('saved.emptyTitle')
                : t('saved.noMatchTitle')}
            </h2>
            <p className={css.emptyText}>
              {savedMovies.length === 0
                ? t('saved.emptyDesc')
                : t('search.noResultsDesc')}
            </p>
            {savedMovies.length === 0 ? (
              <div className={css.emptyActions}>
                <Link
                  to="/trending"
                  className={css.primaryCta}
                  onClick={() => clearPageSession('trending_session')}
                >
                  <span>{t('saved.exploreTrending')}</span>
                </Link>
                <Link to="/movies" className={css.secondaryCta}>
                  <span>{t('saved.searchFilmTitles')}</span>
                </Link>
              </div>
            ) : (
              <button
                type="button"
                className={css.resetFiltersBtn}
                onClick={handleResetAllFilters}
              >
                🔄 {t('saved.resetFilters')}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Saved;
