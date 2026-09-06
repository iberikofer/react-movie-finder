import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'movie_finder_saved_movies';

export const getSavedMovies = () => {
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

export const saveMovieToStorage = movie => {
  if (!movie || !movie.id) return false;
  try {
    const current = getSavedMovies();
    const exists = current.some(m => String(m.id) === String(movie.id));
    if (exists) return false;

    const compactMovie = {
      id: movie.id,
      title: movie.title || movie.name || '',
      name: movie.name || movie.title || '',
      poster_path: movie.poster_path || '',
      media_type: movie.media_type || (movie.first_air_date ? 'tv' : 'movie'),
      vote_average: movie.vote_average || 0,
      release_date: movie.release_date || movie.first_air_date || '',
      first_air_date: movie.first_air_date || movie.release_date || '',
      age_rating: movie.age_rating || null,
      savedAt: Date.now(),
    };

    const updated = [compactMovie, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    window.dispatchEvent(
      new CustomEvent('saved_movies_updated', {
        detail: { movieId: movie.id, isSaved: true },
      })
    );
    return true;
  } catch (error) {
    console.error('Failed to save movie to localStorage:', error);
    return false;
  }
};

export const removeMovieFromStorage = movieId => {
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

export const clearAllSavedMovies = () => {
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

export const isMovieSavedInStorage = movieId => {
  if (!movieId) return false;
  const current = getSavedMovies();
  return current.some(m => String(m.id) === String(movieId));
};

export const useSavedMovies = () => {
  const [savedList, setSavedList] = useState(getSavedMovies);

  const reload = useCallback(() => {
    setSavedList(getSavedMovies());
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      reload();
    };

    const handleStorage = event => {
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

  const toggleSave = useCallback(movie => {
    if (!movie || !movie.id) return false;
    const isCurrentlySaved = isMovieSavedInStorage(movie.id);
    if (isCurrentlySaved) {
      removeMovieFromStorage(movie.id);
      return false;
    }
    saveMovieToStorage(movie);
    return true;
  }, []);

  const isSaved = useCallback(movieId => {
    if (!movieId) return false;
    return savedList.some(m => String(m.id) === String(movieId));
  }, [savedList]);

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
