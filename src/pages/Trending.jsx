import { getTrendingMovies, discoverMedia, setMediaType } from 'fetch';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import MovieCardRatingBadge from '../components/CriticsScore/MovieCardRatingBadge';
import FilterBar from '../components/FilterBar/FilterBar';
import Loader from '../components/Loader/Loader';
import MediaTypeBadge from '../components/MediaTypeBadge/MediaTypeBadge';
import SaveMovieButton from '../components/SaveMovieButton/SaveMovieButton';
import {
  savePageSession,
  getPageSession,
  updatePageScroll,
} from '../utils/sessionStorage';
import css from './Trending.module.css';

export const Trending = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawGenres = searchParams.get('genres') || searchParams.get('genre') || '';
  const selectedGenres = useMemo(() => {
    if (!rawGenres.trim()) return [];
    return rawGenres
      .split(',')
      .map(id => Number(id.trim()))
      .filter(id => !isNaN(id) && id > 0);
  }, [rawGenres]);

  const filterType = searchParams.get('type') || 'all';
  const filterAge = searchParams.get('age') || 'all';
  const sortBy = searchParams.get('sort') || 'popularity.desc';

  const hasActiveFilters =
    filterType !== 'all' ||
    filterAge !== 'all' ||
    selectedGenres.length > 0 ||
    sortBy !== 'popularity.desc';

  const filterKey = `${rawGenres}|${filterType}|${filterAge}|${sortBy}`;

  const restoredSessionRef = useRef(null);
  if (!restoredSessionRef.current) {
    const saved = getPageSession('trending_session');
    if (
      saved &&
      saved.filterKey === filterKey &&
      Array.isArray(saved.moviesArr) &&
      saved.moviesArr.length > 0
    ) {
      restoredSessionRef.current = saved;
    }
  }

  const [moviesArr, setMoviesArr] = useState(
    () => restoredSessionRef.current?.moviesArr || []
  );
  const [page, setPage] = useState(
    () => restoredSessionRef.current?.page || 1
  );
  const [totalPages, setTotalPages] = useState(
    () => restoredSessionRef.current?.totalPages || 1
  );
  const [isLoading, setIsLoading] = useState(
    () => !restoredSessionRef.current
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const location = useLocation();
  const hasRestoredForFilterRef = useRef(Boolean(restoredSessionRef.current));

  const updateFilterParams = useCallback(
    overrides => {
      const next = {
        genres: rawGenres,
        type: filterType,
        age: filterAge,
        sort: sortBy,
        ...overrides,
      };
      const params = {};
      if (next.genres && next.genres.trim()) params.genres = next.genres.trim();
      if (next.type && next.type !== 'all') params.type = next.type;
      if (next.age && next.age !== 'all') params.age = next.age;
      if (next.sort && next.sort !== 'popularity.desc') params.sort = next.sort;
      setSearchParams(params);
    },
    [rawGenres, filterType, filterAge, sortBy, setSearchParams]
  );

  const handleTypeChange = newType => {
    updateFilterParams({ type: newType });
  };

  const handleAgeChange = newAge => {
    updateFilterParams({ age: newAge });
  };

  const handleSortChange = newSort => {
    updateFilterParams({ sort: newSort });
  };

  const handleToggleGenre = genreId => {
    let updated;
    if (selectedGenres.includes(genreId)) {
      updated = selectedGenres.filter(id => id !== genreId);
    } else {
      updated = [...selectedGenres, genreId];
    }
    updateFilterParams({ genres: updated.length > 0 ? updated.join(',') : '' });
  };

  const handleClearGenres = () => {
    updateFilterParams({ genres: '' });
  };

  const handleResetAllFilters = () => {
    setSearchParams({});
  };

  // Restore scroll position when restored from session
  useEffect(() => {
    if (restoredSessionRef.current?.scrollY > 0) {
      const targetY = restoredSessionRef.current.scrollY;
      const restore = () => {
        window.scrollTo({ top: targetY, behavior: 'instant' });
      };
      requestAnimationFrame(restore);
      const timer = setTimeout(restore, 40);
      return () => clearTimeout(timer);
    }
  }, []);

  // Track and save scroll position to session
  useEffect(() => {
    let scrollTimeout = null;
    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        updatePageScroll('trending_session', window.scrollY);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
      updatePageScroll('trending_session', window.scrollY);
    };
  }, []);

  useEffect(() => {
    if (hasRestoredForFilterRef.current) {
      hasRestoredForFilterRef.current = false;
      return;
    }

    let isCurrent = true;
    setIsLoading(true);

    const loadMovies = async () => {
      const startTime = Date.now();
      try {
        const data = !hasActiveFilters
          ? await getTrendingMovies(1)
          : await discoverMedia({
              type: filterType,
              genreIds: selectedGenres,
              age: filterAge,
              sortBy,
              page: 1,
            });

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
        savePageSession('trending_session', {
          filterKey,
          moviesArr: newResults,
          page: 1,
          totalPages: data?.total_pages || 1,
          scrollY: 0,
        });
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
  }, [hasActiveFilters, filterType, selectedGenres, filterAge, sortBy, filterKey]);

  const handleLoadMore = async () => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const data = !hasActiveFilters
        ? await getTrendingMovies(nextPage)
        : await discoverMedia({
            type: filterType,
            genreIds: selectedGenres,
            age: filterAge,
            sortBy,
            page: nextPage,
          });

      const newResults = (data?.results || []).filter(movie => movie.title || movie.name);
      newResults.forEach(item => {
        if (item.media_type) {
          setMediaType(item.id, item.media_type);
        }
      });
      if (newResults.length === 0) {
        setTotalPages(page);
      } else {
        setMoviesArr(prev => {
          const existingKeys = new Set(prev.map(m => `${m.media_type || 'movie'}-${m.id}`));
          const uniqueNew = newResults.filter(
            m => !existingKeys.has(`${m.media_type || 'movie'}-${m.id}`)
          );
          const updated = [...prev, ...uniqueNew];
          savePageSession('trending_session', {
            filterKey,
            moviesArr: updated,
            page: nextPage,
            totalPages: data?.total_pages || 1,
            scrollY: Math.round(window.scrollY),
          });
          return updated;
        });
        setPage(nextPage);
        setTotalPages(data?.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to load more movies:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const displayedMovies = useMemo(() => {
    const GRID_COLUMNS = 5;
    const hasMore = page < totalPages;
    if (hasMore) {
      const fullCount = Math.floor(moviesArr.length / GRID_COLUMNS) * GRID_COLUMNS;
      if (fullCount > 0) {
        return moviesArr.slice(0, fullCount);
      }
    }
    return moviesArr;
  }, [moviesArr, page, totalPages]);

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

      <FilterBar
        type={filterType}
        onTypeChange={handleTypeChange}
        age={filterAge}
        onAgeChange={handleAgeChange}
        selectedGenres={selectedGenres}
        onToggleGenre={handleToggleGenre}
        onClearGenres={handleClearGenres}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onResetFilters={handleResetAllFilters}
        hasActiveFilters={hasActiveFilters}
        variant="standalone"
      />

      {isLoading ? (
        <Loader caption="Filtering trending titles..." />
      ) : displayedMovies.length > 0 ? (
        <>
          <ul className={css.movieGrid}>
            {displayedMovies.map(movie => {
              const title = movie.title || movie.name;
              return (
                <li key={movie.id} className={css.movieCard}>
                  <Link
                    to={`/movies/${movie.id}`}
                    state={{ from: location, mediaType: movie.media_type }}
                    className={css.movieLink}
                    draggable="false"
                    onClick={e => {
                      updatePageScroll('trending_session', window.scrollY);
                      const selection = window.getSelection();
                      if (
                        selection &&
                        selection.toString().trim().length > 0 &&
                        e.currentTarget.contains(selection.anchorNode)
                      ) {
                        e.preventDefault();
                        return;
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
                        alt={title || 'Media poster'}
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
      ) : (
        <p className={css.noResults}>No trending titles found matching the selected filters.</p>
      )}
    </div>
  );
};

export default Trending;
