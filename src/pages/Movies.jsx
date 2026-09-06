import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { getMovies, getMoviesByGenre } from 'fetch';
import MovieCardRatingBadge from '../components/CriticsScore/MovieCardRatingBadge';
import GenreFilter from '../components/GenreFilter/GenreFilter';
import Loader from '../components/Loader/Loader';
import MediaTypeBadge from '../components/MediaTypeBadge/MediaTypeBadge';
import SaveMovieButton from '../components/SaveMovieButton/SaveMovieButton';
import css from './Movies.module.css';

let hasLoadedSearchOnce = false;

export const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isInitialLoading, setIsInitialLoading] = useState(!hasLoadedSearchOnce);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPendingDebounce, setIsPendingDebounce] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Guarantee 0.5s initial centered loader ONLY on first mount / reload of Search page
  useEffect(() => {
    if (!hasLoadedSearchOnce) {
      const timer = setTimeout(() => {
        hasLoadedSearchOnce = true;
        setIsInitialLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const rawGenres = searchParams.get('genres') || '';
  const selectedGenres = useMemo(() => {
    if (!rawGenres.trim()) return [];
    return rawGenres
      .split(',')
      .map(id => Number(id.trim()))
      .filter(id => !isNaN(id) && id > 0);
  }, [rawGenres]);

  const queryText = searchParams.get('query') || '';

  const executeSearch = useCallback(async query => {
    if (!query.trim()) {
      setMovies([]);
      setPage(1);
      setTotalPages(1);
      setIsLoading(false);
      setIsPendingDebounce(false);
      return;
    }
    setIsPendingDebounce(false);
    setIsLoading(true);
    const startTime = Date.now();
    try {
      const data = await getMovies(query.trim(), 1);
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
      }
      setMovies(data.results || []);
      setPage(1);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error('Failed to search movies:', error);
      setMovies([]);
      setPage(1);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleToggleGenre = updatedGenres => {
    const newParams = {};
    if (queryText.trim()) {
      newParams.query = queryText.trim();
    }
    if (updatedGenres.length > 0) {
      newParams.genres = updatedGenres.join(',');
    }
    setSearchParams(newParams);
    if (!queryText.trim() && updatedGenres.length > 0) {
      setIsLoading(true);
    }
  };

  // Text search debounce effect
  useEffect(() => {
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

  // Genre discovery effect when search query is empty
  useEffect(() => {
    if (queryText.trim()) {
      return;
    }

    if (selectedGenres.length === 0) {
      setMovies([]);
      setPage(1);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);

    const loadGenreMovies = async () => {
      const startTime = Date.now();
      try {
        const data = await getMoviesByGenre(selectedGenres, 1);
        if (!isCurrent) return;
        const elapsed = Date.now() - startTime;
        if (elapsed < 500) {
          await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
        }
        if (!isCurrent) return;
        setMovies(data?.results || []);
        setPage(1);
        setTotalPages(data?.total_pages || 1);
      } catch (err) {
        if (!isCurrent) return;
        console.error('Failed to load genre movies:', err);
        setMovies([]);
        setPage(1);
        setTotalPages(1);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    loadGenreMovies();

    return () => {
      isCurrent = false;
    };
  }, [queryText, selectedGenres]);

  const handleSubmit = e => {
    e.preventDefault();
    clearTimeout(debounceTimerRef.current);
    executeSearch(queryText);
  };

  const handleInputChange = e => {
    const value = e.target.value;
    const newParams = {};
    if (value.trim()) {
      newParams.query = value;
    }
    if (rawGenres.trim()) {
      newParams.genres = rawGenres.trim();
    }
    setSearchParams(newParams);
  };

  const handleClear = () => {
    clearTimeout(debounceTimerRef.current);
    setIsPendingDebounce(false);
    if (rawGenres.trim()) {
      setSearchParams({ genres: rawGenres.trim() });
    } else {
      setSearchParams({});
    }
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
        data = await getMovies(queryText.trim(), nextPage);
      } else if (selectedGenres.length > 0) {
        data = await getMoviesByGenre(selectedGenres, nextPage);
      }

      if (data?.results) {
        const newResults = data.results.filter(movie => movie.title || movie.name);
        setMovies(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNew = newResults.filter(m => !existingIds.has(m.id));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to load more movies:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const displayedMovies =
    selectedGenres.length === 0 || !queryText.trim()
      ? movies
      : movies.filter(
          movie =>
            Array.isArray(movie.genre_ids) &&
            selectedGenres.every(id => movie.genre_ids.includes(Number(id)))
        );

  if (isInitialLoading) {
    return <Loader isCentered caption="Loading search..." />;
  }

  return (
    <div className={css.searchSection}>
      <div className={css.headerSection}>
        <h1 className={css.mainTitle}>Search movies & shows by title</h1>
      </div>

      <form className={css.searchForm} onSubmit={handleSubmit} role="search">
        <div className={css.formInner}>
          <div className={css.inputWrapper}>
            <input
              ref={inputRef}
              className={css.searchInput}
              type="search"
              placeholder="e.g. Batman Ninja"
              aria-label="Search movies by title"
              value={queryText}
              onChange={handleInputChange}
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

      <GenreFilter
        selectedGenres={selectedGenres}
        onToggleGenre={handleToggleGenre}
        allLabel="All Genres"
      />

      {isPendingDebounce || isLoading ? (
        <Loader caption={queryText ? `Searching for "${queryText}"...` : 'Loading genre titles...'} />
      ) : displayedMovies.length > 0 ? (
        <>
          <ul className={css.movieGrid}>
            {displayedMovies.map(movie => {
              const title = movie.title || movie.name;
              return (
                <li key={movie.id} className={css.movieCard}>
                  <Link
                    to={`/movies/${movie.id}`}
                    state={{ from: location }}
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
        (queryText || selectedGenres.length > 0) && (
          <p className={css.noResults}>
            {queryText
              ? `No titles found matching the selected genres for "${queryText}"`
              : 'No titles found for the selected genres'}
          </p>
        )
      )}
    </div>
  );
};

export default Movies;
