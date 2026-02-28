import { getTrendingMovies } from 'fetch';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import css from './Home.module.css';

export const Home = () => {
  const [moviesArr, setMoviesArr] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const fetchTrendingMovies = async () => {
      try {
        await getTrendingMovies()
          .then(response => response.json())
          .then(response => setMoviesArr(response.results));
      } catch (error) {
        console.error(error);
      }
    };
    fetchTrendingMovies();
  }, []);

const moviesMarkup = moviesArr.map(movie => {
  if (movie.title) {
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
                : 'https://via.placeholder.com/342x513?text=No+Poster'
            }
            alt={movie.title}
            className={css.poster}
          />
          <div className={css.titleWrapper}>
            <span className={css.movieTitle}>{movie.title}</span>
          </div>
        </Link>
      </li>
    );
  }
  return null;
});

  return (
    <div className={css.container}>
      <h1 className={css.mainTitle}>Trending Today</h1>
      <ul className={css.movieGrid}>{moviesMarkup}</ul>
    </div>
  );
};

export default Home;
