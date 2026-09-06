const BASE_URL = 'https://api.themoviedb.org/3';
const DEFAULT_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyZWU3MDU4M2UzZTJjYzBmY2I4NjViMjQ0NTE1YWQ1MSIsInN1YiI6IjY0OTg2N2Y1OTU1YzY1MDBjN2FlZjJkYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.spmomChu1pxtxgfJXLkIEdZqVnZerBWxKn52_1eEjwg';

const request = async endpoint => {
  const token = process.env.REACT_APP_TMDB_TOKEN || DEFAULT_TOKEN;
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  const [response] = await Promise.all([
    fetch(`${BASE_URL}${endpoint}`, options),
    new Promise(resolve => setTimeout(resolve, 500)),
  ]);
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

export const getMovies = (queryText, page = 1) => {
  return request(
    `/search/movie?query=${encodeURIComponent(queryText)}&include_adult=false&language=en-US&page=${page}`
  );
};

export const getTrendingMovies = (page = 1) => {
  return request(`/trending/all/day?language=en-US&page=${page}`);
};

export const getMovieGenres = async () => {
  const STORAGE_KEY = 'tmdb_movie_genres';
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    // LocalStorage read error fallback
  }

  try {
    const data = await request('/genre/movie/list?language=en-US');
    const genres = data.genres || [];
    if (genres.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(genres));
      } catch (err) {
        // LocalStorage write error fallback
      }
    }
    return genres;
  } catch (error) {
    console.error('Failed to load genres:', error);
    return [];
  }
};

export const getMoviesByGenre = (genreIds, page = 1) => {
  const genreParam = Array.isArray(genreIds) ? genreIds.join(',') : genreIds;
  return request(
    `/discover/movie?sort_by=popularity.desc&with_genres=${genreParam}&page=${page}&language=en-US`
  );
};

// Cache to remember whether an ID is a movie or TV show so that sub-requests (credits, reviews, images, etc.) use the correct endpoint
const mediaTypeCache = new Map();

export const setMediaType = (id, type) => {
  if (id && type) {
    mediaTypeCache.set(String(id), type);
  }
};

export const getMediaType = id => {
  return mediaTypeCache.get(String(id));
};

export const getMovieDetails = async (movieId, explicitType) => {
  const resolvedType = explicitType || mediaTypeCache.get(String(movieId));

  if (resolvedType === 'tv') {
    const tvData = await request(`/tv/${movieId}?language=en-US`);
    mediaTypeCache.set(String(movieId), 'tv');
    return {
      ...tvData,
      media_type: 'tv',
      title: tvData.name || tvData.original_name,
      release_date: tvData.first_air_date,
    };
  }

  if (resolvedType === 'movie') {
    const movieData = await request(`/movie/${movieId}?language=en-US`);
    mediaTypeCache.set(String(movieId), 'movie');
    return {
      ...movieData,
      media_type: 'movie',
      title: movieData.title || movieData.original_title,
    };
  }

  // If type is unknown, query both movie and tv in parallel to resolve TMDB ID collisions
  const [movieRes, tvRes] = await Promise.allSettled([
    request(`/movie/${movieId}?language=en-US`),
    request(`/tv/${movieId}?language=en-US`),
  ]);

  const movieData = movieRes.status === 'fulfilled' ? movieRes.value : null;
  const tvData = tvRes.status === 'fulfilled' ? tvRes.value : null;

  if (movieData && !tvData) {
    mediaTypeCache.set(String(movieId), 'movie');
    return {
      ...movieData,
      media_type: 'movie',
      title: movieData.title || movieData.original_title,
    };
  }

  if (tvData && !movieData) {
    mediaTypeCache.set(String(movieId), 'tv');
    return {
      ...tvData,
      media_type: 'tv',
      title: tvData.name || tvData.original_name,
      release_date: tvData.first_air_date,
    };
  }

  if (movieData && tvData) {
    // Both exist (ID collision in TMDB namespaces)
    // Compare popularity and poster existence to pick the item the user intended to see
    const movieHasPoster = !!movieData.poster_path;
    const tvHasPoster = !!tvData.poster_path;
    const moviePop = movieData.popularity || 0;
    const tvPop = tvData.popularity || 0;

    const pickTv =
      (!movieHasPoster && tvHasPoster) ||
      (tvPop > moviePop * 2 && tvHasPoster);

    if (pickTv) {
      mediaTypeCache.set(String(movieId), 'tv');
      return {
        ...tvData,
        media_type: 'tv',
        title: tvData.name || tvData.original_name,
        release_date: tvData.first_air_date,
      };
    }

    mediaTypeCache.set(String(movieId), 'movie');
    return {
      ...movieData,
      media_type: 'movie',
      title: movieData.title || movieData.original_title,
    };
  }

  throw new Error(`Item ${movieId} not found in TMDB`);
};

