import { getTrendingMovies, getMoviesByGenre } from 'fetch';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MovieCardRatingBadge from '../components/CriticsScore/MovieCardRatingBadge';
import GenreFilter from '../components/GenreFilter/GenreFilter';
import Loader from '../components/Loader/Loader';
import css from './Trending.module.css';

export const Trending = () => {
  const [moviesArr, setMoviesArr] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    const loadMovies = async () => {
      try {
        const data =
          selectedGenres.length === 0
            ? await getTrendingMovies(1)
            : await getMoviesByGenre(selectedGenres, 1);

        if (!isCurrent) return;

        const newResults = (data?.results || []).filter(movie => movie.title || movie.name);
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
    setSelectedGenres(updatedGenres);
    setIsLoading(true);
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

  return (
    <div className={css.container}>
      <div className={css.headerSection}>
        <h1 className={css.mainTitle}>Trending Today 🔥</h1>
        <p className={css.sectionDesc}>
          Explore what millions of film enthusiasts are watching right now, powered by real-time TMDB data and community reviews.
        </p>
      </div>

      <GenreFilter
        selectedGenres={selectedGenres}
        onToggleGenre={handleToggleGenre}
        allLabel="All Trending"
      />

      {isLoading ? (
        <Loader caption="Loading trending movies..." />
      ) : (
        <>
          {moviesArr.length === 0 ? (
            <div className={css.emptyState}>
              <span className={css.emptyIcon}>🎬</span>
              <p className={css.emptyText}>No movies found for this genre</p>
            </div>
          ) : (
            <ul className={css.movieGrid}>
              {moviesArr.map(movie => {
                const title = movie.title || movie.name;
                return (
                  <li key={movie.id} className={css.movieCard}>
                    <Link
                      to={`/movies/${movie.id}`}
                      state={{ from: location }}
                      className={css.movieLink}
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
                    <span>Loading more movies...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Movies</span>
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
