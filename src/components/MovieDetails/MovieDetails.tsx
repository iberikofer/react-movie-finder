import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useLocation, useSearchParams, Link, NavLink, Outlet } from 'react-router-dom';
import { getMovieDetails, setMediaType } from 'fetch';
import { MovieDetails as MovieDetailsType } from 'types';
import CriticsScore from '../CriticsScore/CriticsScore';
import { getGenreIcon } from '../GenreFilter/GenreFilter';
import Loader from '../Loader/Loader';
import MediaTypeBadge from '../MediaTypeBadge/MediaTypeBadge';
import SaveMovieButton from '../SaveMovieButton/SaveMovieButton';
import MovieGallery from './MovieGallery';
import css from './MovieDetails.module.css';

export const MovieDetails: React.FC = () => {
  const [selectedMovie, setSelectedMovie] = useState<MovieDetailsType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const { movieId } = useParams<{ movieId: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const explicitType = (searchParams.get('type') || location.state?.mediaType) as 'movie' | 'tv' | undefined;
  const backLinkHref = location.state?.from ?? '/';
  const fetchedMovieIdRef = useRef<string | null>(null);

  const originSource =
    location.state?.source ||
    sessionStorage.getItem('movie_origin_tab') ||
    (backLinkHref?.pathname?.includes('trending') || String(backLinkHref).includes('trending')
      ? 'trending'
      : backLinkHref?.pathname?.includes('saved') || String(backLinkHref).includes('saved')
      ? 'saved'
      : 'movies');

  useEffect(() => {
    if (originSource) {
      sessionStorage.setItem('movie_origin_tab', originSource);
    }
  }, [originSource]);

  const fetchDetails = useCallback(async (targetMovieId?: string, typeHint?: 'movie' | 'tv') => {
    if (!targetMovieId) return;
    setIsLoading(true);
    setHasError(false);

    try {
      const data = await getMovieDetails(targetMovieId, typeHint);
      setSelectedMovie(data);
      fetchedMovieIdRef.current = String(targetMovieId);
      if (data?.media_type && (data.media_type === 'movie' || data.media_type === 'tv')) {
        setMediaType(targetMovieId, data.media_type);
      }
    } catch (error) {
      console.error('Failed to load movie details:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (movieId && fetchedMovieIdRef.current !== String(movieId)) {
      fetchDetails(movieId, explicitType);
    }
  }, [movieId, explicitType, fetchDetails]);

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
          <div className={css.blurredBlock} aria-hidden="true">
            <article className={css.detailsContainer}>
              <div className={css.sidebar}>
                <div className={css.posterWrapper}>
                  <img
                    className={css.poster}
                    src="https://placehold.co/500x750/2a2a2a/ffffff?text=No+Poster"
                    alt="No Poster"
                  />
                </div>
              </div>

              <div className={css.infoContent}>
                <h1 className={css.movieTitle}>Movie Title Unavailable</h1>

                <h2>Overview</h2>
                <p className={css.overviewText}>
                  This movie information is temporarily unavailable. We were unable to retrieve the synopsis, cast, and review data for this title from the server at this time. Please check back later or explore other trending movies.
                </p>

                <h2>Genres</h2>
                <div className={css.genres}>
                  <span className={css.genreTag}>Unavailable</span>
                </div>

                <div className={css.ratingsSkeleton} style={{ marginTop: '22px' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 16px 0' }}>Ratings</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p className={css.score} style={{ margin: 0 }}>
                      <span className={css.tmdbBadge}>TMDB:</span>{' '}
                      <span className={css.tmdbValue}>N/A</span>
                    </p>
                    <p className={css.score} style={{ margin: 0 }}>
                      <span className={css.tmdbBadge}>IMDb:</span>{' '}
                      <span className={css.tmdbValue}>N/A</span>
                    </p>
                    <p className={css.score} style={{ margin: 0 }}>
                      <span className={css.tmdbBadge}>Critics:</span>{' '}
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        ★★★★★ Be the first to rate!
                      </span>
                    </p>
                    <p className={css.score} style={{ margin: 0 }}>
                      <span className={css.tmdbBadge} style={{ color: '#34d399' }}>Your Rating:</span>{' '}
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        ★★★★★
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </article>

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
                  onClick={() => movieId && fetchDetails(movieId, explicitType)}
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
                        ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`
                        : 'https://placehold.co/500x750/2a2a2a/ffffff?text=No+Poster'
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

                <div className={css.ageRatingRow}>
                  {selectedMovie.age_rating ? (
                    <span
                      className={`${css.ageRatingBadge} ${
                        selectedMovie.age_rating.includes('18+') ||
                        selectedMovie.age_rating.includes('US: R') ||
                        selectedMovie.age_rating.includes('NC-17') ||
                        selectedMovie.age_rating.includes('TV-MA') ||
                        selectedMovie.age_rating.includes('Adult')
                          ? css.ageRatingAdult
                          : selectedMovie.age_rating.includes('16+') ||
                            selectedMovie.age_rating.includes('15+') ||
                            selectedMovie.age_rating.includes('14+') ||
                            selectedMovie.age_rating.includes('12+') ||
                            selectedMovie.age_rating.includes('PG-13') ||
                            selectedMovie.age_rating.includes('TV-14')
                          ? css.ageRatingTeen
                          : css.ageRatingGeneral
                      }`}
                      title="Age Restriction (Europe | USA)"
                    >
                      {selectedMovie.age_rating}
                    </span>
                  ) : (
                    <span className={css.ageRatingUnavailableBadge}>
                      Age rating currently unavailable
                    </span>
                  )}
                </div>

                <h2>Overview</h2>
                <p className={css.overviewText}>
                  {selectedMovie.overview || 'No overview available.'}
                </p>

                <h2>Genres</h2>
                <div className={css.genres}>
                  {selectedMovie.genres && selectedMovie.genres.length > 0 ? (
                    selectedMovie.genres.map(genre => (
                      <Link
                        key={genre.id}
                        to={`/movies?genres=${genre.id}`}
                        state={{ from: location }}
                        className={css.genreTag}
                        title={`Browse ${genre.name} movies on Search`}
                      >
                        <span className={css.genreIcon} aria-hidden="true">
                          {getGenreIcon(genre.id, genre.name)}
                        </span>
                        <span>{genre.name}</span>
                      </Link>
                    ))
                  ) : (
                    <span>No genres specified</span>
                  )}
                </div>

                <CriticsScore movieId={movieId} movie={selectedMovie} />

                {Boolean(
                  selectedMovie?.production_countries?.some(
                    c =>
                      c.iso_3166_1?.toUpperCase() === 'RU' ||
                      c.name?.toLowerCase().includes('russia') ||
                      c.name?.toLowerCase().includes('россия') ||
                      c.name?.toLowerCase().includes('росія')
                  ) ||
                  selectedMovie?.origin_country?.some((c: string) => c?.toUpperCase() === 'RU') ||
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

            <MovieGallery movieId={movieId!} movieTitle={displayTitle} />

            <nav className={css.subnavGrid} aria-label="Movie sections">
              <NavLink
                to="rating"
                preventScrollReset={true}
                state={{
                  from: backLinkHref,
                  mediaType: selectedMovie?.media_type || explicitType,
                  source: originSource,
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
                state={{
                  from: backLinkHref,
                  mediaType: selectedMovie?.media_type || explicitType,
                  source: originSource,
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
                state={{
                  from: backLinkHref,
                  mediaType: selectedMovie?.media_type || explicitType,
                  source: originSource,
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
                state={{
                  from: backLinkHref,
                  mediaType: selectedMovie?.media_type || explicitType,
                  source: originSource,
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
                state={{
                  from: backLinkHref,
                  mediaType: selectedMovie?.media_type || explicitType,
                  source: originSource,
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
                state={{
                  from: backLinkHref,
                  mediaType: selectedMovie?.media_type || explicitType,
                  source: originSource,
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

          <div className={css.outletWrapper}>
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
