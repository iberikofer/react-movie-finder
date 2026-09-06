import { getTrendingMovies, getMoviesByGenre, setMediaType } from 'fetch';
import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import MovieCardRatingBadge from '../components/CriticsScore/MovieCardRatingBadge';
import GenreFilter from '../components/GenreFilter/GenreFilter';
import Loader from '../components/Loader/Loader';
import MediaTypeBadge from '../components/MediaTypeBadge/MediaTypeBadge';
import SaveMovieButton from '../components/SaveMovieButton/SaveMovieButton';
import css from './Trending.module.css';

export const Trending = () => {
  const [moviesArr, setMoviesArr] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const rawGenres = searchParams.get('genres') || '';
  const selectedGenres = useMemo(() => {
    if (!rawGenres.trim()) return [];
    return rawGenres
      .split(',')
      .map(id => Number(id.trim()))
      .filter(id => !isNaN(id) && id > 0);
  }, [rawGenres]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    const loadMovies = async () => {
      const startTime = Date.now();
      try {
        const data =
          selectedGenres.length === 0
            ? await getTrendingMovies(1)
            : await getMoviesByGenre(selectedGenres, 1);

        if (!isCurrent) return;

        const newResults = (data?.results || []).filter(movie => movie.title || movie.name);
        newResults.forEach(item => {
          if (item.media_type) {
            setMediaType(item.id, item.media_type);
          }
        });
        const elapsed = Date.now() - startTime;
        if (elapsed < 500) {
          await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
        }
        if (!isCurrent) return;
        setMoviesArr(newResults);
        setPage(1);
        setTotalPages(data?.total_pages || 1);
      } catch (error) {
        if (!isCurrent) return;
        console.error('Failed to fetch movies:', error);
        setMoviesArr([]);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    loadMovies();

    return () => {
      isCurrent = false;
    };
  }, [selectedGenres]);

  const handleToggleGenre = updatedGenres => {
    setIsLoading(true);
    if (updatedGenres.length > 0) {
      setSearchParams({ genres: updatedGenres.join(',') });
    } else {
      setSearchParams({});
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const data =
        selectedGenres.length === 0
          ? await getTrendingMovies(nextPage)
          : await getMoviesByGenre(selectedGenres, nextPage);

      const newResults = (data?.results || []).filter(movie => movie.title || movie.name);
      newResults.forEach(item => {
        if (item.media_type) {
          setMediaType(item.id, item.media_type);
        }
      });
      setMoviesArr(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const uniqueNew = newResults.filter(m => !existingIds.has(m.id));
        return [...prev, ...uniqueNew];
      });
      setPage(nextPage);
      setTotalPages(data?.total_pages || 1);
    } catch (error) {
      console.error('Failed to load more movies:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading && moviesArr.length === 0) {
    return <Loader isCentered caption="Loading trending titles..." />;
  }

  return (
    <div className={css.container}>
      <div className={css.headerSection}>
        <h1 className={css.mainTitle}>Trending Today 🔥</h1>
        <p className={css.sectionDesc}>
          Explore what millions of film/series enthusiasts are watching right now, powered by real-time TMDB data and community reviews.
        </p>
      </div>

      <GenreFilter
        selectedGenres={selectedGenres}
        onToggleGenre={handleToggleGenre}
        allLabel="All Trending"
      />

      {isLoading ? (
        <Loader caption="Loading trending titles..." />
      ) : (
        <>
          {moviesArr.length === 0 ? (
            <div className={css.emptyState}>
              <span className={css.emptyIcon}>🎬</span>
              <p className={css.emptyText}>No titles found for this genre</p>
            </div>
          ) : (
            <ul className={css.movieGrid}>
              {moviesArr.map(movie => {
                const title = movie.title || movie.name;
                return (
                  <li key={movie.id} className={css.movieCard}>
                    <Link
                      to={`/movies/${movie.id}${movie.media_type === 'tv' ? '?type=tv' : ''}`}
                      state={{ from: location, mediaType: movie.media_type }}
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
                        />
                        <MovieCardRatingBadge movieId={movie.id} />
                        <MediaTypeBadge mediaType={movie.media_type} item={movie} />
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
          )}

          {page < totalPages && (
            <div className={css.loadMoreContainer}>
              <button
                type="button"
                className={css.loadMoreBtn}
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <span className={css.spinnerIcon}>⏳</span>
                    <span>Loading more titles...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Titles</span>
                    <span className={css.loadMoreArrow}>↓</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Trending;
