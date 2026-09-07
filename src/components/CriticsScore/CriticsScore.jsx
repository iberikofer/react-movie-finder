import { useState, useEffect } from 'react';
import { getImdbData } from 'fetch';
import useMovieRating from '../../hooks/useMovieRating';
import ScoreSummary from './ScoreSummary';
import StarRatingInput from './StarRatingInput';
import css from './CriticsScore.module.css';

export const CriticsScore = ({ movieId, movie }) => {
  const {
    averageRating,
    formattedAverage,
    totalVotes,
    starColor,
    submitRating,
    resetRating,
  } = useMovieRating(movieId);

  const [imdbData, setImdbData] = useState(null);
  const [isLoadingImdb, setIsLoadingImdb] = useState(false);

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
    ? `https://www.imdb.com/find?q=${encodeURIComponent(movie.title || movie.name)}`
    : '';

  return (
    <section className={css.ratingsSection} aria-label="Movie ratings">
      <h2 className={css.ratingsHeading}>Ratings</h2>

      <div className={css.ratingsCard}>
        {/* 1. TMDB */}
        <div className={css.ratingRow}>
          {tmdbWatchLink ? (
            <a
              href={tmdbWatchLink}
              target="_blank"
              rel="noopener noreferrer"
              className={css.sourceLinkTmdb}
              title="View title on JustWatch / TMDB ↗"
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
                {movie?.vote_count > 0 && (
                  <span className={css.voteCount}>
                    ({movie.vote_count.toLocaleString()}{' '}
                    {movie.vote_count === 1 ? 'vote' : 'votes'})
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
              title="View title on IMDb ↗"
            >
              IMDb <span className={css.externalArrow}>↗</span>
            </a>
          ) : (
            <span className={css.sourceLinkImdb}>IMDb</span>
          )}
          <div className={css.ratingDataGroup}>
            {isLoadingImdb ? (
              <span className={css.loadingText}>Loading IMDb...</span>
            ) : imdbData?.rating ? (
              <>
                <span className={css.imdbScoreBadge}>
                  <span className={css.starIconGold}>★</span> {imdbData.rating}
                  <span className={css.scoreScale}>/10</span>
                </span>
                {imdbData.votes && (
                  <span className={css.voteCount}>
                    ({imdbData.votes}{' '}
                    {imdbData.votes === '1' ? 'vote' : 'votes'})
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
          />
        </div>

        {/* 4. Your Rating */}
        <StarRatingInput onRate={submitRating} />
      </div>
    </section>
  );
};

export default CriticsScore;
