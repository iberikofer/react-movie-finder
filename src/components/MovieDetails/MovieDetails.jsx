import { getMovieDetails, setMediaType } from 'fetch';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useLocation, useSearchParams, Link, NavLink, Outlet } from 'react-router-dom';
import CriticsScore from '../CriticsScore/CriticsScore';
import { getGenreIcon } from '../GenreFilter/GenreFilter';
import Loader from '../Loader/Loader';
import MediaTypeBadge from '../MediaTypeBadge/MediaTypeBadge';
import SaveMovieButton from '../SaveMovieButton/SaveMovieButton';
import MovieGallery from './MovieGallery';
import css from './MovieDetails.module.css';

export const MovieDetails = () => {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { movieId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const explicitType = searchParams.get('type') || location.state?.mediaType;
  const backLinkHref = location.state?.from ?? '/';

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const data = await getMovieDetails(movieId, explicitType);
      setSelectedMovie(data);
      if (data?.media_type) {
        setMediaType(movieId, data.media_type);
      }
    } catch (error) {
      console.error('Failed to load movie details:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [movieId, explicitType]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const displayTitle = selectedMovie?.title || selectedMovie?.name || '';
  const isTv =
    explicitType === 'tv' ||
    selectedMovie?.media_type === 'tv' ||
    Boolean(selectedMovie?.first_air_date);

  return (
    <div className={css.pageWrapper}>
      <Link to={backLinkHref} className={css.backBtn}>
        ☚ Go back
      </Link>

      {isLoading ? (
        <Loader caption={isTv ? 'Loading show details...' : 'Loading movie details...'} />
      ) : hasError ? (
        <div className={css.errorSectionContainer}>
          {/* Blurred background block mirroring the exact layout and dimensions of the normal movie block */}
          <div className={css.blurredBlock} aria-hidden="true">
            <article className={css.detailsContainer}>
              <div className={css.sidebar}>
                <div className={css.posterWrapper}>
                  <img
                    className={css.poster}
                    src="https://placehold.co/342x513/2a2a2a/ffffff?text=No+Poster"
                    alt="No Poster"
                  />
                </div>
              </div>

              <div className={css.infoContent}>
                <h1 className={css.movieTitle}>Movie Title Unavailable</h1>

                <div className={css.scoreSection}>
                  <p className={css.score}>
                    <strong className={css.tmdbBadge}>TMDB Score:</strong>{' '}
                    <span className={css.tmdbValue}>N/A</span>
                  </p>
                </div>

                <h2>Overview</h2>
                <p className={css.overviewText}>
                  This movie information is temporarily unavailable. We were unable to retrieve the synopsis, cast, and review data for this title from the server at this time. Please check back later or explore other trending movies.
                </p>

                <h2>Genres</h2>
                <div className={css.genres}>
                  <span className={css.genreTag}>Unavailable</span>
                </div>

                <div className={css.scoreSection} style={{ marginTop: '16px' }}>
                  <p className={css.score}>
                    <strong className={css.tmdbBadge}>Critics Score:</strong>{' '}
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      ★★★★★ Be the first to rate!
                    </span>
                  </p>
                </div>
              </div>
            </article>

            {/* Error skeleton gallery row mirror */}
            <div className={css.errorGallerySkeleton}>
              <div className={css.errorGalleryCard} />
              <div className={css.errorGalleryCard} />
              <div className={css.errorGalleryCard} />
              <div className={css.errorGalleryCard} />
            </div>

            <nav className={css.subnavGrid}>
              <div className={css.navTile}>
                <span className={css.navTileIcon}>★</span>
                <span className={css.navTileLabel}>Critics Rating</span>
              </div>
              <div className={css.navTile}>
                <span className={css.navTileIcon}>ℹ️</span>
                <span className={css.navTileLabel}>{isTv ? 'Show Info' : 'Movie Info'}</span>
              </div>
              <div className={css.navTile}>
                <span className={css.navTileIcon}>▶</span>
                <span className={css.navTileLabel}>Official Trailer</span>
              </div>
              <div className={css.navTile}>
                <span className={css.navTileIcon}>👥</span>
                <span className={css.navTileLabel}>Cast & Crew</span>
              </div>
              <div className={css.navTile}>
                <span className={css.navTileIcon}>💬</span>
                <span className={css.navTileLabel}>Community Reviews</span>
              </div>
              <div className={css.navTile}>
                <span className={css.navTileIcon}>🎯</span>
                <span className={css.navTileLabel}>{isTv ? 'Similar Shows' : 'Similar Movies'}</span>
              </div>
            </nav>
          </div>

          {/* Centered Message Card Overlay */}
          <div className={css.errorOverlay}>
            <div className={css.errorCard}>
              <div className={css.errorIconWrapper}>
                <span className={css.errorIcon} role="img" aria-label="Warning">
                  🎬⚠️
                </span>
              </div>
              <h2 className={css.errorMessage}>
                This movie information is temporarily unavailable
              </h2>
              <p className={css.errorDetails}>
                The server could not retrieve details for this title at this time. Please check back later or explore other movies.
              </p>
              <div className={css.errorButtonRow}>
                <button
                  type="button"
                  onClick={fetchDetails}
                  className={css.errorRetryBtn}
                >
                  ↻ Try Again
                </button>
                <Link to={backLinkHref} className={css.errorGoBackBtn}>
                  ☚ Go back
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : selectedMovie ? (
        <>
          <div className={css.movieCardBlock}>
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
                    alt={displayTitle || 'Movie poster'}
                  />
                </div>
              </div>

              <div className={css.infoContent}>
                <div className={css.titleHeaderRow}>
                  <div className={css.titleWrapper}>
                    <h1 className={css.movieTitle}>{displayTitle}</h1>
                    <SaveMovieButton movie={selectedMovie} isDetails />
                  </div>
                  <div className={css.headerActionsGroup}>
                    <MediaTypeBadge
                      mediaType={isTv ? 'tv' : 'movie'}
                      isDetails
                    />
                  </div>
                </div>

                <div className={css.scoreSection}>
                  <p className={css.score}>
                    <strong className={css.tmdbBadge}>TMDB Score:</strong>{' '}
                    <span className={css.tmdbValue}>
                      {selectedMovie.vote_average
                        ? `${Math.round(selectedMovie.vote_average * 10)}%`
                        : 'N/A'}
                    </span>
                  </p>
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
                        <span className={css.genreIcon} aria-hidden="true">
                          {getGenreIcon(genre.id, genre.name)}
                        </span>
                        <span>{genre.name}</span>
                      </span>
                    ))
                  ) : (
                    <span>No genres specified</span>
                  )}
                </div>

                {/* Custom 5-star Critics Score Component */}
                <CriticsScore movieId={movieId} />

                {/* Warning banner for Russian-produced content */}
                {Boolean(
                  selectedMovie?.production_countries?.some(
                    c =>
                      c.iso_3166_1?.toUpperCase() === 'RU' ||
                      c.name?.toLowerCase().includes('russia') ||
                      c.name?.toLowerCase().includes('россия') ||
                      c.name?.toLowerCase().includes('росія')
                  ) ||
                  selectedMovie?.origin_country?.some(c => c?.toUpperCase() === 'RU') ||
                  (selectedMovie?.original_language === 'ru' &&
                    !selectedMovie?.production_countries?.some(
                      c => c.iso_3166_1?.toUpperCase() === 'UA'
                    ))
                ) && (
                  <div className={css.russianWarningBanner} role="alert">
                    <span className={css.russianWarningIcon}>⚠️🚫</span>
                    <div className={css.russianWarningContent}>
                      <strong className={css.russianWarningTitle}>
                        Warning: russian-produced content!
                      </strong>
                      <p className={css.russianWarningText}>
                        This title was produced in the terrorist state of russia. Do not support sponsors of war and terrorism — boycott russian media.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </article>

            {/* End-of-block infinite horizontal photo mini-gallery */}
            <MovieGallery movieId={movieId} movieTitle={displayTitle} />

            {/* 6 Subnav buttons flush below */}
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
                to="info"
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
                <span className={css.navTileIcon}>ℹ️</span>
                <span className={css.navTileLabel}>{isTv ? 'Show Info' : 'Movie Info'}</span>
              </NavLink>

              <NavLink
                to="trailer"
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
                <span className={css.navTileIcon}>▶</span>
                <span className={css.navTileLabel}>Official Trailer</span>
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

              <NavLink
                to="similar"
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
                <span className={css.navTileIcon}>🎯</span>
                <span className={css.navTileLabel}>{isTv ? 'Similar Shows' : 'Similar Movies'}</span>
              </NavLink>
            </nav>
          </div>

          <div key={location.pathname} className={css.outletWrapper}>
            <Suspense fallback={<Loader caption="Loading section..." />}>
              <Outlet />
            </Suspense>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default MovieDetails;
