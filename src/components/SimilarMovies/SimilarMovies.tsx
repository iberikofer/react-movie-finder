import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getSimilarMovies, setMediaType, getMediaType } from 'fetch';
import { MediaItem } from 'types';
import { useLanguage } from '../../context/LanguageContext';
import MovieCardRatingBadge from '../CriticsScore/MovieCardRatingBadge';
import Loader from '../Loader/Loader';
import MediaTypeBadge from '../MediaTypeBadge/MediaTypeBadge';
import AgeRatingBadge from '../AgeRatingBadge/AgeRatingBadge';
import SaveMovieButton from '../SaveMovieButton/SaveMovieButton';
import css from './SimilarMovies.module.css';

export const SimilarMovies: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const { language, t } = useLanguage();
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const location = useLocation();
  const isTv = movieId ? getMediaType(movieId) === 'tv' : false;
  const moviesRef = useRef(movies);
  moviesRef.current = movies;
  const prevLangRef = useRef<string>(language);
  const hasDataRef = useRef<boolean>(false);

  useEffect(() => {
    if (!movieId) return;
    let isMounted = true;
    const isLangChange = prevLangRef.current !== language;
    prevLangRef.current = language;

    if (!hasDataRef.current || (isLangChange && !hasDataRef.current)) {
      setIsLoading(true);
    } else if (isLangChange && hasDataRef.current) {
      setIsTranslating(true);
    }

    const fetchSimilar = async () => {
      const startTime = Date.now();
      try {
        const data = await getSimilarMovies(movieId);
        
        if (isLangChange && hasDataRef.current) {
          const elapsed = Date.now() - startTime;
          if (elapsed < 420) {
            await new Promise(resolve => setTimeout(resolve, 420 - elapsed));
          }
        }

        if (!isMounted) return;
        const validMovies = (data?.results || []).filter(
          item => (item.title || item.name) && item.id !== Number(movieId)
        );
        setMovies(validMovies);
        hasDataRef.current = true;
      } catch (error) {
        console.error('Failed to load similar movies:', error);
        if (isMounted) setMovies([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsTranslating(false);
        }
      }
    };

    fetchSimilar();
    return () => {
      isMounted = false;
    };
  }, [movieId, language]);

  const getSimilarCountText = (count: number) => {
    if (language === 'uk') {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod10 === 1 && mod100 !== 11) return `${count} рекомендований тайтл`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} рекомендовані тайтли`;
      return `${count} рекомендованих тайтлів`;
    }
    return `${count} ${t('similar.recommended', 'recommended')} ${count === 1 ? 'title' : 'titles'}`;
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Translating overlay */}
      <div
        className={`${css.translatingOverlay} ${
          isTranslating ? css.translatingActive : css.translatingHidden
        }`}
        aria-hidden={!isTranslating}
        aria-live="polite"
      >
        <Loader
          label={t('movie.translatingSlate', 'TRANSLATE')}
          caption={t('movie.translating', 'Translating...')}
        />
      </div>
      <section className={css.similarSection} aria-label={isTv ? t('movie.similarShows') : t('movie.similarMovies')}>
        <div className={css.headerRow}>
          <h2 className={css.sectionTitle}>
            <span className={css.titleIcon}>🎯</span> {isTv ? t('movie.similarShows') : t('movie.similarMovies')}
          </h2>
          {movies.length > 0 && (
            <span className={css.countBadge}>
              {getSimilarCountText(movies.length)}
            </span>
          )}
        </div>

        {isLoading && !isTranslating ? (
          <Loader caption={t('similar.loading')} />
        ) : movies.length > 0 ? (
        <ul className={css.movieGrid}>
          {movies.map(movie => {
            const title = movie.title || movie.name;
            return (
              <li key={movie.id} className={css.movieCard}>
                <Link
                  to={`/movies/${movie.id}${movie.media_type === 'tv' ? '?type=tv' : ''}`}
                  state={{
                    from: location,
                    mediaType: movie.media_type,
                    source: location.state?.source || sessionStorage.getItem('movie_origin_tab') || 'movies',
                  }}
                  className={css.movieLink}
                  draggable="false"
                  onClick={e => {
                    const selection = window.getSelection();
                    if (
                      selection &&
                      selection.toString().trim().length > 0 &&
                      e.currentTarget.contains(selection.anchorNode)
                    ) {
                      e.preventDefault();
                      return;
                    }
                    if (movie.media_type === 'movie' || movie.media_type === 'tv') {
                      setMediaType(movie.id, movie.media_type);
                    }
                    window.scrollTo({ top: 0, behavior: 'auto' });
                  }}
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
                      loading="lazy"
                    />
                    <MovieCardRatingBadge movieId={movie.id} />
                    <MediaTypeBadge mediaType={movie.media_type || (isTv ? 'tv' : 'movie')} item={movie} />
                    <AgeRatingBadge movie={{ ...movie, media_type: movie.media_type || (isTv ? 'tv' : 'movie') }} />
                    <SaveMovieButton movie={movie} />
                  </div>
                  <div className={css.titleWrapper}>
                    <span className={css.movieTitle}>{title}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={css.emptyState}>
          <span className={css.emptyIcon}>🎬</span>
          <p className={css.emptyText}>
            {t('similar.empty')}
          </p>
        </div>
        )}
      </section>
    </div>
  );
};

export default SimilarMovies;
