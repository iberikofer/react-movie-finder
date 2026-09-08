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
import { useLanguage } from '../../context/LanguageContext';
import css from './MovieDetails.module.css';

export const MovieDetails: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedMovie, setSelectedMovie] = useState<MovieDetailsType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const { movieId } = useParams<{ movieId: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const explicitType = (searchParams.get('type') || location.state?.mediaType) as 'movie' | 'tv' | undefined;
  const backLinkHref = location.state?.from ?? '/';
  const fetchedMovieIdRef = useRef<string | null>(null);
  const fetchedLangRef = useRef<string>(language);

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

  const selectedMovieRef = useRef<MovieDetailsType | null>(null);
  selectedMovieRef.current = selectedMovie;

  const fetchDetails = useCallback(
    async (targetMovieId?: string, typeHint?: 'movie' | 'tv', isLanguageSwitch: boolean = false) => {
      if (!targetMovieId) return;
      if (isLanguageSwitch && selectedMovieRef.current) {
        setIsTranslating(true);
      } else if (!selectedMovieRef.current || fetchedMovieIdRef.current !== String(targetMovieId)) {
        setIsLoading(true);
      }
      setHasError(false);
      const startTime = Date.now();

      try {
        const data = await getMovieDetails(targetMovieId, typeHint);

        // If translating, ensure smooth minimum duration (~420ms) so animation doesn't flash
        if (isLanguageSwitch) {
          const elapsed = Date.now() - startTime;
          if (elapsed < 420) {
            await new Promise(resolve => setTimeout(resolve, 420 - elapsed));
          }
        }

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
        setIsTranslating(false);
      }
    },
    []
  );

  useEffect(() => {
    if (movieId) {
      const isIdChanged = fetchedMovieIdRef.current !== String(movieId);
      const isLangChanged = fetchedLangRef.current !== language;

      if (isIdChanged || isLangChanged) {
        fetchedLangRef.current = language;
        const isLanguageSwitch = !isIdChanged && isLangChanged && Boolean(selectedMovieRef.current);
        fetchDetails(movieId, explicitType, isLanguageSwitch);
      }
    }
  }, [movieId, explicitType, fetchDetails, language]);

  const displayTitle = selectedMovie?.title || selectedMovie?.name || '';
  const isTv =
    explicitType === 'tv' ||
    selectedMovie?.media_type === 'tv' ||
    Boolean(selectedMovie?.first_air_date);

  return (
    <div className={css.pageWrapper}>
      <Link to={backLinkHref} className={css.backBtn}>
        ☚ {t('movie.goBack')}
      </Link>

      {isLoading ? (
        <Loader
          caption={
            isTv
              ? t('movie.loadingShow', 'Loading show details...')
              : t('movie.loadingMovie', 'Loading movie details...')
          }
        />
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
                <h1 className={css.movieTitle}>{t('movie.unavailableTitle', 'Movie Title Unavailable')}</h1>

                <h2>{t('movie.overview')}</h2>
                <p className={css.overviewText}>
                  {t('movie.errorDesc')}
                </p>

                <h2>{t('movie.genres')}</h2>
                <div className={css.genres}>
                  <span className={css.genreTag}>{t('movie.unavailable', 'Unavailable')}</span>
                </div>

                <div className={css.ratingsSkeleton} style={{ marginTop: '22px' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 16px 0' }}>{t('movie.criticsRating')}</h2>
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
                      <span className={css.tmdbBadge}>{t('movie.criticsRating')}:</span>{' '}
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        ★★★★★ {t('movie.firstToRate')}
                      </span>
                    </p>
                    <p className={css.score} style={{ margin: 0 }}>
                      <span className={css.tmdbBadge} style={{ color: '#34d399' }}>{t('critics.yourRating', 'Your Rating:')}</span>{' '}
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
                <span className={css.navTileLabel}>{t('movie.criticsRating')}</span>
              </div>
              <div className={css.navTile}>
                <span className={css.navTileIcon}>ℹ️</span>
                <span className={css.navTileLabel}>{isTv ? t('movie.showInfo') : t('movie.movieInfo')}</span>
              </div>
              <div className={css.navTile}>
                <span className={css.navTileIcon}>▶</span>
                <span className={css.navTileLabel}>{t('movie.officialTrailer')}</span>
              </div>
              <div className={css.navTile}>
                <span className={css.navTileIcon}>👥</span>
                <span className={css.navTileLabel}>{t('movie.castAndCrew')}</span>
              </div>
              <div className={css.navTile}>
                <span className={css.navTileIcon}>💬</span>
                <span className={css.navTileLabel}>{t('movie.communityReviews')}</span>
              </div>
              <div className={css.navTile}>
                <span className={css.navTileIcon}>🎯</span>
                <span className={css.navTileLabel}>{isTv ? t('movie.similarShows') : t('movie.similarMovies')}</span>
              </div>
            </nav>
          </div>

          <div className={css.errorOverlay}>
            <div className={css.errorCard}>
              <div className={css.errorIconWrapper}>
                <span className={css.errorIcon} role="img" aria-label={t('common.warning', 'Warning')}>
                  🎬⚠️
                </span>
              </div>
              <h2 className={css.errorMessage}>
                {t('movie.errorTitle')}
              </h2>
              <p className={css.errorDetails}>
                {t('movie.errorDesc')}
              </p>
              <div className={css.errorButtonRow}>
                <button
                  type="button"
                  onClick={() => movieId && fetchDetails(movieId, explicitType)}
                  className={css.errorRetryBtn}
                >
                  ↻ {t('movie.tryAgain')}
                </button>
                <Link to={backLinkHref} className={css.errorGoBackBtn}>
                  ☚ {t('movie.goBack')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : selectedMovie ? (
        <>
          <div className={css.movieCardBlock}>
            <article className={css.detailsContainer}>
              {/* Blur & themed loader overlay during language translation */}
              <div
                className={`${css.translatingOverlay} ${
                  isTranslating ? css.translatingActive : css.translatingHidden
                }`}
                aria-hidden={!isTranslating}
                aria-live="polite"
              >
                <Loader
                  label={t('movie.translatingSlate', 'TRANSLATE')}
                  caption={t('movie.translating', 'Translating movie details...')}
                />
              </div>

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
                      title={t('movie.ageRestrictionTitle', 'Age Restriction (Europe | USA)')}
                    >
                      {selectedMovie.age_rating}
                    </span>
                  ) : (
                    <span className={css.ageRatingUnavailableBadge}>
                      {t('movie.ageUnavailable', 'Age rating currently unavailable')}
                    </span>
                  )}
                </div>

                <h2>{t('movie.overview')}</h2>
                <p className={css.overviewText}>
                  {selectedMovie.overview || t('movie.noOverview')}
                </p>

                <h2>{t('movie.genres')}</h2>
                <div className={css.genres}>
                  {selectedMovie.genres && selectedMovie.genres.length > 0 ? (
                    selectedMovie.genres.map(genre => (
                      <Link
                        key={genre.id}
                        to={`/movies?genres=${genre.id}`}
                        state={{ from: location }}
                        className={css.genreTag}
                        title={t('movie.browseGenre', `Browse ${genre.name} on Search`).replace('{genre}', genre.name)}
                      >
                        <span className={css.genreIcon} aria-hidden="true">
                          {getGenreIcon(genre.id, genre.name)}
                        </span>
                        <span>{genre.name}</span>
                      </Link>
                    ))
                  ) : (
                    <span>{t('movie.noGenres')}</span>
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
                        {t('movie.warningRuTitle')}
                      </strong>
                      <p className={css.russianWarningText}>
                        {t('movie.warningRuText')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </article>

            <MovieGallery movieId={movieId!} movieTitle={displayTitle} />

            <nav id="movie-subnav" className={css.subnavGrid} aria-label={t('movie.sectionsAria', 'Movie sections')}>
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
                <span className={css.navTileLabel}>{t('movie.criticsRating')}</span>
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
                <span className={css.navTileLabel}>{isTv ? t('movie.showInfo') : t('movie.movieInfo')}</span>
              </NavLink>

              <NavLink
                to="videos"
                preventScrollReset={true}
                state={{
                  from: backLinkHref,
                  mediaType: selectedMovie?.media_type || explicitType,
                  source: originSource,
                }}
                onClick={() => {
                  if (movieId) {
                    sessionStorage.removeItem(`video_selected_key_${movieId}`);
                    sessionStorage.removeItem(`trailer_selected_key_${movieId}`);
                    window.dispatchEvent(new CustomEvent('videos_tab_click', { detail: { movieId } }));
                  }
                }}
                className={({ isActive }) =>
                  `${css.navTile} ${isActive ? css.navTileActive : ''}`
                }
              >
                <span className={css.navTileIcon}>▶</span>
                <span className={css.navTileLabel}>{t('movie.officialTrailer')}</span>
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
                <span className={css.navTileLabel}>{t('movie.castAndCrew')}</span>
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
                <span className={css.navTileLabel}>{t('movie.communityReviews')}</span>
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
                <span className={css.navTileLabel}>{isTv ? t('movie.similarShows') : t('movie.similarMovies')}</span>
              </NavLink>
            </nav>
          </div>

          <div className={css.outletWrapper}>
            <Suspense fallback={<Loader caption={t('movie.loadingSection', 'Loading section...')} />}>
              <Outlet />
            </Suspense>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default MovieDetails;
