import { getMovieDetails } from 'fetch';
import { useState, useEffect } from 'react';
import { useParams, useLocation, Link, Outlet } from 'react-router-dom';
import css from './MovieDetails.module.css';

export const MovieDetails = () => {
  const [selectedMovie, setSelectedMovie] = useState({});
  const { movieId } = useParams();
  const location = useLocation();
  const backLinkHref = location.state?.from ?? '/';

  useEffect(() => {
    const fetchDedailts = async () => {
      await getMovieDetails(movieId)
        .then(response => response.json())
        .then(response => setSelectedMovie(response));
    };
    fetchDedailts();
  }, [movieId]);

  return (
    <div className={css.pageWrapper}>
      <Link to={backLinkHref}>
        <button className={css.btn} style={{ marginLeft: '30px' }}>
          ☚ Go back
        </button>
      </Link>
      <div className={css.detailsContainer}>
        <div className={css.sidebar}>
          <div className={css.posterWrapper}>
            <img
              className={css.poster}
              src={
                selectedMovie.poster_path
                  ? `https://image.tmdb.org/t/p/w342${selectedMovie.poster_path}`
                  : 'https://via.placeholder.com/342x513?text=No+Poster'
              }
              alt={selectedMovie.title}
            />
          </div>
        </div>

        <div className={css.infoContent}>
          <h2>{selectedMovie.title}</h2>
          <p className={css.score}>
            <strong>User Score:</strong>{' '}
            {Math.round(selectedMovie.vote_average * 10)}%
          </p>

          <h3>Overview</h3>
          <p className={css.overviewText}>{selectedMovie.overview}</p>

          <h3>Genres</h3>
          <div className={css.genres}>
            {selectedMovie.genres?.map(genre => (
              <span key={genre.id} className={css.genreTag}>
                {genre.name}
              </span>
            ))}
          </div>

          <div className={css.actions}>
            <Link to={`/movies/${movieId}/cast`} state={{ from: backLinkHref }}>
              <button className={`${css.btn} ${css.btnSecondary}`}>Cast</button>
            </Link>
            <Link
              to={`/movies/${movieId}/reviews`}
              state={{ from: backLinkHref }}
            >
              <button className={`${css.btn} ${css.btnSecondary}`}>
                Reviews
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
};

export default MovieDetails;
