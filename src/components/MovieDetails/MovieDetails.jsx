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
    let isMounted = true;
    const fetchDetails = async () => {
      try {
        const data = await getMovieDetails(movieId);
        if (isMounted) {
          setSelectedMovie(data);
        }
      } catch (error) {
        console.error('Failed to load movie details:', error);
      }
    };
    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [movieId]);

  return (
    <div className={css.pageWrapper}>
      <Link to={backLinkHref} className={css.backBtn}>
        ☚ Go back
      </Link>
      <article className={css.detailsContainer}>
        <div className={css.sidebar}>
          <div className={css.posterWrapper}>
            <img
              className={css.poster}
              src={
                selectedMovie.poster_path
                  ? `https://image.tmdb.org/t/p/w342${selectedMovie.poster_path}`
                  : 'https://placehold.co/342x513/2a2a2a/ffffff?text=No+Poster'
              }
              alt={selectedMovie.title || 'Movie poster'}
            />
          </div>
        </div>

        <div className={css.infoContent}>
          <h1>{selectedMovie.title}</h1>
          <p className={css.score}>
            <strong>User Score:</strong>{' '}
            {selectedMovie.vote_average
              ? `${Math.round(selectedMovie.vote_average * 10)}%`
              : 'N/A'}
          </p>

          <h2>Overview</h2>
          <p className={css.overviewText}>
            {selectedMovie.overview || 'No overview available.'}
          </p>

          <h2>Genres</h2>
          <div className={css.genres}>
            {selectedMovie.genres && selectedMovie.genres.length > 0 ? (
              selectedMovie.genres.map(genre => (
                <span key={genre.id} className={css.genreTag}>
                  {genre.name}
                </span>
              ))
            ) : (
              <span>No genres specified</span>
            )}
          </div>

          <div className={css.actions}>
            <Link
              to="cast"
              state={{ from: backLinkHref }}
              className={`${css.btn} ${css.btnSecondary}`}
            >
              Cast
            </Link>
            <Link
              to="reviews"
              state={{ from: backLinkHref }}
              className={`${css.btn} ${css.btnSecondary}`}
            >
              Reviews
            </Link>
          </div>
        </div>
      </article>
      <Outlet />
    </div>
  );
};

export default MovieDetails;
