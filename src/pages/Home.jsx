import { getTrendingMovies } from 'fetch';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import css from './Home.module.css';

export const Home = () => {
  const [moviesArr, setMoviesArr] = useState([]);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    const fetchTrendingMovies = async () => {
      try {
        const data = await getTrendingMovies();
        if (isMounted) {
          setMoviesArr(data.results || []);
        }
      } catch (error) {
        console.error('Failed to fetch trending movies:', error);
      }
    };
    fetchTrendingMovies();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={css.container}>
      <h1 className={css.mainTitle}>Trending Today</h1>
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
                  <img
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                        : 'https://placehold.co/342x513/2a2a2a/ffffff?text=No+Poster'
                    }
                    alt={title}
                    className={css.poster}
                  />
                  <div className={css.titleWrapper}>
                    <span className={css.movieTitle}>{title}</span>
                  </div>
                </Link>
              </li>
            );
          })}
      </ul>
    </div>
  );
};

export default Home;
