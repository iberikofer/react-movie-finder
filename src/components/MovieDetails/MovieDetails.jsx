import { getMovieDetails } from 'fetch';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useLocation, Link, NavLink, Outlet } from 'react-router-dom';
import CriticsScore from '../CriticsScore/CriticsScore';
import Loader from '../Loader/Loader';
import css from './MovieDetails.module.css';

export const MovieDetails = () => {
  const [selectedMovie, setSelectedMovie] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { movieId } = useParams();
  const location = useLocation();
  const backLinkHref = location.state?.from ?? '/';

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchDetails = async () => {
      try {
        const data = await getMovieDetails(movieId);
        if (isMounted) {
          setSelectedMovie(data);
        }
      } catch (error) {
        console.error('Failed to load movie details:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
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

      {isLoading ? (
        <Loader caption="Loading movie details..." />
      ) : (
        <>
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
              <h1 className={css.movieTitle}>{selectedMovie.title}</h1>

              <div className={css.scoreSection}>
                <p className={css.score}>
                  <strong className={css.tmdbBadge}>TMDB Score:</strong>{' '}
                  <span className={css.tmdbValue}>
                    {selectedMovie.vote_average
                      ? `${Math.round(selectedMovie.vote_average * 10)}%`
                      : 'N/A'}
                  </span>
                </p>

                {/* Custom 5-star Critics Score Component */}
                <CriticsScore movieId={movieId} />
              </div>

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
            </div>
          </article>

          {/* 3 Buttons directly attached flush below the movie details card */}
          <nav className={css.subnavGrid} aria-label="Movie sections">
            <NavLink
              to="rating"
              preventScrollReset={true}
              state={{ from: backLinkHref }}
              onClick={() => {
                const currentY = window.scrollY;
                setTimeout(() => window.scrollTo({ top: currentY, behavior: 'instant' }), 0);
              }}
              className={({ isActive }) =>
                `${css.navTile} ${isActive ? css.navTileActive : ''}`
              }
            >
              <span className={css.navTileIcon}>★</span>
              <span className={css.navTileLabel}>Critics Rating</span>
            </NavLink>
            <NavLink
              to="cast"
              preventScrollReset={true}
              state={{ from: backLinkHref }}
              onClick={() => {
                const currentY = window.scrollY;
                setTimeout(() => window.scrollTo({ top: currentY, behavior: 'instant' }), 0);
              }}
              className={({ isActive }) =>
                `${css.navTile} ${isActive ? css.navTileActive : ''}`
              }
            >
              <span className={css.navTileIcon}>👥</span>
              <span className={css.navTileLabel}>Cast & Crew</span>
            </NavLink>
            <NavLink
              to="reviews"
              preventScrollReset={true}
              state={{ from: backLinkHref }}
              onClick={() => {
                const currentY = window.scrollY;
                setTimeout(() => window.scrollTo({ top: currentY, behavior: 'instant' }), 0);
              }}
              className={({ isActive }) =>
                `${css.navTile} ${isActive ? css.navTileActive : ''}`
              }
            >
              <span className={css.navTileIcon}>💬</span>
              <span className={css.navTileLabel}>Community Reviews</span>
            </NavLink>
          </nav>

          <div key={location.pathname} className={css.outletWrapper}>
            <Suspense fallback={<Loader caption="Loading section..." />}>
              <Outlet />
            </Suspense>
          </div>
        </>
      )}
    </div>
  );
};

export default MovieDetails;
