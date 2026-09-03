import { useState, useEffect } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { getMovies } from 'fetch';
import css from './Movies.module.css';

export const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const queryText = searchParams.get('query') || '';

  useEffect(() => {
    if (!queryText.trim()) {
      setMovies([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const debounceTimer = setTimeout(() => {
      const fetchQueryMovies = async () => {
        try {
          const data = await getMovies(queryText.trim());
          if (isMounted) {
            setMovies(data.results || []);
          }
        } catch (error) {
          console.error('Failed to search movies:', error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };
      fetchQueryMovies();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [queryText]);

  const handleSubmit = e => e.preventDefault();

  const handleInputChange = e => {
    const value = e.target.value;
    if (value.trim()) {
      setSearchParams({ query: value });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className={css.searchSection}>
      <form className={css.searchForm} onSubmit={handleSubmit} role="search">
        <input
          className={css.searchInput}
          type="search"
          placeholder="Start typing movie name..."
          aria-label="Search movies"
          value={queryText}
          onChange={handleInputChange}
          autoFocus
        />
      </form>

      {movies.length > 0 ? (
        <ul className={css.movieGrid}>
          {movies.map(movie => {
            const title = movie.title || movie.name;
            return (
              <li key={movie.id} className={css.movieCard}>
                <Link
                  to={`/movies/${movie.id}`}
                  state={{ from: location }}
                  className={css.movieLink}
                >
                  <img
                    className={css.poster}
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                        : 'https://placehold.co/342x513/2a2a2a/ffffff?text=No+Poster'
                    }
                    alt={title || 'Movie poster'}
                  />
                  <div className={css.titleWrapper}>
                    <span className={css.movieTitle}>{title}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        queryText && (
          <p className={css.noResults}>
            {isLoading
              ? `Searching for "${queryText}"...`
              : `No movies found for "${queryText}"`}
          </p>
        )
      )}
    </div>
  );
};

export default Movies;
