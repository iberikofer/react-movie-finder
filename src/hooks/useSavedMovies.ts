import { useState, useEffect, useCallback } from 'react';
import { MediaItem } from 'types';

const STORAGE_KEY = 'movie_finder_saved_movies';

export interface SavedMediaItem extends MediaItem {
  savedAt?: number;
}

export interface UseSavedMoviesReturn {
  savedMovies: SavedMediaItem[];
  savedCount: number;
  isSaved: (movieId: string | number) => boolean;
  toggleSave: (movie: MediaItem) => boolean;
  saveMovie: (movie: MediaItem) => boolean;
  removeMovie: (movieId: string | number) => boolean;
  clearAll: () => boolean;
}

export const getSavedMovies = (): SavedMediaItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read saved movies from localStorage:', error);
    return [];
  }
};

export const saveMovieToStorage = (movie: MediaItem): boolean => {
  if (!movie || !movie.id) return false;
  try {
    const current = getSavedMovies();
    const exists = current.some(m => String(m.id) === String(movie.id));
    if (exists) return false;

    const compactMovie: SavedMediaItem = {
      id: movie.id,
      title: movie.title || movie.name || '',
      name: movie.name || movie.title || '',
      poster_path: movie.poster_path || '',
      media_type: movie.media_type || (movie.first_air_date ? 'tv' : 'movie'),
      vote_average: movie.vote_average || 0,
      release_date: movie.release_date || movie.first_air_date || '',
      first_air_date: movie.first_air_date || movie.release_date || '',
      age_rating: movie.age_rating || null,
      genre_ids: Array.isArray(movie.genre_ids)
        ? movie.genre_ids
        : Array.isArray(movie.genres)
        ? movie.genres.map(g => g.id)
        : [],
      popularity: movie.popularity || 0,
      savedAt: Date.now(),
    };

    const updated = [compactMovie, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    window.dispatchEvent(
      new CustomEvent('saved_movies_updated', {
        detail: { movieId: movie.id, isSaved: true },
      })
    );

    // If movie was saved from a list view lacking age_rating or genre_ids, enrich in background
    if (!compactMovie.age_rating || compactMovie.genre_ids?.length === 0) {
      import('../fetch')
        .then(({ getMovieDetails }) => {
          getMovieDetails(movie.id, compactMovie.media_type === 'tv' ? 'tv' : 'movie')
            .then(details => {
              if (!details) return;
              const currentList = getSavedMovies();
              const idx = currentList.findIndex(m => String(m.id) === String(movie.id));
              if (idx === -1) return;
              const item = currentList[idx];
              const genreIds =
                item.genre_ids && item.genre_ids.length > 0
                  ? item.genre_ids
                  : Array.isArray(details.genres)
                  ? details.genres.map(g => (typeof g === 'object' ? g.id : g))
                  : [];
              currentList[idx] = {
                ...item,
                age_rating: item.age_rating || details.age_rating || null,
                genre_ids: genreIds,
                popularity: item.popularity || details.popularity || 0,
              };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));
              window.dispatchEvent(
                new CustomEvent('saved_movies_updated', {
                  detail: { movieId: movie.id, isSaved: true, enriched: true },
                })
              );
            })
            .catch(() => {});
        })
        .catch(() => {});
    }

    return true;
  } catch (error) {
    console.error('Failed to save movie to localStorage:', error);
    return false;
  }
};

export const removeMovieFromStorage = (movieId: string | number): boolean => {
  if (!movieId) return false;
  try {
    const current = getSavedMovies();
    const updated = current.filter(m => String(m.id) !== String(movieId));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    window.dispatchEvent(
      new CustomEvent('saved_movies_updated', {
        detail: { movieId, isSaved: false },
      })
    );
    return true;
  } catch (error) {
    console.error('Failed to remove movie from localStorage:', error);
    return false;
  }
};

export const clearAllSavedMovies = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent('saved_movies_updated', {
        detail: { all: true },
      })
    );
    return true;
  } catch (error) {
    console.error('Failed to clear saved movies from localStorage:', error);
    return false;
  }
};

export const isMovieSavedInStorage = (movieId?: string | number): boolean => {
  if (!movieId) return false;
  const current = getSavedMovies();
  return current.some(m => String(m.id) === String(movieId));
};

export const useSavedMovies = (): UseSavedMoviesReturn => {
  const [savedList, setSavedList] = useState<SavedMediaItem[]>(getSavedMovies);

  const reload = useCallback(() => {
    setSavedList(getSavedMovies());
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      reload();
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === STORAGE_KEY) {
        reload();
      }
    };

    window.addEventListener('saved_movies_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('saved_movies_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [reload]);

  const toggleSave = useCallback((movie: MediaItem): boolean => {
    if (!movie || !movie.id) return false;
    const isCurrentlySaved = isMovieSavedInStorage(movie.id);
    if (isCurrentlySaved) {
      removeMovieFromStorage(movie.id);
      return false;
    }
    saveMovieToStorage(movie);
    return true;
  }, []);

  const isSaved = useCallback(
    (movieId: string | number): boolean => {
      if (!movieId) return false;
      return savedList.some(m => String(m.id) === String(movieId));
    },
    [savedList]
  );

  return {
    savedMovies: savedList,
    savedCount: savedList.length,
    isSaved,
    toggleSave,
    saveMovie: saveMovieToStorage,
    removeMovie: removeMovieFromStorage,
    clearAll: clearAllSavedMovies,
  };
};

export default useSavedMovies;
