import { useState, useEffect } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { getMovies } from 'fetch';
import css from './Movies.module.css';

export const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const queryText = searchParams.get('query') || '';

  useEffect(() => {
    if (!queryText.trim()) {
      setMovies([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      const fetchQueryMovies = async () => {
        try {
          const response = await getMovies(queryText);
          const data = await response.json();
          setMovies(data.results || []);
        } catch (error) {
          console.log(error);
        }
      };
      fetchQueryMovies();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [queryText]);
  const handleSubmit = e => e.preventDefault();

  return (
    <div className={css.searchSection}>
      <form className={css.searchForm} onSubmit={handleSubmit}>
        <input
          className={css.searchInput}
          placeholder="Start typing movie name..."
          value={queryText}
          onChange={e => setSearchParams({ query: e.target.value })}
          autoFocus
        />
      </form>

      {movies.length > 0 ? (
        <ul className={css.movieGrid}>
          {movies.map(movie => (
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
                      : 'https://via.placeholder.com/342x513?text=No+Poster'
                  }
                  alt={movie.title}
                />
                <div className={css.titleWrapper}>
                  <span className={css.movieTitle}>{movie.title}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        queryText && (
          <p className={css.noResults}>Searching for "{queryText}"...</p>
        )
      )}
    </div>
  );
};

export default Movies;
