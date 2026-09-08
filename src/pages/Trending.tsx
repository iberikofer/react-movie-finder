import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  getTrendingMovies,
  discoverMedia,
  setMediaType,
  getMediaAgeRating,
  matchesAgeFilter,
  isAlphabeticalTitle,
} from 'fetch';
import { MediaItem, PageSessionData } from 'types';
import MovieCardRatingBadge from '../components/CriticsScore/MovieCardRatingBadge';
import FilterBar from '../components/FilterBar/FilterBar';
import Loader from '../components/Loader/Loader';
import MediaTypeBadge from '../components/MediaTypeBadge/MediaTypeBadge';
import AgeRatingBadge from '../components/AgeRatingBadge/AgeRatingBadge';
import SaveMovieButton from '../components/SaveMovieButton/SaveMovieButton';
import {
  savePageSession,
  getPageSession,
  updatePageScroll,
  clearPageSession,
} from '../utils/sessionStorage';
import { useLanguage } from '../context/LanguageContext';
import css from './Trending.module.css';

export const Trending: React.FC = () => {
  const { t, language } = useLanguage();
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

  const filterKey = `${rawGenres}|${filterType}|${filterAge}|${sortBy}|${language}`;

  const restoredSessionRef = useRef<PageSessionData<MediaItem> | null>(null);
  if (!restoredSessionRef.current) {
    const saved = getPageSession<MediaItem>('trending_session', filterKey);
    if (
      saved &&
      Array.isArray(saved.moviesArr) &&
      saved.moviesArr.length > 0
    ) {
      if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
        const cleaned = saved.moviesArr.filter(m => isAlphabeticalTitle(m.title || m.name));
        if (cleaned.length === saved.moviesArr.length && cleaned.length > 0) {
          restoredSessionRef.current = saved;
        } else {
          clearPageSession('trending_session', filterKey);
        }
      } else {
        restoredSessionRef.current = saved;
      }
    }
  }

  const [moviesArr, setMoviesArr] = useState<MediaItem[]>(
    () => restoredSessionRef.current?.moviesArr || []
  );
  const [page, setPage] = useState<number>(
    () => restoredSessionRef.current?.page || 1
  );
  const [totalPages, setTotalPages] = useState<number>(
    () => restoredSessionRef.current?.totalPages || 1
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !restoredSessionRef.current
  );
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const location = useLocation();
  const lastLoadedFilterKeyRef = useRef<string | null>(
    restoredSessionRef.current ? filterKey : null
  );
  const isRestoringScrollRef = useRef<boolean>(false);
  const lastUserScrollYRef = useRef<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const moviesArrRef = useRef(moviesArr);
  moviesArrRef.current = moviesArr;

  useEffect(() => {
    const handleTrendingNavClick = () => {
      clearPageSession('trending_session');
      lastLoadedFilterKeyRef.current = null;
      lastUserScrollYRef.current = 0;
      isRestoringScrollRef.current = false;
      setSearchParams({});
      setMoviesArr([]);
      setPage(1);
      setTotalPages(1);
      setIsLoading(true);
      window.scrollTo({ top: 0, behavior: 'auto' });
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('trending_nav_click', handleTrendingNavClick);
    return () => {
      window.removeEventListener('trending_nav_click', handleTrendingNavClick);
    };
  }, [setSearchParams]);

  const updateFilterParams = useCallback(
    (overrides: Record<string, string>) => {
      const next = {
        genres: rawGenres,
        type: filterType,
        age: filterAge,
        sort: sortBy,
        ...overrides,
      };
      const params: Record<string, string> = {};
      if (next.genres && next.genres.trim()) params.genres = next.genres.trim();
      if (next.type && next.type !== 'all') params.type = next.type;
      if (next.age && next.age !== 'all') params.age = next.age;
      if (next.sort && next.sort !== 'popularity.desc') params.sort = next.sort;
      setSearchParams(params);
    },
    [rawGenres, filterType, filterAge, sortBy, setSearchParams]
  );

  const handleTypeChange = (newType: string) => {
    updateFilterParams({ type: newType });
  };

  const handleAgeChange = (newAge: string) => {
    updateFilterParams({ age: newAge });
  };

  const handleSortChange = (newSort: string) => {
    updateFilterParams({ sort: newSort });
  };

  const handleToggleGenre = (genreId: number) => {
    let updated: number[];
    if (selectedGenres.includes(genreId)) {
      updated = selectedGenres.filter(id => id !== genreId);
    } else {
      updated = [...selectedGenres, genreId];
    }
    updateFilterParams({ genres: updated.length > 0 ? updated.join(',') : '' });
  };

  const handleGenresChange = (newGenres: number[]) => {
    updateFilterParams({ genres: newGenres.length > 0 ? newGenres.join(',') : '' });
  };

  const handleClearGenres = () => {
    updateFilterParams({ genres: '' });
  };

  const handleResetAllFilters = () => {
    setSearchParams({});
  };

  const restoreScrollTo = useCallback((targetY: number) => {
    if (!(targetY > 0)) return;
    isRestoringScrollRef.current = true;

    let rafId: number | null = null;
    let timeoutId = setTimeout(() => {
      const startY = window.scrollY;
      const diff = targetY - startY;
      if (Math.abs(diff) < 8) {
        window.scrollTo({ top: targetY, behavior: 'auto' });
        isRestoringScrollRef.current = false;
        return;
      }

      const duration = Math.min(380, Math.max(220, Math.abs(diff) * 0.22));
      const startTime = performance.now();
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = easeOutCubic(progress);
        window.scrollTo({ top: Math.round(startY + diff * ease), behavior: 'auto' });

        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          window.scrollTo({ top: targetY, behavior: 'auto' });
          setTimeout(() => {
            isRestoringScrollRef.current = false;
          }, 80);
        }
      };

      rafId = requestAnimationFrame(step);
    }, 40);

    return () => {
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
      isRestoringScrollRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (restoredSessionRef.current?.scrollY && restoredSessionRef.current.scrollY > 0) {
      return restoreScrollTo(restoredSessionRef.current.scrollY);
    }
  }, [restoreScrollTo]);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (isRestoringScrollRef.current) return;
      lastUserScrollYRef.current = window.scrollY;
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        if (!isRestoringScrollRef.current) {
          updatePageScroll('trending_session', window.scrollY, filterKey);
        }
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
      if (!isRestoringScrollRef.current && lastUserScrollYRef.current > 0) {
        updatePageScroll('trending_session', lastUserScrollYRef.current, filterKey);
      }
    };
  }, [filterKey]);

  useEffect(() => {
    if (lastLoadedFilterKeyRef.current === filterKey) {
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    const startTime = Date.now();

    const saved = getPageSession<MediaItem>('trending_session', filterKey);
    if (
      saved &&
      Array.isArray(saved.moviesArr) &&
      saved.moviesArr.length > 0
    ) {
      if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
        const cleaned = saved.moviesArr.filter(m => isAlphabeticalTitle(m.title || m.name));
        if (cleaned.length !== saved.moviesArr.length || cleaned.length === 0) {
          clearPageSession('trending_session', filterKey);
        } else {
          const applySaved = async () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < 500) {
              await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
            }
            if (!isCurrent) return;
            setMoviesArr(cleaned);
            setPage(saved.page || 1);
            setTotalPages(saved.totalPages || 1);
            setIsLoading(false);
            lastLoadedFilterKeyRef.current = filterKey;
            if ((saved.scrollY || 0) > 0) {
              restoreScrollTo(saved.scrollY || 0);
            }
          };
          applySaved();
          return () => {
            isCurrent = false;
          };
        }
      } else {
        const applySaved = async () => {
          const elapsed = Date.now() - startTime;
          if (elapsed < 500) {
            await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
          }
          if (!isCurrent) return;
          setMoviesArr(saved.moviesArr || []);
          setPage(saved.page || 1);
          setTotalPages(saved.totalPages || 1);
          setIsLoading(false);
          lastLoadedFilterKeyRef.current = filterKey;
          if ((saved.scrollY || 0) > 0) {
            restoreScrollTo(saved.scrollY || 0);
          }
        };
        applySaved();
        return () => {
          isCurrent = false;
        };
      }
    }

    const loadMovies = async () => {
      const startTime = Date.now();
      try {
        let items: MediaItem[] = [];
        let curPage = 1;
        let totPages = 1;

        if (filterAge === 'all') {
          const data = !hasActiveFilters
            ? await getTrendingMovies(1)
            : await discoverMedia({
                type: filterType as any,
                genreIds: selectedGenres,
                age: filterAge,
                sortBy: sortBy as any,
                page: 1,
              });

          if (!isCurrent) return;
          let newResults = (data?.results || []).filter(movie => movie.title || movie.name);
          if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
            newResults = newResults.filter(m => isAlphabeticalTitle(m.title || m.name));
          }
          newResults.forEach(item => {
            if (item.media_type === 'movie' || item.media_type === 'tv') {
              setMediaType(item.id, item.media_type);
            }
          });
          items = newResults;
          curPage = 1;
          totPages = data?.total_pages || 1;
        } else {
          let p = 1;
          let fetchedCount = 0;
          let maxPagesToScan = 4;
          totPages = 1;

          while (isCurrent && items.length < 15 && p <= totPages && fetchedCount < maxPagesToScan) {
            const data = await discoverMedia({
              type: filterType as any,
              genreIds: selectedGenres,
              age: filterAge,
              sortBy: sortBy as any,
              page: p,
            });

            if (!isCurrent) return;
            totPages = data?.total_pages || 1;
            const raw = (data?.results || []).filter(movie => movie.title || movie.name);
            raw.forEach(item => {
              if (item.media_type === 'movie' || item.media_type === 'tv') {
                setMediaType(item.id, item.media_type);
              }
            });

            const enriched = await Promise.all(
              raw.map(async item => {
                const rating = await getMediaAgeRating(item.id, item.media_type === 'tv' ? 'tv' : 'movie');
                return { ...item, age_rating: rating };
              })
            );

            let matched = enriched.filter(item => matchesAgeFilter(item.age_rating, filterAge));
            if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
              matched = matched.filter(item => isAlphabeticalTitle(item.title || item.name));
            }
            const existingKeys = new Set(items.map(m => `${m.media_type || 'movie'}-${m.id}`));
            matched.forEach(item => {
              const key = `${item.media_type || 'movie'}-${item.id}`;
              if (!existingKeys.has(key)) {
                existingKeys.add(key);
                items.push(item);
              }
            });

            curPage = p;
            p += 1;
            fetchedCount += 1;
            if (raw.length === 0) break;
          }
        }

        if (!isCurrent) return;

        const elapsed = Date.now() - startTime;
        if (elapsed < 500) {
          await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
        }
        if (!isCurrent) return;

        setMoviesArr(items);
        setPage(curPage);
        setTotalPages(totPages);
        savePageSession('trending_session', {
          filterKey,
          moviesArr: items,
          page: curPage,
          totalPages: totPages,
          scrollY: 0,
        });
        lastLoadedFilterKeyRef.current = filterKey;
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
  }, [hasActiveFilters, filterType, selectedGenres, filterAge, sortBy, filterKey, refreshTrigger, restoreScrollTo]);

  const handleLoadMore = async () => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);

    try {
      if (filterAge === 'all') {
        const nextPage = page + 1;
        const data = !hasActiveFilters
          ? await getTrendingMovies(nextPage)
          : await discoverMedia({
              type: filterType as any,
              genreIds: selectedGenres,
              age: filterAge,
              sortBy: sortBy as any,
              page: nextPage,
            });

        let newResults = (data?.results || []).filter(movie => movie.title || movie.name);
        if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
          newResults = newResults.filter(m => isAlphabeticalTitle(m.title || m.name));
        }
        newResults.forEach(item => {
          if (item.media_type === 'movie' || item.media_type === 'tv') {
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
      } else {
        let p = page + 1;
        let newItems: MediaItem[] = [];
        let fetchedCount = 0;
        let maxPagesToScan = 3;
        let totPages = totalPages;

        while (newItems.length < 10 && p <= totPages && fetchedCount < maxPagesToScan) {
          const data = await discoverMedia({
            type: filterType as any,
            genreIds: selectedGenres,
            age: filterAge,
            sortBy: sortBy as any,
            page: p,
          });

          totPages = data?.total_pages || 1;
          const raw = (data?.results || []).filter(movie => movie.title || movie.name);
          raw.forEach(item => {
            if (item.media_type === 'movie' || item.media_type === 'tv') {
              setMediaType(item.id, item.media_type);
            }
          });

          const enriched = await Promise.all(
            raw.map(async item => {
              const rating = await getMediaAgeRating(item.id, item.media_type === 'tv' ? 'tv' : 'movie');
              return { ...item, age_rating: rating };
            })
          );

          let matched = enriched.filter(item => matchesAgeFilter(item.age_rating, filterAge));
          if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
            matched = matched.filter(item => isAlphabeticalTitle(item.title || item.name));
          }
          const existingKeys = new Set([
            ...moviesArr.map(m => `${m.media_type || 'movie'}-${m.id}`),
            ...newItems.map(m => `${m.media_type || 'movie'}-${m.id}`),
          ]);
          matched.forEach(item => {
            const key = `${item.media_type || 'movie'}-${item.id}`;
            if (!existingKeys.has(key)) {
              existingKeys.add(key);
              newItems.push(item);
            }
          });

          fetchedCount += 1;
          if (raw.length === 0) break;
          p += 1;
        }

        const finalPage = Math.max(page, p - 1);
        if (newItems.length > 0) {
          setMoviesArr(prev => {
            const updated = [...prev, ...newItems];
            savePageSession('trending_session', {
              filterKey,
              moviesArr: updated,
              page: finalPage,
              totalPages: totPages,
              scrollY: Math.round(window.scrollY),
            });
            return updated;
          });
        }
        setPage(finalPage);
        setTotalPages(totPages);
      }
    } catch (error) {
      console.error('Failed to load more movies:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const displayedMovies = useMemo(() => {
    let list = moviesArr;
    if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
      list = list.filter(m => isAlphabeticalTitle(m.title || m.name));
    }
    const GRID_COLUMNS = 5;
    const hasMore = page < totalPages;
    if (hasMore) {
      const fullCount = Math.floor(list.length / GRID_COLUMNS) * GRID_COLUMNS;
      if (fullCount > 0) {
        return list.slice(0, fullCount);
      }
    }
    return list;
  }, [moviesArr, page, totalPages, sortBy]);

  if (isLoading && moviesArr.length === 0) {
    return <Loader isCentered caption={t('trending.loading', 'Loading trending titles...')} />;
  }

  return (
    <div className={css.container}>
      <div className={css.headerSection}>
        <h1 className={css.mainTitle}>
          <span className={css.titleIcon} aria-hidden="true">
            🔥
          </span>
          {t('trending.title')}
        </h1>
        <p className={css.sectionDesc}>
          {t('trending.subtitle')}
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
        onGenresChange={handleGenresChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onResetFilters={handleResetAllFilters}
        hasActiveFilters={hasActiveFilters}
        variant="standalone"
      />

      {isLoading ? (
        <Loader caption={t('trending.filtering', 'Filtering trending titles...')} />
      ) : displayedMovies.length > 0 ? (
        <>
          <ul className={css.movieGrid}>
            {displayedMovies.map(movie => {
              const title = movie.title || movie.name;
              return (
                <li key={movie.id} className={css.movieCard}>
                  <Link
                    to={`/movies/${movie.id}`}
                    state={{ from: location, mediaType: movie.media_type, source: 'trending' }}
                    className={css.movieLink}
                    draggable="false"
                    onClick={e => {
                      sessionStorage.setItem('movie_origin_tab', 'trending');
                      updatePageScroll('trending_session', window.scrollY, filterKey, true);
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
                      <MediaTypeBadge
                        mediaType={movie.media_type}
                        item={movie}
                        onFilterType={handleTypeChange as any}
                      />
                      <AgeRatingBadge
                        movie={movie}
                        onFilterAge={handleAgeChange}
                      />
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
                    <span>{t('search.searching')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('trending.loadMore')}</span>
                    <span className={css.loadMoreArrow}>↓</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <p className={css.noResults}>{t('search.noResults')}</p>
      )}
    </div>
  );
};

export default Trending;
