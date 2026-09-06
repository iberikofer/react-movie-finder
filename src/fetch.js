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

export const searchMedia = async (queryText, page = 1, type = 'all') => {
  const enc = encodeURIComponent(queryText.trim());
  if (type === 'tv') {
    const data = await request(`/search/tv?query=${enc}&include_adult=false&language=en-US&page=${page}`);
    const results = (data?.results || []).map(item => ({ ...item, media_type: 'tv' }));
    return { ...data, results };
  }
  if (type === 'movie') {
    const data = await request(`/search/movie?query=${enc}&include_adult=false&language=en-US&page=${page}`);
    const results = (data?.results || []).map(item => ({ ...item, media_type: 'movie' }));
    return { ...data, results };
  }
  const data = await request(`/search/multi?query=${enc}&include_adult=false&language=en-US&page=${page}`);
  const results = (data?.results || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv');
  return { ...data, results };
};

export const getTrendingMovies = (page = 1) => {
  return request(`/trending/all/day?language=en-US&page=${page}`);
};

export const getAllGenres = async () => {
  const STORAGE_KEY = 'tmdb_all_genres';
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
    const [movieData, tvData] = await Promise.all([
      request('/genre/movie/list?language=en-US').catch(() => ({ genres: [] })),
      request('/genre/tv/list?language=en-US').catch(() => ({ genres: [] })),
    ]);
    const map = new Map();
    (movieData.genres || []).forEach(g => map.set(g.id, g));
    (tvData.genres || []).forEach(g => {
      if (!map.has(g.id)) map.set(g.id, g);
    });
    const combined = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    if (combined.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
      } catch (err) {
        // LocalStorage write error fallback
      }
    }
    return combined;
  } catch (error) {
    console.error('Failed to load all genres:', error);
    return [];
  }
};

export const getMovieGenres = async () => {
  return getAllGenres();
};

export const discoverMedia = async ({
  type = 'all',
  genreIds = [],
  age = 'all',
  sortBy = 'popularity.desc',
  page = 1,
} = {}) => {
  const genreParam = Array.isArray(genreIds) && genreIds.length > 0 ? genreIds.join(',') : '';

  const ageArray = Array.isArray(age)
    ? age
    : typeof age === 'string' && age !== 'all'
    ? age.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const movieCertMap = {
    '0+': 'G',
    '6+': 'PG',
    '12+': 'PG-13',
    '16+': 'R',
    '18+': 'NC-17',
  };

  const tvCertMap = {
    '0+': 'TV-Y',
    '6+': 'TV-PG',
    '12+': 'TV-14',
    '16+': 'TV-MA',
    '18+': 'TV-MA',
  };

  const movieCerts = ageArray.map(a => movieCertMap[a]).filter(Boolean);
  const tvCerts = Array.from(new Set(ageArray.map(a => tvCertMap[a]).filter(Boolean)));

  const fetchMovieDiscover = (p = page) => {
    let url = `/discover/movie?sort_by=${sortBy}&page=${p}&language=en-US`;
    if (sortBy === 'vote_average.desc') {
      url += '&vote_count.gte=250';
    }
    if (genreParam) url += `&with_genres=${genreParam}`;
    if (movieCerts.length > 0) {
      url += `&certification_country=US&certification=${movieCerts.join('|')}`;
    }
    return request(url);
  };

  const fetchTvDiscover = (p = page) => {
    let tvSort = sortBy;
    if (sortBy === 'primary_release_date.desc') tvSort = 'first_air_date.desc';
    let url = `/discover/tv?sort_by=${tvSort}&page=${p}&language=en-US`;
    if (sortBy === 'vote_average.desc') {
      url += '&vote_count.gte=100';
    }
    if (genreParam) url += `&with_genres=${genreParam}`;
    if (tvCerts.length > 0) {
      url += `&certification_country=US&certification=${tvCerts.join('|')}`;
    }
    return request(url);
  };

  if (type === 'tv') {
    const data = await fetchTvDiscover();
    const results = (data?.results || []).map(item => ({ ...item, media_type: 'tv' }));
    return { ...data, results };
  }

  if (type === 'movie') {
    const data = await fetchMovieDiscover();
    const results = (data?.results || []).map(item => ({ ...item, media_type: 'movie' }));
    return { ...data, results };
  }

  // type === 'all'
  try {
    const [movieData, tvData] = await Promise.all([
      fetchMovieDiscover().catch(() => ({ results: [], total_pages: 1 })),
      fetchTvDiscover().catch(() => ({ results: [], total_pages: 1 })),
    ]);
    const taggedMovies = (movieData?.results || []).map(m => ({ ...m, media_type: 'movie' }));
    const taggedTv = (tvData?.results || []).map(t => ({ ...t, media_type: 'tv' }));

    const combined = [];
    const maxLen = Math.max(taggedMovies.length, taggedTv.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < taggedMovies.length) combined.push(taggedMovies[i]);
      if (i < taggedTv.length) combined.push(taggedTv[i]);
    }
    const totalPages = Math.max(movieData?.total_pages || 1, tvData?.total_pages || 1);
    return {
      page,
      results: combined,
      total_pages: totalPages,
    };
  } catch (err) {
    console.error('Failed to discover media:', err);
    return { page: 1, results: [], total_pages: 1 };
  }
};