export const getMovieCredits = async (movieId, explicitType) => {
  const type = explicitType || mediaTypeCache.get(String(movieId));
  const primary =
    type === 'tv'
      ? `/tv/${movieId}/credits?language=en-US`
      : `/movie/${movieId}/credits?language=en-US`;
  const fallback =
    type === 'tv'
      ? `/movie/${movieId}/credits?language=en-US`
      : `/tv/${movieId}/credits?language=en-US`;

  try {
    return await request(primary);
  } catch (movieErr) {
    try {
      return await request(fallback);
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

export const getMovieReviews = async (movieId, explicitType) => {
  const type = explicitType || mediaTypeCache.get(String(movieId));
  const primary =
    type === 'tv'
      ? `/tv/${movieId}/reviews?language=en-US&page=1`
      : `/movie/${movieId}/reviews?language=en-US&page=1`;
  const fallback =
    type === 'tv'
      ? `/movie/${movieId}/reviews?language=en-US&page=1`
      : `/tv/${movieId}/reviews?language=en-US&page=1`;

  try {
    return await request(primary);
  } catch (movieErr) {
    try {
      return await request(fallback);
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

export const getMovieVideos = async (movieId, explicitType) => {
  const type = explicitType || mediaTypeCache.get(String(movieId));
  const primary =
    type === 'tv'
      ? `/tv/${movieId}/videos?language=en-US`
      : `/movie/${movieId}/videos?language=en-US`;
  const fallback =
    type === 'tv'
      ? `/movie/${movieId}/videos?language=en-US`
      : `/tv/${movieId}/videos?language=en-US`;

  try {
    const data = await request(primary);
    if (data.results && data.results.length > 0) return data;
    return await request(type === 'tv' ? `/tv/${movieId}/videos` : `/movie/${movieId}/videos`);
  } catch (movieErr) {
    try {
      const data = await request(fallback);
      if (data.results && data.results.length > 0) return data;
      return await request(type === 'tv' ? `/movie/${movieId}/videos` : `/tv/${movieId}/videos`);
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

export const getSimilarMovies = async (movieId, explicitType) => {
  const type = explicitType || mediaTypeCache.get(String(movieId));
  const normalizeResults = data => ({
    ...data,
    results: (data.results || []).map(item => ({
      ...item,
      media_type: item.media_type || type || (item.title ? 'movie' : 'tv'),
      title: item.title || item.name || item.original_title || item.original_name,
      release_date: item.release_date || item.first_air_date,
    })),
  });

  const base = type === 'tv' ? `/tv/${movieId}` : `/movie/${movieId}`;
  const fallbackBase = type === 'tv' ? `/movie/${movieId}` : `/tv/${movieId}`;

  try {
    const recData = await request(`${base}/recommendations?language=en-US&page=1`);
    if (recData.results && recData.results.length > 0) {
      return normalizeResults(recData);
    }
    const simData = await request(`${base}/similar?language=en-US&page=1`);
    return normalizeResults(simData);
  } catch (primaryErr) {
    try {
      const recData = await request(`${fallbackBase}/recommendations?language=en-US&page=1`);
      if (recData.results && recData.results.length > 0) {
        return normalizeResults(recData);
      }
      const simData = await request(`${fallbackBase}/similar?language=en-US&page=1`);
      return normalizeResults(simData);
    } catch (fallbackErr) {
      throw primaryErr;
    }
  }
};

export const getMovieWatchProviders = async (movieId, explicitType) => {
  const type = explicitType || mediaTypeCache.get(String(movieId));
  const primary = type === 'tv' ? `/tv/${movieId}/watch/providers` : `/movie/${movieId}/watch/providers`;
  const fallback = type === 'tv' ? `/movie/${movieId}/watch/providers` : `/tv/${movieId}/watch/providers`;

  try {
    return await request(primary);
  } catch (movieErr) {
    try {
      return await request(fallback);
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

export const getMovieImages = async (movieId, explicitType) => {
  const type = explicitType || mediaTypeCache.get(String(movieId));
  const primary = type === 'tv' ? `/tv/${movieId}/images` : `/movie/${movieId}/images`;
  const fallback = type === 'tv' ? `/movie/${movieId}/images` : `/tv/${movieId}/images`;

  try {
    return await request(primary);
  } catch (movieErr) {
    try {
      return await request(fallback);
    } catch (tvErr) {
      throw movieErr;
    }
  }
};


