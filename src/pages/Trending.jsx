import { getTrendingMovies } from 'fetch';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MovieCardRatingBadge from '../components/CriticsScore/MovieCardRatingBadge';
import Loader from '../components/Loader/Loader';
import css from './Trending.module.css';

export const Trending = () => {
  const [moviesArr, setMoviesArr] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    const fetchTrendingMovies = async () => {
      try {
        const data = await getTrendingMovies();
        if (isMounted) {
          setMoviesArr(data.results || []);
        }
      } catch (error) {
        console.error('Failed to fetch trending movies:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchTrendingMovies();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={css.container}>
      <div className={css.headerSection}>
        <span className={css.sectionBadge}>🔥 Hot Right Now</span>
        <h1 className={css.mainTitle}>Trending Today</h1>
        <p className={css.sectionDesc}>
          Explore what millions of film enthusiasts are watching right now, powered by real-time TMDB data and community reviews.
        </p>
      </div>

      {isLoading ? (
        <Loader caption="Loading trending movies..." />
      ) : (
        <ul className={css.movieGrid}>
          {moviesArr
            .filter(movie => movie.title || movie.name)
            .map(movie => {
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
                        alt={title}
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
      )}
    </div>
  );
};

export default Trending;
