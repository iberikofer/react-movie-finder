import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { searchMedia, discoverMedia, setMediaType } from 'fetch';
import MovieCardRatingBadge from '../components/CriticsScore/MovieCardRatingBadge';
import FilterBar from '../components/FilterBar/FilterBar';
import Loader from '../components/Loader/Loader';
import MediaTypeBadge from '../components/MediaTypeBadge/MediaTypeBadge';
import SaveMovieButton from '../components/SaveMovieButton/SaveMovieButton';
import {
  savePageSession,
  getPageSession,
  updatePageScroll,
} from '../utils/sessionStorage';
import css from './Movies.module.css';

let hasLoadedSearchOnce = false;

export const Movies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const rawGenres = searchParams.get('genres') || searchParams.get('genre') || '';
  const selectedGenres = useMemo(() => {
    if (!rawGenres.trim()) return [];
    return rawGenres
      .split(',')
      .map(id => Number(id.trim()))
      .filter(id => !isNaN(id) && id > 0);
  }, [rawGenres]);

  const queryText = searchParams.get('query') || '';
  const filterType = searchParams.get('type') || 'all';
  const filterAge = searchParams.get('age') || 'all';
  const sortBy = searchParams.get('sort') || 'popularity.desc';

  const filterKey = `${queryText.trim().toLowerCase()}|${rawGenres}|${filterType}|${filterAge}|${sortBy}`;

  const restoredSessionRef = useRef(null);
  if (!restoredSessionRef.current) {
    const saved = getPageSession('movies_session');
    if (
      saved &&
      saved.filterKey === filterKey &&
      Array.isArray(saved.movies) &&
      saved.movies.length > 0
    ) {
      restoredSessionRef.current = saved;
    }
  }

  const [movies, setMovies] = useState(
    () => restoredSessionRef.current?.movies || []
  );
  const [page, setPage] = useState(
    () => restoredSessionRef.current?.page || 1
  );
  const [totalPages, setTotalPages] = useState(
    () => restoredSessionRef.current?.totalPages || 1
  );
  const [isInitialLoading, setIsInitialLoading] = useState(
    () => !hasLoadedSearchOnce && !restoredSessionRef.current
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPendingDebounce, setIsPendingDebounce] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const hasRestoredForFilterRef = useRef(Boolean(restoredSessionRef.current));

  const hasActiveFilters =
    filterType !== 'all' ||
    filterAge !== 'all' ||
    selectedGenres.length > 0 ||
    sortBy !== 'popularity.desc';

  const updateFilterParams = useCallback(
    overrides => {
      const next = {
        query: queryText,
        genres: rawGenres,
        type: filterType,
        age: filterAge,
        sort: sortBy,
        ...overrides,
      };
      const params = {};
      if (next.query && next.query.trim()) params.query = next.query.trim();
      if (next.genres && next.genres.trim()) params.genres = next.genres.trim();
      if (next.type && next.type !== 'all') params.type = next.type;
      if (next.age && next.age !== 'all') params.age = next.age;
      if (next.sort && next.sort !== 'popularity.desc') params.sort = next.sort;
      setSearchParams(params);
    },
    [queryText, rawGenres, filterType, filterAge, sortBy, setSearchParams]
  );

  const handleTypeChange = newType => {
    updateFilterParams({ type: newType });
  };

  const handleAgeChange = newAge => {
    updateFilterParams({ age: newAge });
  };

  const handleSortChange = newSort => {
    updateFilterParams({ sort: newSort });
  };

  const handleToggleGenre = genreId => {
    let updated;
    if (selectedGenres.includes(genreId)) {
      updated = selectedGenres.filter(id => id !== genreId);
    } else {
      updated = [...selectedGenres, genreId];
    }
    updateFilterParams({ genres: updated.length > 0 ? updated.join(',') : '' });
  };

  const handleClearGenres = () => {
    updateFilterParams({ genres: '' });
  };

  const handleResetAllFilters = () => {
    const params = {};
    if (queryText.trim()) params.query = queryText.trim();
    setSearchParams(params);
  };

  useEffect(() => {
    if (!hasLoadedSearchOnce && !restoredSessionRef.current) {
      const timer = setTimeout(() => {
        hasLoadedSearchOnce = true;
        setIsInitialLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Restore scroll position when restored from session
  useEffect(() => {
    if (restoredSessionRef.current?.scrollY > 0) {
      const targetY = restoredSessionRef.current.scrollY;
      const restore = () => {
        window.scrollTo({ top: targetY, behavior: 'instant' });
      };
      requestAnimationFrame(restore);
      const timer = setTimeout(restore, 40);
      return () => clearTimeout(timer);
    }
  }, []);

  // Track and save scroll position to session
  useEffect(() => {
    let scrollTimeout = null;
    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        updatePageScroll('movies_session', window.scrollY);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
      updatePageScroll('movies_session', window.scrollY);
    };
  }, []);

  const executeSearch = useCallback(
    async query => {
      if (!query.trim()) {
        if (!hasActiveFilters) {
          setMovies([]);
          setPage(1);
          setTotalPages(1);
          setIsLoading(false);
          setIsPendingDebounce(false);
          return;
        }
        return;
      }
      setIsPendingDebounce(false);
      setIsLoading(true);
      const startTime = Date.now();
      try {
        const data = await searchMedia(query.trim(), 1, filterType);
        const elapsed = Date.now() - startTime;
        if (elapsed < 500) {
          await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
        }
        const results = (data?.results || []).filter(movie => movie.title || movie.name);
        results.forEach(item => {
          if (item.media_type) setMediaType(item.id, item.media_type);
        });
        setMovies(results);
        setPage(1);
        setTotalPages(data.total_pages || 1);
        savePageSession('movies_session', {
          filterKey,
          movies: results,
          page: 1,
          totalPages: data.total_pages || 1,
          scrollY: 0,
        });
      } catch (error) {
        console.error('Failed to search media:', error);
        setMovies([]);
        setPage(1);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [filterType, hasActiveFilters, filterKey]
  );

  // Text search debounce effect
  useEffect(() => {
    if (hasRestoredForFilterRef.current) {
      hasRestoredForFilterRef.current = false;
      return;
    }

    if (!queryText.trim()) {
      setIsPendingDebounce(false);
      clearTimeout(debounceTimerRef.current);
      return;
    }

    setIsPendingDebounce(true);
    clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(queryText);
    }, 1500);

    return () => {
      clearTimeout(debounceTimerRef.current);
    };
  }, [queryText, executeSearch]);

  // Discovery mode effect when search query is empty
  useEffect(() => {
    if (queryText.trim()) {
      return;
    }

    if (hasRestoredForFilterRef.current) {
      hasRestoredForFilterRef.current = false;
      return;
    }

    if (!hasActiveFilters) {
      setMovies([]);
      setPage(1);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);

    const loadFilteredMedia = async () => {
      const startTime = Date.now();
      try {
        const data = await discoverMedia({
          type: filterType,
          genreIds: selectedGenres,
          age: filterAge,
          sortBy,
          page: 1,
        });
        if (!isCurrent) return;
        const elapsed = Date.now() - startTime;
        if (elapsed < 500) {
          await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
        }
        if (!isCurrent) return;
        const results = (data?.results || []).filter(movie => movie.title || movie.name);
        results.forEach(item => {
          if (item.media_type) setMediaType(item.id, item.media_type);
        });
        setMovies(results);
        setPage(1);
        setTotalPages(data?.total_pages || 1);
        savePageSession('movies_session', {
          filterKey,
          movies: results,
          page: 1,
          totalPages: data?.total_pages || 1,
          scrollY: 0,
        });
      } catch (err) {
        if (!isCurrent) return;
        console.error('Failed to discover media:', err);
        setMovies([]);
        setPage(1);
        setTotalPages(1);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    loadFilteredMedia();

    return () => {
      isCurrent = false;
    };
  }, [queryText, hasActiveFilters, filterType, selectedGenres, filterAge, sortBy, filterKey]);

  const handleSubmit = e => {
    e.preventDefault();
    clearTimeout(debounceTimerRef.current);
    executeSearch(queryText);
  };

  const handleInputChange = e => {
    const value = e.target.value;
    updateFilterParams({ query: value });
  };

  const handleClear = () => {
    clearTimeout(debounceTimerRef.current);
    setIsPendingDebounce(false);
    updateFilterParams({ query: '' });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    try {
      let data;
      if (queryText.trim()) {
        data = await searchMedia(queryText.trim(), nextPage, filterType);
      } else {
        data = await discoverMedia({
          type: filterType,
          genreIds: selectedGenres,
          age: filterAge,
          sortBy,
          page: nextPage,
        });
      }

      if (data?.results) {
        const newResults = data.results.filter(movie => movie.title || movie.name);
        newResults.forEach(item => {
          if (item.media_type) setMediaType(item.id, item.media_type);
        });
        if (newResults.length === 0) {
          setTotalPages(page);
        } else {
          setMovies(prev => {
            const existingKeys = new Set(prev.map(m => `${m.media_type || 'movie'}-${m.id}`));
            const uniqueNew = newResults.filter(
              m => !existingKeys.has(`${m.media_type || 'movie'}-${m.id}`)
            );
            const updated = [...prev, ...uniqueNew];
            savePageSession('movies_session', {
              filterKey,
              movies: updated,
              page: nextPage,
              totalPages: data.total_pages || 1,
              scrollY: Math.round(window.scrollY),
            });
            return updated;
          });
          setPage(nextPage);
          setTotalPages(data.total_pages || 1);
        }
      }
    } catch (error) {
      console.error('Failed to load more media:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const displayedMovies = useMemo(() => {
    let list = movies;
    if (queryText.trim()) {
      if (selectedGenres.length > 0) {
        list = list.filter(
          movie =>
            Array.isArray(movie.genre_ids) &&
            selectedGenres.every(id => movie.genre_ids.includes(Number(id)))
        );
      }
      if (filterType !== 'all') {
        list = list.filter(m => m.media_type === filterType);
      }
      if (sortBy === 'vote_average.desc') {
        list = [...list].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      } else if (sortBy === 'primary_release_date.desc') {
        list = [...list].sort((a, b) => {
          const dateA = a.release_date || a.first_air_date || '';
          const dateB = b.release_date || b.first_air_date || '';
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateB.localeCompare(dateA);
        });
      } else if (sortBy === 'original_title.asc') {
        list = [...list].sort((a, b) => {
          const nameA = (a.title || a.name || '').trim();
          const nameB = (b.title || b.name || '').trim();
          return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        });
      } else {
        list = [...list].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      }
    }

    // Grid row alignment:
    // If more items can be loaded (page < totalPages), align the displayed count
    // to a full multiple of 5 columns so the grid never shows an incomplete row with an empty slot.
    const GRID_COLUMNS = 5;
    const hasMore = page < totalPages;
    if (hasMore) {
      const fullCount = Math.floor(list.length / GRID_COLUMNS) * GRID_COLUMNS;
      if (fullCount > 0) {
        return list.slice(0, fullCount);
      }
    }

    return list;
  }, [movies, queryText, selectedGenres, filterType, sortBy, page, totalPages]);

  if (isInitialLoading) {
    return <Loader isCentered caption="Loading search..." />;
  }

  return (
    <div className={css.searchSection}>
      <div className={css.headerSection}>
        <h1 className={css.mainTitle}>
          <span className={css.titleIcon} aria-hidden="true">
            🔎
          </span>
          Search movies & shows by title
        </h1>
      </div>

      <form className={css.searchForm} onSubmit={handleSubmit} role="search">
        <div className={css.formInner}>
          <div className={css.searchCard}>
            <div className={css.inputWrapper}>
              <input
                ref={inputRef}
                className={css.searchInput}
                type="search"
                placeholder="e.g. Batman Ninja"
                aria-label="Search movies & shows by title"
                value={queryText}
                onChange={handleInputChange}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                autoFocus
              />
              {queryText && (
                <button
                  type="button"
                  className={css.clearBtn}
                  onClick={handleClear}
                  aria-label="Clear search input"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <FilterBar
              type={filterType}
              onTypeChange={handleTypeChange}
              age={filterAge}
              onAgeChange={handleAgeChange}
              selectedGenres={selectedGenres}
              onToggleGenre={handleToggleGenre}
              onClearGenres={handleClearGenres}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              onResetFilters={handleResetAllFilters}
              hasActiveFilters={hasActiveFilters}
              variant="attached"
              isFocused={isInputFocused}
            />
          </div>

          {isPendingDebounce && (
            <div className={css.debounceStatus}>
              <span className={css.debounceIcon}>⏳</span>
              <span className={css.debounceText}>
                Searching in 1.5s... or press{' '}
                <kbd className={css.enterKey}>Enter ⏎</kbd> to search now
              </span>
              <button type="submit" className={css.instantSearchBtn}>
                Search now
              </button>
            </div>
          )}
        </div>
      </form>

      {isPendingDebounce || isLoading ? (
        <Loader
          caption={
            queryText
              ? `Searching for "${queryText}"...`
              : 'Loading titles matching filters...'
          }
        />
      ) : displayedMovies.length > 0 ? (
        <>
          <ul className={css.movieGrid}>
            {displayedMovies.map(movie => {
              const title = movie.title || movie.name;
              return (
                <li key={movie.id} className={css.movieCard}>
                  <Link
                    to={`/movies/${movie.id}`}
                    state={{ from: location, mediaType: movie.media_type }}
                    className={css.movieLink}
                    draggable="false"
                    onClick={e => {
                      updatePageScroll('movies_session', window.scrollY);
                      const selection = window.getSelection();
                      if (
                        selection &&
                        selection.toString().trim().length > 0 &&
                        e.currentTarget.contains(selection.anchorNode)
                      ) {
                        e.preventDefault();
                        return;
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
                        alt={title || 'Media poster'}
                        className={css.poster}
                      />
                      <MovieCardRatingBadge movieId={movie.id} />
                      <MediaTypeBadge mediaType={movie.media_type} item={movie} />
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

          {page < totalPages && (
            <div className={css.loadMoreContainer}>
              <button
                type="button"
                className={css.loadMoreBtn}
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <span className={css.spinnerIcon}>⏳</span>
                    <span>Loading more titles...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Titles</span>
                    <span className={css.loadMoreArrow}>↓</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        (queryText || hasActiveFilters) && (
          <p className={css.noResults}>
            {queryText
              ? `No titles found matching the selected filters for "${queryText}"`
              : 'No titles found matching the selected filters'}
          </p>
        )
      )}
    </div>
  );
};

export default Movies;
