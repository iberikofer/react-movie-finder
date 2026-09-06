import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { getMovies, getMoviesByGenre } from 'fetch';
import MovieCardRatingBadge from '../components/CriticsScore/MovieCardRatingBadge';
import GenreFilter from '../components/GenreFilter/GenreFilter';
import Loader from '../components/Loader/Loader';
import css from './Movies.module.css';

export const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPendingDebounce, setIsPendingDebounce] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const queryText = searchParams.get('query') || '';

  const executeSearch = useCallback(async query => {
    if (!query.trim()) {
      setMovies([]);
      setIsLoading(false);
      setIsPendingDebounce(false);
      return;
    }
    setIsPendingDebounce(false);
    setIsLoading(true);
    try {
      const data = await getMovies(query.trim());
      setMovies(data.results || []);
    } catch (error) {
      console.error('Failed to search movies:', error);
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleToggleGenre = updatedGenres => {
    setSelectedGenres(updatedGenres);
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
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);

    const loadGenreMovies = async () => {
      try {
        const data = await getMoviesByGenre(selectedGenres, 1);
        if (!isCurrent) return;
        setMovies(data?.results || []);
      } catch (err) {
        if (!isCurrent) return;
        console.error('Failed to load genre movies:', err);
        setMovies([]);
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
    if (value.trim()) {
      setSearchParams({ query: value });
    } else {
      setSearchParams({});
    }
  };

  const handleClear = () => {
    clearTimeout(debounceTimerRef.current);
    setIsPendingDebounce(false);
    setSearchParams({});
    if (inputRef.current) {
      inputRef.current.focus();
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

  return (
    <div className={css.searchSection}>
      <div className={css.headerSection}>
        <h1 className={css.mainTitle}>Search movies by title</h1>
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

      {isLoading ? (
        <Loader caption={queryText ? `Searching for "${queryText}"...` : 'Loading genre movies...'} />
      ) : displayedMovies.length > 0 ? (
        <ul className={css.movieGrid}>
          {displayedMovies.map(movie => {
            const title = movie.title || movie.name;
            return (
              <li key={movie.id} className={css.movieCard}>
                <Link
                  to={`/movies/${movie.id}`}
                  state={{ from: location }}
                  className={css.movieLink}
                >
                  <div className={css.posterWrapper}>
                    <img
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                          : 'https://placehold.co/342x513/2a2a2a/ffffff?text=No+Poster'
                      }
                      alt={title || 'Movie poster'}
                      className={css.poster}
                    />
                    <MovieCardRatingBadge movieId={movie.id} />
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
        (queryText || selectedGenres.length > 0) && (
          <p className={css.noResults}>
            {queryText
              ? `No movies found matching the selected genres for "${queryText}"`
              : 'No movies found for the selected genres'}
          </p>
        )
      )}
    </div>
  );
};

export default Movies;
