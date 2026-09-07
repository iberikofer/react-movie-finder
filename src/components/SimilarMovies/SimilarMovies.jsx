import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getSimilarMovies, setMediaType, getMediaType } from 'fetch';
import MovieCardRatingBadge from '../CriticsScore/MovieCardRatingBadge';
import Loader from '../Loader/Loader';
import MediaTypeBadge from '../MediaTypeBadge/MediaTypeBadge';
import AgeRatingBadge from '../AgeRatingBadge/AgeRatingBadge';
import SaveMovieButton from '../SaveMovieButton/SaveMovieButton';
import css from './SimilarMovies.module.css';

export const SimilarMovies = () => {
  const { movieId } = useParams();
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const isTv = getMediaType(movieId) === 'tv';

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchSimilar = async () => {
      try {
        const data = await getSimilarMovies(movieId);
        if (!isMounted) return;
        const validMovies = (data?.results || []).filter(
          item => (item.title || item.name) && item.id !== Number(movieId)
        );
        setMovies(validMovies);
      } catch (error) {
        console.error('Failed to load similar movies:', error);
        if (isMounted) setMovies([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSimilar();
    return () => {
      isMounted = false;
    };
  }, [movieId]);

  return (
    <section className={css.similarSection} aria-label={isTv ? 'Similar shows' : 'Similar movies'}>
      <div className={css.headerRow}>
        <h2 className={css.sectionTitle}>
          <span className={css.titleIcon}>🎯</span> {isTv ? 'Similar Shows' : 'Similar Movies'}
        </h2>
        {movies.length > 0 && (
          <span className={css.countBadge}>
            {movies.length} recommended {movies.length === 1 ? 'title' : 'titles'}
          </span>
        )}
      </div>

      {isLoading ? (
        <Loader caption="Finding similar movies & series..." />
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
                    if (movie.media_type) {
                      setMediaType(movie.id, movie.media_type);
                    }
                    window.scrollTo({ top: 0, behavior: 'instant' });
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
            No similar recommendations found for this title.
          </p>
        </div>
      )}
    </section>
  );
};

export default SimilarMovies;