export const getMoviesByGenre = (genreIds, page = 1) => {
  return discoverMedia({ genreIds, page, type: 'all' });
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

export const extractAgeRating = (data, isTv) => {
  if (!data) return null;
  if (data.adult) return 'EU: 18+ | US: Adult';

  let euRating = null;
  let usRating = null;
  const euCountries = ['UA', 'DE', 'FR', 'PL', 'NL', 'IT', 'ES', 'GB', 'DK', 'NO', 'FI', 'SE'];

  const formatEuRating = raw => {
    if (!raw) return null;
    const str = String(raw).trim();
    if (!str) return null;
    if (/^\d+$/.test(str)) return `${str}+`;
    if (/^\d+\+$/.test(str)) return str;
    const kMatch = str.match(/^K-?(\d+)$/i);
    if (kMatch) return `${kMatch[1]}+`;
    if (/^\d+[A-Za-z]$/.test(str)) return str;
    if (['U', 'TP', 'AL', 'APTA', 'T'].includes(str.toUpperCase())) return '0+';
    return str;
  };

  if (isTv) {
    const results = data.content_ratings?.results || [];
    const usEntry = results.find(r => r.iso_3166_1 === 'US');
    if (usEntry && usEntry.rating && usEntry.rating.trim()) {
      usRating = usEntry.rating.trim();
    }

    for (const c of euCountries) {
      const entry = results.find(r => r.iso_3166_1 === c);
      if (entry && entry.rating && entry.rating.trim()) {
        const formatted = formatEuRating(entry.rating);
        if (formatted) {
          euRating = formatted;
          break;
        }
      }
    }
  } else {
    const results = data.release_dates?.results || [];
    const usEntry = results.find(r => r.iso_3166_1 === 'US');
    if (usEntry && usEntry.release_dates) {
      const cert = usEntry.release_dates
        .map(d => d.certification?.trim())
        .find(Boolean);
      if (cert) usRating = cert;
    }

    for (const c of euCountries) {
      const entry = results.find(r => r.iso_3166_1 === c);
      if (entry && entry.release_dates) {
        const cert = entry.release_dates
          .map(d => d.certification?.trim())
          .find(Boolean);
        if (cert) {
          const formatted = formatEuRating(cert);
          if (formatted) {
            euRating = formatted;
            break;
          }
        }
      }
    }
  }

  // Derive equivalent EU rating if only US is available
  if (usRating && !euRating) {
    const upperUs = usRating.toUpperCase();
    if (['G', 'TV-Y', 'TV-G'].includes(upperUs)) euRating = '0+';
    else if (['PG', 'TV-PG'].includes(upperUs)) euRating = '6+';
    else if (['PG-13', 'TV-14'].includes(upperUs)) euRating = '12+';
    else if (['R', 'TV-MA', 'NC-17'].includes(upperUs)) euRating = '16+';
  }

  // Derive equivalent US rating if only EU is available
  if (euRating && !usRating) {
    if (euRating === '0+') usRating = isTv ? 'TV-G' : 'G';
    else if (['6+', '7+'].includes(euRating)) usRating = isTv ? 'TV-PG' : 'PG';
    else if (['12+', '13+', '14+', '15+'].includes(euRating)) usRating = isTv ? 'TV-14' : 'PG-13';
    else if (['16+', '18+'].includes(euRating)) usRating = isTv ? 'TV-MA' : 'R';
  }

  if (euRating && usRating) return `EU: ${euRating} | US: ${usRating}`;
  if (euRating) return `EU: ${euRating}`;
  if (usRating) return `US: ${usRating}`;
  return null;
};

export const getTmdbWatchLink = (data, isTv) => {
  if (!data) return '';
  const providers = data['watch/providers']?.results || {};

  try {
    const lang = typeof navigator !== 'undefined' ? navigator.language || '' : '';
    const country = lang.split('-')[1]?.toUpperCase();
    if (country && providers[country]?.link) {
      return providers[country].link;
    }
  } catch {
    // Ignore browser navigator error
  }

  if (providers.UA?.link) return providers.UA.link;
  if (providers.US?.link) return providers.US.link;
  if (providers.GB?.link) return providers.GB.link;
  const firstKey = Object.keys(providers)[0];
  if (firstKey && providers[firstKey]?.link) {
    return providers[firstKey].link;
  }

  const type = isTv || data.media_type === 'tv' ? 'tv' : 'movie';
  return `https://www.themoviedb.org/${type}/${data.id}`;
};

const imdbCache = new Map();

export const getImdbData = async imdbId => {
  if (!imdbId) return null;
  const cleanId = String(imdbId).trim();
  if (!cleanId) return null;

  if (imdbCache.has(cleanId)) {
    return imdbCache.get(cleanId);
  }

  try {
    const res = await fetch(`https://www.omdbapi.com/?i=${cleanId}&apikey=trilogy`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.Response === 'True') {
      const parsed = {
        rating: data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : null,
        votes: data.imdbVotes && data.imdbVotes !== 'N/A' ? data.imdbVotes : null,
        rated: data.Rated && data.Rated !== 'N/A' ? data.Rated : null,
      };
      imdbCache.set(cleanId, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn('Could not retrieve IMDb data:', err);
  }
  return null;
};

export const getMovieDetails = async (movieId, explicitType) => {
  const resolvedType = explicitType || mediaTypeCache.get(String(movieId));

  if (resolvedType === 'tv') {
    const tvData = await request(
      `/tv/${movieId}?language=en-US&append_to_response=content_ratings,external_ids,watch/providers`
    );
    mediaTypeCache.set(String(movieId), 'tv');
    return {
      ...tvData,
      media_type: 'tv',
      title: tvData.name || tvData.original_name,
      release_date: tvData.first_air_date,
      imdb_id: tvData.imdb_id || tvData.external_ids?.imdb_id || null,
      age_rating: extractAgeRating(tvData, true),
      tmdb_watch_link: getTmdbWatchLink(tvData, true),
    };
  }

  if (resolvedType === 'movie') {
    const movieData = await request(
      `/movie/${movieId}?language=en-US&append_to_response=release_dates,external_ids,watch/providers`
    );
    mediaTypeCache.set(String(movieId), 'movie');
    return {
      ...movieData,
      media_type: 'movie',
      title: movieData.title || movieData.original_title,
      imdb_id: movieData.imdb_id || movieData.external_ids?.imdb_id || null,
      age_rating: extractAgeRating(movieData, false),
      tmdb_watch_link: getTmdbWatchLink(movieData, false),
    };
  }

  // If type is unknown, query both movie and tv in parallel to resolve TMDB ID collisions
  const [movieRes, tvRes] = await Promise.allSettled([
    request(`/movie/${movieId}?language=en-US&append_to_response=release_dates,external_ids,watch/providers`),
    request(`/tv/${movieId}?language=en-US&append_to_response=content_ratings,external_ids,watch/providers`),
  ]);

  const movieData = movieRes.status === 'fulfilled' ? movieRes.value : null;
  const tvData = tvRes.status === 'fulfilled' ? tvRes.value : null;

  if (movieData && !tvData) {
    mediaTypeCache.set(String(movieId), 'movie');
    return {
      ...movieData,
      media_type: 'movie',
      title: movieData.title || movieData.original_title,
      imdb_id: movieData.imdb_id || movieData.external_ids?.imdb_id || null,
      age_rating: extractAgeRating(movieData, false),
      tmdb_watch_link: getTmdbWatchLink(movieData, false),
    };
  }

  if (tvData && !movieData) {
    mediaTypeCache.set(String(movieId), 'tv');
    return {
      ...tvData,
      media_type: 'tv',
      title: tvData.name || tvData.original_name,
      release_date: tvData.first_air_date,
      imdb_id: tvData.imdb_id || tvData.external_ids?.imdb_id || null,
      age_rating: extractAgeRating(tvData, true),
      tmdb_watch_link: getTmdbWatchLink(tvData, true),
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
        imdb_id: tvData.imdb_id || tvData.external_ids?.imdb_id || null,
        age_rating: extractAgeRating(tvData, true),
        tmdb_watch_link: getTmdbWatchLink(tvData, true),
      };
    }

    mediaTypeCache.set(String(movieId), 'movie');
    return {
      ...movieData,
      media_type: 'movie',
      title: movieData.title || movieData.original_title,
      imdb_id: movieData.imdb_id || movieData.external_ids?.imdb_id || null,
      age_rating: extractAgeRating(movieData, false),
      tmdb_watch_link: getTmdbWatchLink(movieData, false),
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


