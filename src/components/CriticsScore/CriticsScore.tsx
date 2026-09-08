import React, { useState, useEffect } from 'react';
import { getImdbData, ImdbData } from 'fetch';
import { MediaItem } from 'types';
import useMovieRating from '../../hooks/useMovieRating';
import { useLanguage } from '../../context/LanguageContext';
import ScoreSummary from './ScoreSummary';
import StarRatingInput from './StarRatingInput';
import css from './CriticsScore.module.css';

export interface CriticsScoreProps {
  movieId?: string | number;
  movie?: MediaItem | null;
}

export const CriticsScore: React.FC<CriticsScoreProps> = ({ movieId, movie }) => {
  const { t, language } = useLanguage();
  const {
    averageRating,
    formattedAverage,
    totalVotes,
    starColor,
    submitRating,
    resetRating,
  } = useMovieRating(movieId);

  const [imdbData, setImdbData] = useState<ImdbData | null>(null);
  const [isLoadingImdb, setIsLoadingImdb] = useState<boolean>(false);

  useEffect(() => {
    const imdbId = movie?.imdb_id;
    if (!imdbId) {
      setImdbData(null);
      return;
    }

    let isMounted = true;
    setIsLoadingImdb(true);

    getImdbData(imdbId)
      .then(data => {
        if (isMounted) setImdbData(data);
      })
      .catch(() => {
        if (isMounted) setImdbData(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingImdb(false);
      });

    return () => {
      isMounted = false;
    };
  }, [movie?.imdb_id]);

  const tmdbWatchLink =
    movie?.tmdb_watch_link ||
    (movie?.id
      ? `https://www.themoviedb.org/${movie?.media_type === 'tv' ? 'tv' : 'movie'}/${movie.id}`
      : '');

  const imdbUrl = movie?.imdb_id
    ? `https://www.imdb.com/title/${movie.imdb_id}/`
    : movie?.title || movie?.name
    ? `https://www.imdb.com/find?q=${encodeURIComponent(movie.title || movie.name || '')}`
    : '';

  const formatImdbVotes = (votesStr: string): string => {
    if (language === 'uk') {
      const num = parseInt(votesStr.replace(/,/g, '').replace(/\s/g, ''), 10);
      if (!isNaN(num)) {
        const mod10 = num % 10;
        const mod100 = num % 100;
        if (mod10 === 1 && mod100 !== 11) return `${votesStr} ${t('critics.voteOne', 'голос')}`;
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${votesStr} ${t('critics.votesFew', 'голоси')}`;
        return `${votesStr} ${t('critics.votes', 'голосів')}`;
      }
    }
    return `${votesStr} ${votesStr === '1' ? 'vote' : 'votes'}`;
  };

  return (
    <section className={css.ratingsSection} aria-label={t('critics.movieRatingsAria', 'Movie ratings')}>
      <h2 className={css.ratingsHeading}>{t('critics.ratings', 'Ratings')}</h2>

      <div className={css.ratingsCard}>
        {/* 1. TMDB */}
        <div className={css.ratingRow}>
          {tmdbWatchLink ? (
            <a
              href={tmdbWatchLink}
              target="_blank"
              rel="noopener noreferrer"
              className={css.sourceLinkTmdb}
              title={t('critics.viewJustWatch', 'View title on JustWatch / TMDB ↗')}
            >
              TMDB <span className={css.externalArrow}>↗</span>
            </a>
          ) : (
            <span className={css.sourceLinkTmdb}>TMDB</span>
          )}
          <div className={css.ratingDataGroup}>
            {movie?.vote_average ? (
              <>
                <span className={css.tmdbPercentBadge}>
                  {`${Math.round(movie.vote_average * 10)}%`}
                </span>
                {movie?.vote_count !== undefined && movie.vote_count > 0 && (
                  <span className={css.voteCount}>
                    ({movie.vote_count.toLocaleString()}{' '}
                    {movie.vote_count === 1 ? t('critics.voteOne', 'vote') : t('critics.votes', 'votes')})
                  </span>
                )}
              </>
            ) : (
              <span className={css.emptyInvite}>N/A</span>
            )}
          </div>
        </div>

        {/* 2. IMDb */}
        <div className={css.ratingRow}>
          {imdbUrl ? (
            <a
              href={imdbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={css.sourceLinkImdb}
              title={t('critics.viewImdb', 'View title on IMDb ↗')}
            >
              IMDb <span className={css.externalArrow}>↗</span>
            </a>
          ) : (
            <span className={css.sourceLinkImdb}>IMDb</span>
          )}
          <div className={css.ratingDataGroup}>
            {isLoadingImdb ? (
              <span className={css.loadingText}>
                {t('critics.loadingImdb', 'Loading IMDb...')}
              </span>
            ) : imdbData?.rating ? (
              <>
                <span className={css.imdbScoreBadge}>
                  <span className={css.starIconGold}>★</span> {imdbData.rating}
                  <span className={css.scoreScale}>/10</span>
                </span>
                {imdbData.votes && (
                  <span className={css.voteCount}>
                    ({formatImdbVotes(imdbData.votes)})
                  </span>
                )}
              </>
            ) : (
              <span className={css.emptyInvite}>N/A</span>
            )}
          </div>
        </div>

        {/* 3. Critics */}
        <div className={css.ratingRow}>
          <ScoreSummary
            averageRating={averageRating}
            formattedAverage={formattedAverage}
            totalVotes={totalVotes}
            starColor={starColor}
            onReset={resetRating}
            isRow
            ratingLink={movieId ? `/movies/${movieId}/rating` : 'rating'}
          />
        </div>

        {/* 4. Your Rating */}
        <StarRatingInput onRate={submitRating} />
      </div>
    </section>
  );
};

export default CriticsScore;
