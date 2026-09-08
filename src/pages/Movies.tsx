import React, { useState, useEffect, useRef, useCallback, useMemo, FormEvent, ChangeEvent } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import {
  searchMedia,
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
import css from './Movies.module.css';

let hasLoadedSearchOnce = false;

export const Movies: React.FC = () => {
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const rawGenres = searchParams.get('genres') || searchParams.get('genre') || '';
  const selectedGenres = useMemo(() => {
    if (!rawGenres.trim()) return [];
    return rawGenres
      .split(',')
      .map(id => Number(id.trim()))
      .filter(id => !isNaN(id) && id > 0);
  }, [rawGenres]);

  const queryText = searchParams.get('query') || '';
  const filterType = searchParams.get('type') || 'all';
  const filterAge = searchParams.get('age') || 'all';
  const sortBy = searchParams.get('sort') || 'popularity.desc';

  const filterKey = `${queryText.trim().toLowerCase()}|${rawGenres}|${filterType}|${filterAge}|${sortBy}|${language}`;

  const restoredSessionRef = useRef<PageSessionData<MediaItem> | null>(null);
  if (!restoredSessionRef.current) {
    const saved = getPageSession<MediaItem>('movies_session', filterKey);
    if (
      saved &&
      Array.isArray(saved.movies) &&
      saved.movies.length > 0
    ) {
      if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
        const cleaned = saved.movies.filter(m => isAlphabeticalTitle(m.title || m.name));
        if (cleaned.length === saved.movies.length && cleaned.length > 0) {
          restoredSessionRef.current = saved;
        } else {
          clearPageSession('movies_session', filterKey);
        }
      } else {
        restoredSessionRef.current = saved;
      }
    }
  }

  const [movies, setMovies] = useState<MediaItem[]>(
    () => restoredSessionRef.current?.movies || []
  );
  const [page, setPage] = useState<number>(
    () => restoredSessionRef.current?.page || 1
  );
  const [totalPages, setTotalPages] = useState<number>(
    () => restoredSessionRef.current?.totalPages || 1
  );
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(
    () => !hasLoadedSearchOnce && !restoredSessionRef.current
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isPendingDebounce, setIsPendingDebounce] = useState<boolean>(false);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const lastLoadedFilterKeyRef = useRef<string | null>(
    restoredSessionRef.current ? filterKey : null
  );
  const isRestoringScrollRef = useRef<boolean>(false);
  const lastUserScrollYRef = useRef<number>(0);
  const prevLangRef = useRef<string>(language);
  const moviesRef = useRef(movies);
  moviesRef.current = movies;

  const hasActiveFilters =
    filterType !== 'all' ||
    filterAge !== 'all' ||
    selectedGenres.length > 0 ||
    sortBy !== 'popularity.desc';

  const updateFilterParams = useCallback(
    (overrides: Record<string, string>) => {
      const next: Record<string, string> = {
        query: queryText,
        genres: rawGenres,
        type: filterType,
        age: filterAge,
        sort: sortBy,
        ...overrides,
      };
      const params: Record<string, string> = {};
      if (next.query && next.query.trim()) params.query = next.query.trim();
      if (next.genres && next.genres.trim()) params.genres = next.genres.trim();
      if (next.type && next.type !== 'all') params.type = next.type;
      if (next.age && next.age !== 'all') params.age = next.age;
      if (next.sort && next.sort !== 'popularity.desc') params.sort = next.sort;
      setSearchParams(params);
    },
    [queryText, rawGenres, filterType, filterAge, sortBy, setSearchParams]
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
    const params: Record<string, string> = {};
    if (queryText.trim()) params.query = queryText.trim();
    setSearchParams(params);
  };

  useEffect(() => {
    if (!hasLoadedSearchOnce && !restoredSessionRef.current) {
      const timer = setTimeout(() => {
        hasLoadedSearchOnce = true;
        setIsInitialLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Helper: fast and smooth scroll restoration
  const restoreScrollTo = useCallback((targetY: number) => {
    if (!(targetY > 0)) return;
    isRestoringScrollRef.current = true;

    let rafId: number | null = null;
    const timeoutId = setTimeout(() => {
      const startY = window.scrollY;
      const diff = targetY - startY;
      if (Math.abs(diff) < 8) {
        window.scrollTo({ top: targetY, behavior: 'auto' });
        isRestoringScrollRef.current = false;
        return;
      }

      // Fast and responsive duration: 220ms - 380ms depending on distance
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

  // Restore scroll position with safe retries when restored from session at mount
  useEffect(() => {
    if ((restoredSessionRef.current?.scrollY ?? 0) > 0) {
      return restoreScrollTo(restoredSessionRef.current!.scrollY!);
    }
  }, [restoreScrollTo]);

  // Track and save scroll position to session, guarded against restoration resets
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (isRestoringScrollRef.current) return;
      lastUserScrollYRef.current = window.scrollY;
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        if (!isRestoringScrollRef.current) {
          updatePageScroll('movies_session', window.scrollY, filterKey);
        }
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
      if (!isRestoringScrollRef.current && lastUserScrollYRef.current > 0) {
        updatePageScroll('movies_session', lastUserScrollYRef.current, filterKey);
      }
    };
  }, [filterKey]);

  const executeSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        if (!hasActiveFilters) {
          setMovies([]);
          setPage(1);
          setTotalPages(1);
          setIsLoading(false);
          setIsPendingDebounce(false);
          return;
        }
        return;
      }
      setIsPendingDebounce(false);
      setIsLoading(true);
      const startTime = Date.now();
      try {
        const data = await searchMedia(query.trim(), 1, filterType);
        const elapsed = Date.now() - startTime;
        if (elapsed < 500) {
          await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
        }
        const results = (data?.results || []).filter(movie => movie.title || movie.name);
        results.forEach(item => {
          if (item.media_type) setMediaType(item.id, item.media_type);
        });
        let finalResults = results;
        if (filterAge !== 'all') {
          finalResults = await Promise.all(
            results.map(async item => {
              const rating = await getMediaAgeRating(item.id, item.media_type);
              return { ...item, age_rating: rating };
            })
          );
        }
        setMovies(finalResults);
        setPage(1);
        setTotalPages(data.total_pages || 1);
        savePageSession('movies_session', {
          filterKey,
          movies: finalResults,
          page: 1,
          totalPages: data.total_pages || 1,
          scrollY: 0,
        });
        lastLoadedFilterKeyRef.current = filterKey;
      } catch (error) {
        console.error('Failed to search media:', error);
        setMovies([]);
        setPage(1);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [filterType, filterAge, hasActiveFilters, filterKey]
  );

  // Text search debounce effect
  useEffect(() => {
    if (lastLoadedFilterKeyRef.current === filterKey) {
      return;
    }

    // Check if we have cached data for this filter state (from prior search, navigation or load more)
    const saved = getPageSession<MediaItem>('movies_session', filterKey);
    if (
      saved &&
      Array.isArray(saved.movies) &&
      saved.movies.length > 0
    ) {
      let isCurrent = true;
      setIsLoading(true);
      const startTime = Date.now();

      if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
        const cleaned = saved.movies.filter(m => isAlphabeticalTitle(m.title || m.name));
        if (cleaned.length !== saved.movies.length || cleaned.length === 0) {
          clearPageSession('movies_session', filterKey);
        } else {
          const applySaved = async () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < 500) {
              await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
            }
            if (!isCurrent) return;
            setMovies(cleaned);
            setPage(saved.page || 1);
            setTotalPages(saved.totalPages || 1);
            setIsLoading(false);
            setIsPendingDebounce(false);
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
          setMovies(saved.movies || []);
          setPage(saved.page || 1);
          setTotalPages(saved.totalPages || 1);
          setIsLoading(false);
          setIsPendingDebounce(false);
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

    if (!queryText.trim()) {
      setIsPendingDebounce(false);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    const isLangChange = prevLangRef.current !== language;
    prevLangRef.current = language;

    if (isLangChange) {
      setIsPendingDebounce(false);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      executeSearch(queryText);
      return;
    }

    setIsPendingDebounce(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(queryText);
    }, 1500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [queryText, executeSearch, filterKey, restoreScrollTo, language, sortBy]);

  // Discovery mode effect when search query is empty
  useEffect(() => {
    if (queryText.trim()) {
      return;
    }

    if (lastLoadedFilterKeyRef.current === filterKey) {
      return;
    }

    let isCurrent = true;
    const startTime = Date.now();

    // Check if we have cached data for this filter state (from prior discovery or navigation)
    const saved = getPageSession<MediaItem>('movies_session', filterKey);
    if (
      saved &&
      Array.isArray(saved.movies) &&
      saved.movies.length > 0
    ) {
      setIsLoading(true);
      const applySaved = async () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 500) {
          await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
        }
        if (!isCurrent) return;
        setMovies(saved.movies || []);
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

    if (!hasActiveFilters) {
      setMovies([]);
      setPage(1);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const loadFilteredMedia = async () => {
      const startTime = Date.now();
      try {
        let items: MediaItem[] = [];
        let curPage = 1;
        let totPages = 1;

        if (filterAge === 'all') {
          const data = await discoverMedia({
            type: filterType as any,
            genreIds: selectedGenres,
            age: filterAge,
            sortBy: sortBy as any,
            page: 1,
          });
          if (!isCurrent) return;
          const results = (data?.results || []).filter(movie => movie.title || movie.name);
          results.forEach(item => {
            if (item.media_type) setMediaType(item.id, item.media_type);
          });
          items = results;
          curPage = 1;
          totPages = data?.total_pages || 1;
        } else {
          // Hybrid approach: scan and verify age ratings
          let p = 1;
          let fetchedCount = 0;
          const maxPagesToScan = 4;
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
              if (item.media_type) setMediaType(item.id, item.media_type);
            });

            const enriched = await Promise.all(
              raw.map(async item => {
                const rating = await getMediaAgeRating(item.id, item.media_type);
                return { ...item, age_rating: rating };
              })
            );

            const matched = enriched.filter(item => matchesAgeFilter(item.age_rating, filterAge));
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

        setMovies(items);
        setPage(curPage);
        setTotalPages(totPages);
        savePageSession('movies_session', {
          filterKey,
          movies: items,
          page: curPage,
          totalPages: totPages,
          scrollY: 0,
        });
        lastLoadedFilterKeyRef.current = filterKey;
      } catch (err) {
        if (!isCurrent) return;
        console.error('Failed to discover media:', err);
        setMovies([]);
        setPage(1);
        setTotalPages(1);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    loadFilteredMedia();

    return () => {
      isCurrent = false;
    };
  }, [queryText, hasActiveFilters, filterType, selectedGenres, filterAge, sortBy, filterKey, restoreScrollTo]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    executeSearch(queryText);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFilterParams({ query: value });
  };

  const handleClear = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setIsPendingDebounce(false);
    updateFilterParams({ query: '' });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);

    try {
      if (queryText.trim()) {
        const nextPage = page + 1;
        const data = await searchMedia(queryText.trim(), nextPage, filterType);
        if (data?.results) {
          const newResults = data.results.filter(movie => movie.title || movie.name);
          newResults.forEach(item => {
            if (item.media_type) setMediaType(item.id, item.media_type);
          });
          let processedResults = newResults;
          if (filterAge !== 'all') {
            processedResults = await Promise.all(
              newResults.map(async item => {
                const rating = await getMediaAgeRating(item.id, item.media_type);
                return { ...item, age_rating: rating };
              })
            );
          }
          if (processedResults.length === 0) {
            setTotalPages(page);
          } else {
            setMovies(prev => {
              const existingKeys = new Set(prev.map(m => `${m.media_type || 'movie'}-${m.id}`));
              const uniqueNew = processedResults.filter(
                m => !existingKeys.has(`${m.media_type || 'movie'}-${m.id}`)
              );
              const updated = [...prev, ...uniqueNew];
              savePageSession('movies_session', {
                filterKey,
                movies: updated,
                page: nextPage,
                totalPages: data.total_pages || 1,
                scrollY: Math.round(window.scrollY),
              });
              return updated;
            });
            setPage(nextPage);
            setTotalPages(data.total_pages || 1);
          }
        }
      } else if (filterAge === 'all') {
        const nextPage = page + 1;
        const data = await discoverMedia({
          type: filterType as any,
          genreIds: selectedGenres,
          age: filterAge,
          sortBy: sortBy as any,
          page: nextPage,
        });

        if (data?.results) {
          const newResults = data.results.filter(movie => movie.title || movie.name);
          newResults.forEach(item => {
            if (item.media_type) setMediaType(item.id, item.media_type);
          });
          if (newResults.length === 0) {
            setTotalPages(page);
          } else {
            setMovies(prev => {
              const existingKeys = new Set(prev.map(m => `${m.media_type || 'movie'}-${m.id}`));
              const uniqueNew = newResults.filter(
                m => !existingKeys.has(`${m.media_type || 'movie'}-${m.id}`)
              );
              const updated = [...prev, ...uniqueNew];
              savePageSession('movies_session', {
                filterKey,
                movies: updated,
                page: nextPage,
                totalPages: data.total_pages || 1,
                scrollY: Math.round(window.scrollY),
              });
              return updated;
            });
            setPage(nextPage);
            setTotalPages(data.total_pages || 1);
          }
        }
      } else {
        // Hybrid age filtering load more
        let p = page + 1;
        const newItems: MediaItem[] = [];
        let fetchedCount = 0;
        const maxPagesToScan = 3;
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
            if (item.media_type) setMediaType(item.id, item.media_type);
          });

          const enriched = await Promise.all(
            raw.map(async item => {
              const rating = await getMediaAgeRating(item.id, item.media_type);
              return { ...item, age_rating: rating };
            })
          );

          const matched = enriched.filter(item => matchesAgeFilter(item.age_rating, filterAge));
          const existingKeys = new Set([
            ...movies.map(m => `${m.media_type || 'movie'}-${m.id}`),
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
          setMovies(prev => {
            const updated = [...prev, ...newItems];
            savePageSession('movies_session', {
              filterKey,
              movies: updated,
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
      console.error('Failed to load more media:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const displayedMovies = useMemo(() => {
    let list = movies;
    if (queryText.trim()) {
      if (selectedGenres.length > 0) {
        list = list.filter(
          movie =>
            Array.isArray(movie.genre_ids) &&
            selectedGenres.every(id => movie.genre_ids!.includes(Number(id)))
        );
      }
      if (filterType !== 'all') {
        list = list.filter(m => m.media_type === filterType);
      }
      if (filterAge !== 'all') {
        list = list.filter(m => matchesAgeFilter(m.age_rating, filterAge));
      }
      if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
        list = list.filter(m => isAlphabeticalTitle(m.title || m.name));
      }
      if (sortBy === 'vote_average.desc') {
        list = [...list].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      } else if (sortBy === 'primary_release_date.desc') {
        list = [...list].sort((a, b) => {
          const dateA = a.release_date || a.first_air_date || '';
          const dateB = b.release_date || b.first_air_date || '';
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateB.localeCompare(dateA);
        });
      } else if (sortBy === 'original_title.asc') {
        list = [...list].sort((a, b) => {
          const nameA = (a.title || a.name || '').trim();
          const nameB = (b.title || b.name || '').trim();
          return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        });
      } else if (sortBy === 'original_title.desc') {
        list = [...list].sort((a, b) => {
          const nameA = (a.title || a.name || '').trim();
          const nameB = (b.title || b.name || '').trim();
          return nameB.localeCompare(nameA, undefined, { sensitivity: 'base' });
        });
      } else {
        list = [...list].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      }
    }

    // Grid row alignment:
    // If more items can be loaded (page < totalPages), align the displayed count
    // to a full multiple of 5 columns so the grid never shows an incomplete row with an empty slot.
    const GRID_COLUMNS = 5;
    const hasMore = page < totalPages;
    if (hasMore) {
      const fullCount = Math.floor(list.length / GRID_COLUMNS) * GRID_COLUMNS;
      if (fullCount > 0) {
        return list.slice(0, fullCount);
      }
    }

    return list;
  }, [movies, queryText, selectedGenres, filterType, filterAge, sortBy, page, totalPages]);

  if (isInitialLoading) {
    return <Loader isCentered caption={t('search.loading', 'Loading search...')} />;
  }

  return (
    <div className={css.searchSection}>
      <div className={css.headerSection}>
        <h1 className={css.mainTitle}>
          <span className={css.titleIcon} aria-hidden="true">
            🔎
          </span>
          {t('search.title')}
        </h1>
      </div>

      <form className={css.searchForm} onSubmit={handleSubmit} role="search">
        <div className={css.formInner}>
          <div className={css.searchCard}>
            <div className={css.inputWrapper}>
              <input
                ref={inputRef}
                className={css.searchInput}
                type="search"
                placeholder={t('search.placeholder')}
                aria-label={t('search.title')}
                value={queryText}
                onChange={handleInputChange}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                autoFocus
              />
              {queryText && (
                <button
                  type="button"
                  className={css.clearBtn}
                  onClick={handleClear}
                  aria-label={t('search.clearSearchInput', 'Clear search input')}
                  title={t('search.clearSearch', 'Clear search')}
                >
                  ✕
                </button>
              )}
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
              variant="attached"
              isFocused={isInputFocused}
            />
          </div>

          {isPendingDebounce && (
            <div className={css.debounceStatus}>
              <span className={css.debounceIcon}>⏳</span>
              <span className={css.debounceText}>
                {t('search.debounceNotice', 'Searching in 1.5s... or press')}{' '}
                <kbd className={css.enterKey}>Enter ⏎</kbd>{' '}
                {t('search.debounceNoticeEnd', 'to search now')}
              </span>
              <button type="submit" className={css.instantSearchBtn}>
                {t('search.searchNow', 'Search now')}
              </button>
            </div>
          )}
        </div>
      </form>

      {isPendingDebounce || isLoading ? (
        <Loader
          caption={
            queryText
              ? t('search.searchingFor', 'Searching for "{query}"...').replace('{query}', queryText)
              : t('search.filteringTitles', 'Loading titles matching filters...')
          }
        />
      ) : displayedMovies.length > 0 ? (
        <>
          <ul className={css.movieGrid}>
            {displayedMovies.map(movie => {
              const title = movie.title || movie.name;
              return (
                <li key={movie.id} className={css.movieCard}>
                  <Link
                    to={`/movies/${movie.id}`}
                    state={{ from: location, mediaType: movie.media_type, source: 'movies' }}
                    className={css.movieLink}
                    draggable="false"
                    onClick={e => {
                      sessionStorage.setItem('movie_origin_tab', 'movies');
                      updatePageScroll('movies_session', window.scrollY, filterKey, true);
                      const selection = window.getSelection();
                      if (
                        selection &&
                        selection.toString().trim().length > 0 &&
                        e.currentTarget.contains(selection.anchorNode as Node)
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
                        onFilterType={handleTypeChange}
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
                    <span>{t('search.loadMore')}</span>
                    <span className={css.loadMoreArrow}>↓</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        (queryText || hasActiveFilters) && (
          <p className={css.noResults}>
            {t('search.noResultsDesc')}
          </p>
        )
      )}
    </div>
  );
};

export default Movies;
