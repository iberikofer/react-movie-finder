import {
  Genre,
  MediaItem,
  MovieDetails,
  CastMember,
  Review,
  VideoTrailer,
  MediaImages,
  TMDBResponse,
  DiscoverParams,
  MediaTypeFilter,
} from 'types';
import { getActiveLangParam } from './context/LanguageContext';

const BASE_URL = 'https://api.themoviedb.org/3';
const DEFAULT_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyZWU3MDU4M2UzZTJjYzBmY2I4NjViMjQ0NTE1YWQ1MSIsInN1YiI6IjY0OTg2N2Y1OTU1YzY1MDBjN2FlZjJkYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.spmomChu1pxtxgfJXLkIEdZqVnZerBWxKn52_1eEjwg';

const rawRequest = async <T = any>(endpoint: string): Promise<T> => {
  const token = process.env.REACT_APP_TMDB_TOKEN || DEFAULT_TOKEN;
  const options: RequestInit = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
};

const request = async <T = any>(endpoint: string): Promise<T> => {
  const token = process.env.REACT_APP_TMDB_TOKEN || DEFAULT_TOKEN;
  const options: RequestInit = {
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
  return response.json() as Promise<T>;
};

export const getMovies = (queryText: string, page: number = 1): Promise<TMDBResponse<MediaItem>> => {
  const lang = getActiveLangParam();
  return request<TMDBResponse<MediaItem>>(
    `/search/movie?query=${encodeURIComponent(queryText)}&include_adult=false&language=${lang}&page=${page}`
  );
};

export const searchMedia = async (
  queryText: string,
  page: number = 1,
  type: MediaTypeFilter | string = 'all'
): Promise<TMDBResponse<MediaItem>> => {
  const enc = encodeURIComponent(queryText.trim());
  const lang = getActiveLangParam();
  if (type === 'tv') {
    const data = await request<TMDBResponse<MediaItem>>(
      `/search/tv?query=${enc}&include_adult=false&language=${lang}&page=${page}`
    );
    const results = (data?.results || []).map(item => ({ ...item, media_type: 'tv' as const }));
    return { ...data, results };
  }
  if (type === 'movie') {
    const data = await request<TMDBResponse<MediaItem>>(
      `/search/movie?query=${enc}&include_adult=false&language=${lang}&page=${page}`
    );
    const results = (data?.results || []).map(item => ({ ...item, media_type: 'movie' as const }));
    return { ...data, results };
  }
  const data = await request<TMDBResponse<MediaItem>>(
    `/search/multi?query=${enc}&include_adult=false&language=${lang}&page=${page}`
  );
  const results = (data?.results || []).filter(
    item => item.media_type === 'movie' || item.media_type === 'tv'
  );
  return { ...data, results };
};

export const getTrendingMovies = (page: number = 1): Promise<TMDBResponse<MediaItem>> => {
  const lang = getActiveLangParam();
  return request<TMDBResponse<MediaItem>>(`/trending/all/day?language=${lang}&page=${page}`);
};

export const getAllGenres = async (): Promise<Genre[]> => {
  const lang = getActiveLangParam();
  const STORAGE_KEY = `tmdb_all_genres_${lang}`;
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
      request<{ genres?: Genre[] }>(`/genre/movie/list?language=${lang}`).catch(() => ({ genres: [] })),
      request<{ genres?: Genre[] }>(`/genre/tv/list?language=${lang}`).catch(() => ({ genres: [] })),
    ]);
    const map = new Map<number, Genre>();
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

export const getMovieGenres = async (): Promise<Genre[]> => {
  return getAllGenres();
};

export const isAlphabeticalTitle = (title?: string): boolean => {
  if (!title) return false;
  const trimmed = title.trim();
  if (!trimmed) return false;
  return /^\p{L}/u.test(trimmed);
};

export const startsWithLetterOrNumber = (title?: string): boolean => {
  return isAlphabeticalTitle(title);
};

const aStartPageCache = new Map<string, number>();

export const getAlphabeticalStartPage = async (
  endpoint: 'discover/movie' | 'discover/tv',
  genreParam?: string,
  certParam?: string
): Promise<number> => {
  const lang = getActiveLangParam();
  const cacheKey = `${endpoint}|${genreParam || ''}|${certParam || ''}|${lang}`;
  if (aStartPageCache.has(cacheKey)) {
    return aStartPageCache.get(cacheKey)!;
  }

  let low = 1;
  let high = 55;
  let start = 1;
  const sortParam = endpoint === 'discover/tv' ? 'original_name.asc' : 'original_title.asc';
  let query = `sort_by=${sortParam}&vote_count.gte=20&language=${lang}`;
  if (genreParam) query += `&with_genres=${genreParam}`;
  if (certParam) query += `&certification_country=US&certification=${certParam}`;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    try {
      const data = await rawRequest<TMDBResponse<MediaItem>>(`/${endpoint}?${query}&page=${mid}`);
      if (!data?.results || data.results.length === 0) {
        high = mid - 1;
        continue;
      }
      const firstItem = data.results[0];
      const title = (firstItem.original_title || firstItem.original_name || firstItem.title || firstItem.name || '').trim();
      const clean = title.replace(/^[^a-zA-Z0-9]+/, '');
      const char = clean.charAt(0).toUpperCase();
      if (char >= 'A' && char <= 'Z') {
        start = mid;
        high = mid - 1;
      } else if (char < 'A' || !char) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    } catch {
      break;
    }
  }

  aStartPageCache.set(cacheKey, start);
  return start;
};

export const discoverMedia = async ({
  type = 'all',
  genreIds = [],
  age = 'all',
  sortBy = 'popularity.desc',
  page = 1,
}: DiscoverParams = {}): Promise<TMDBResponse<MediaItem>> => {
  const genreParam = Array.isArray(genreIds) && genreIds.length > 0 ? genreIds.join(',') : '';

  const ageArray = Array.isArray(age)
    ? age
    : age === 'all'
    ? []
    : age.split(',').map(s => s.trim()).filter(Boolean);

  const movieCertMap: Record<string, string> = {
    '0+': 'G',
    '6+': 'PG',
    '12+': 'PG-13',
    '16+': 'R|NC-17',
    '18+': 'R|NC-17',
  };

  const tvCertMap: Record<string, string> = {
    '0+': 'TV-Y|TV-G',
    '6+': 'TV-PG',
    '12+': 'TV-14',
    '16+': 'TV-MA',
    '18+': 'TV-MA',
  };

  const movieCerts = ageArray
    .map(a => movieCertMap[a])
    .filter(Boolean)
    .flatMap(c => c.split('|'));
  const uniqueMovieCerts = Array.from(new Set(movieCerts));
  const tvCerts = Array.from(new Set(ageArray.map(a => tvCertMap[a]).filter(Boolean).flatMap(c => c.split('|'))));

  const lang = getActiveLangParam();

  let movieOffset = 1;
  let tvOffset = 1;

  if (sortBy === 'original_title.asc') {
    if (type === 'movie' || type === 'all') {
      movieOffset = await getAlphabeticalStartPage(
        'discover/movie',
        genreParam,
        uniqueMovieCerts.join('|')
      );
    }
    if (type === 'tv' || type === 'all') {
      tvOffset = await getAlphabeticalStartPage(
        'discover/tv',
        genreParam,
        tvCerts.join('|')
      );
    }
  }

  const fetchMovieDiscover = (p: number = page): Promise<TMDBResponse<MediaItem>> => {
    const actualPage = sortBy === 'original_title.asc' ? movieOffset + (p - 1) : p;
    let url = `/discover/movie?sort_by=${sortBy}&page=${actualPage}&language=${lang}`;
    if (sortBy === 'vote_average.desc') {
      url += '&vote_count.gte=100';
    }
    if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
      url += '&vote_count.gte=20';
    }
    if (genreParam) url += `&with_genres=${genreParam}`;
    if (uniqueMovieCerts.length > 0) {
      url += `&certification_country=US&certification=${uniqueMovieCerts.join('|')}`;
    }
    return request<TMDBResponse<MediaItem>>(url);
  };

  const fetchTvDiscover = (p: number = page): Promise<TMDBResponse<MediaItem>> => {
    let tvSort = sortBy;
    if (sortBy === 'primary_release_date.desc') tvSort = 'first_air_date.desc';
    if (sortBy === 'original_title.asc') tvSort = 'original_name.asc';
    if (sortBy === 'original_title.desc') tvSort = 'original_name.desc';
    const actualPage = sortBy === 'original_title.asc' ? tvOffset + (p - 1) : p;
    let url = `/discover/tv?sort_by=${tvSort}&page=${actualPage}&language=${lang}`;
    if (sortBy === 'vote_average.desc') {
      url += '&vote_count.gte=50';
    }
    if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
      url += '&vote_count.gte=20';
    }
    if (genreParam) url += `&with_genres=${genreParam}`;
    if (tvCerts.length > 0) {
      url += `&certification_country=US&certification=${tvCerts.join('|')}`;
    }
    return request<TMDBResponse<MediaItem>>(url);
  };

  if (type === 'tv') {
    const data = await fetchTvDiscover();
    let results = (data?.results || []).map(item => ({ ...item, media_type: 'tv' as const }));
    if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
      results = results.filter(item => isAlphabeticalTitle(item.name || item.title));
    }
    const totalPages = sortBy === 'original_title.asc'
      ? Math.max(1, (data?.total_pages || 1) - tvOffset + 1)
      : (data?.total_pages || 1);
    return { ...data, results, total_pages: totalPages };
  }

  if (type === 'movie') {
    const data = await fetchMovieDiscover();
    let results = (data?.results || []).map(item => ({ ...item, media_type: 'movie' as const }));
    if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
      results = results.filter(item => isAlphabeticalTitle(item.title || item.name));
    }
    const totalPages = sortBy === 'original_title.asc'
      ? Math.max(1, (data?.total_pages || 1) - movieOffset + 1)
      : (data?.total_pages || 1);
    return { ...data, results, total_pages: totalPages };
  }

  // type === 'all'
  try {
    const [movieData, tvData] = await Promise.all([
      fetchMovieDiscover().catch(() => ({ results: [], total_pages: 1, page: 1, total_results: 0 })),
      fetchTvDiscover().catch(() => ({ results: [], total_pages: 1, page: 1, total_results: 0 })),
    ]);
    const taggedMovies = (movieData?.results || []).map(m => ({ ...m, media_type: 'movie' as const }));
    const taggedTv = (tvData?.results || []).map(t => ({ ...t, media_type: 'tv' as const }));

    let combined = [...taggedMovies, ...taggedTv];
    if (sortBy === 'original_title.asc' || sortBy === 'original_title.desc') {
      combined = combined.filter(item => isAlphabeticalTitle(item.title || item.name));
    }

    if (sortBy === 'vote_average.desc') {
      combined.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else if (sortBy === 'primary_release_date.desc') {
      combined.sort((a, b) => {
        const dateA = a.release_date || a.first_air_date || '';
        const dateB = b.release_date || b.first_air_date || '';
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.localeCompare(dateA);
      });
    } else if (sortBy === 'original_title.asc') {
      combined.sort((a, b) => {
        const nameA = (a.title || a.name || '').trim();
        const nameB = (b.title || b.name || '').trim();
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      });
    } else if (sortBy === 'original_title.desc') {
      combined.sort((a, b) => {
        const nameA = (a.title || a.name || '').trim();
        const nameB = (b.title || b.name || '').trim();
        return nameB.localeCompare(nameA, undefined, { sensitivity: 'base' });
      });
    } else {
      // Default: popularity.desc
      combined.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    const movieTotalPages = sortBy === 'original_title.asc'
      ? Math.max(1, (movieData?.total_pages || 1) - movieOffset + 1)
      : (movieData?.total_pages || 1);
    const tvTotalPages = sortBy === 'original_title.asc'
      ? Math.max(1, (tvData?.total_pages || 1) - tvOffset + 1)
      : (tvData?.total_pages || 1);
    const totalPages = Math.max(movieTotalPages, tvTotalPages);

    return {
      page,
      results: combined,
      total_pages: totalPages,
      total_results: (movieData?.total_results || 0) + (tvData?.total_results || 0),
    };
  } catch (err) {
    console.error('Failed to discover media:', err);
    return { page: 1, results: [], total_pages: 1, total_results: 0 };
  }
};

export const getMoviesByGenre = (
  genreIds: number[],
  page: number = 1
): Promise<TMDBResponse<MediaItem>> => {
  return discoverMedia({ genreIds, page, type: 'all' });
};

// Cache to remember whether an ID is a movie or TV show so that sub-requests use the correct endpoint
const mediaTypeCache = new Map<string, 'movie' | 'tv'>();

export const setMediaType = (id: string | number, type?: 'movie' | 'tv' | string): void => {
  if (id && (type === 'movie' || type === 'tv')) {
    mediaTypeCache.set(String(id), type);
  }
};

export const getMediaType = (id: string | number): 'movie' | 'tv' | undefined => {
  return mediaTypeCache.get(String(id));
};

export const extractAgeRating = (data: any, isTv?: boolean): string | null => {
  if (!data) return null;
  if (data.adult) return 'EU: 18+ | US: Adult';

  let euRating: string | null = null;
  let usRating: string | null = null;
  const euCountries = ['UA', 'DE', 'FR', 'PL', 'NL', 'IT', 'ES', 'GB', 'DK', 'NO', 'FI', 'SE'];

  const formatEuRating = (raw: any): string | null => {
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
    const results: any[] = data.content_ratings?.results || [];
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
    const results: any[] = data.release_dates?.results || [];
    const usEntry = results.find(r => r.iso_3166_1 === 'US');
    if (usEntry && usEntry.release_dates) {
      const cert = (usEntry.release_dates as any[])
        .map(d => d.certification?.trim())
        .find(Boolean);
      if (cert) usRating = cert;
    }

    for (const c of euCountries) {
      const entry = results.find(r => r.iso_3166_1 === c);
      if (entry && entry.release_dates) {
        const cert = (entry.release_dates as any[])
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

export const getTmdbWatchLink = (data: any, isTv?: boolean): string => {
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

export interface ImdbData {
  rating: string | null;
  votes: string | null;
  rated: string | null;
}

const imdbCache = new Map<string, ImdbData>();

export const getImdbData = async (imdbId?: string | null): Promise<ImdbData | null> => {
  if (!imdbId) return null;
  const cleanId = String(imdbId).trim();
  if (!cleanId) return null;

  if (imdbCache.has(cleanId)) {
    return imdbCache.get(cleanId) || null;
  }

  try {
    const res = await fetch(`https://www.omdbapi.com/?i=${cleanId}&apikey=trilogy`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.Response === 'True') {
      const parsed: ImdbData = {
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

export const getMovieDetails = async (
  movieId: string | number,
  explicitType?: 'movie' | 'tv'
): Promise<MovieDetails> => {
  const resolvedType = explicitType || mediaTypeCache.get(String(movieId));
  const lang = getActiveLangParam();

  if (resolvedType === 'tv') {
    const tvData = await request<any>(
      `/tv/${movieId}?language=${lang}&append_to_response=content_ratings,external_ids,watch/providers`
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
    const movieData = await request<any>(
      `/movie/${movieId}?language=${lang}&append_to_response=release_dates,external_ids,watch/providers`
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

  // If type is unknown, query both movie and tv in parallel
  const [movieRes, tvRes] = await Promise.allSettled([
    request<any>(
      `/movie/${movieId}?language=${lang}&append_to_response=release_dates,external_ids,watch/providers`
    ),
    request<any>(
      `/tv/${movieId}?language=${lang}&append_to_response=content_ratings,external_ids,watch/providers`
    ),
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
    const movieHasPoster = !!movieData.poster_path;
    const tvHasPoster = !!tvData.poster_path;
    const moviePop = movieData.popularity || 0;
    const tvPop = tvData.popularity || 0;

    const pickTv = (!movieHasPoster && tvHasPoster) || (tvPop > moviePop * 2 && tvHasPoster);

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

export const fetchMovieDetails = getMovieDetails;

export const getMovieCredits = async (
  movieId: string | number,
  explicitType?: 'movie' | 'tv'
): Promise<{ id: number; cast: CastMember[]; crew?: any[] }> => {
  const type = explicitType || mediaTypeCache.get(String(movieId));
  const lang = getActiveLangParam();
  const primary =
    type === 'tv' ? `/tv/${movieId}/credits?language=${lang}` : `/movie/${movieId}/credits?language=${lang}`;
  const fallback =
    type === 'tv' ? `/movie/${movieId}/credits?language=${lang}` : `/tv/${movieId}/credits?language=${lang}`;

  try {
    return await request<{ id: number; cast: CastMember[]; crew?: any[] }>(primary);
  } catch (movieErr) {
    try {
      return await request<{ id: number; cast: CastMember[]; crew?: any[] }>(fallback);
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

export const getMovieReviews = async (
  movieId: string | number,
  explicitType?: 'movie' | 'tv'
): Promise<TMDBResponse<Review>> => {
  const type = explicitType || mediaTypeCache.get(String(movieId));
  const lang = getActiveLangParam();
  const primary =
    type === 'tv'
      ? `/tv/${movieId}/reviews?language=${lang}&page=1`
      : `/movie/${movieId}/reviews?language=${lang}&page=1`;
  const fallback =
    type === 'tv'
      ? `/movie/${movieId}/reviews?language=${lang}&page=1`
      : `/tv/${movieId}/reviews?language=${lang}&page=1`;

  try {
    const res = await request<TMDBResponse<Review>>(primary);
    if ((!res.results || res.results.length === 0) && lang !== 'en-US') {
      const enRes = await request<TMDBResponse<Review>>(
        type === 'tv' ? `/tv/${movieId}/reviews?language=en-US&page=1` : `/movie/${movieId}/reviews?language=en-US&page=1`
      ).catch(() => null);
      if (enRes && enRes.results && enRes.results.length > 0) return enRes;
    }
    return res;
  } catch (movieErr) {
    try {
      const res = await request<TMDBResponse<Review>>(fallback);
      if ((!res.results || res.results.length === 0) && lang !== 'en-US') {
        const enRes = await request<TMDBResponse<Review>>(
          type === 'tv' ? `/tv/${movieId}/reviews?language=en-US&page=1` : `/movie/${movieId}/reviews?language=en-US&page=1`
        ).catch(() => null);
        if (enRes && enRes.results && enRes.results.length > 0) return enRes;
      }
      return res;
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

export const getMovieVideos = async (
  movieId: string | number,
  explicitType?: 'movie' | 'tv'
): Promise<{ id: number; results: VideoTrailer[] }> => {
  const type = explicitType || mediaTypeCache.get(String(movieId));
  const lang = getActiveLangParam();
  const langShort = lang.startsWith('uk') ? 'uk' : 'en';
  const query = `language=${lang}&include_video_language=${langShort},en`;
  const primary =
    type === 'tv' ? `/tv/${movieId}/videos?${query}` : `/movie/${movieId}/videos?${query}`;
  const fallback =
    type === 'tv' ? `/movie/${movieId}/videos?${query}` : `/tv/${movieId}/videos?${query}`;

  try {
    const data = await request<{ id: number; results: VideoTrailer[] }>(primary);
    if (data.results && data.results.length > 0) return data;
    return await request<{ id: number; results: VideoTrailer[] }>(
      type === 'tv' ? `/tv/${movieId}/videos` : `/movie/${movieId}/videos`
    );
  } catch (movieErr) {
    try {
      const data = await request<{ id: number; results: VideoTrailer[] }>(fallback);
      if (data.results && data.results.length > 0) return data;
      return await request<{ id: number; results: VideoTrailer[] }>(
        type === 'tv' ? `/movie/${movieId}/videos` : `/tv/${movieId}/videos`
      );
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

export const getSimilarMovies = async (
  movieId: string | number,
  explicitType?: 'movie' | 'tv'
): Promise<TMDBResponse<MediaItem>> => {
  const type = explicitType || mediaTypeCache.get(String(movieId));
  const lang = getActiveLangParam();
  const normalizeResults = (data: any): TMDBResponse<MediaItem> => ({
    ...data,
    results: (data.results || []).map((item: any) => ({
      ...item,
      media_type: item.media_type || type || (item.title ? 'movie' : 'tv'),
      title: item.title || item.name || item.original_title || item.original_name,
      release_date: item.release_date || item.first_air_date,
    })),
  });

  const base = type === 'tv' ? `/tv/${movieId}` : `/movie/${movieId}`;
  const fallbackBase = type === 'tv' ? `/movie/${movieId}` : `/tv/${movieId}`;

  try {
    const recData = await request<any>(`${base}/recommendations?language=${lang}&page=1`);
    if (recData.results && recData.results.length > 0) {
      return normalizeResults(recData);
    }
    const simData = await request<any>(`${base}/similar?language=${lang}&page=1`);
    return normalizeResults(simData);
  } catch (primaryErr) {
    try {
      const recData = await request<any>(`${fallbackBase}/recommendations?language=${lang}&page=1`);
      if (recData.results && recData.results.length > 0) {
        return normalizeResults(recData);
      }
      const simData = await request<any>(`${fallbackBase}/similar?language=${lang}&page=1`);
      return normalizeResults(simData);
    } catch (fallbackErr) {
      throw primaryErr;
    }
  }
};

export const getMovieWatchProviders = async (
  movieId: string | number,
  explicitType?: 'movie' | 'tv'
): Promise<any> => {
  const type = explicitType || mediaTypeCache.get(String(movieId));
  const primary =
    type === 'tv' ? `/tv/${movieId}/watch/providers` : `/movie/${movieId}/watch/providers`;
  const fallback =
    type === 'tv' ? `/movie/${movieId}/watch/providers` : `/tv/${movieId}/watch/providers`;

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

export const getMovieImages = async (
  movieId: string | number,
  explicitType?: 'movie' | 'tv'
): Promise<MediaImages> => {
  const type = explicitType || mediaTypeCache.get(String(movieId));
  const primary = type === 'tv' ? `/tv/${movieId}/images` : `/movie/${movieId}/images`;
  const fallback = type === 'tv' ? `/movie/${movieId}/images` : `/tv/${movieId}/images`;

  try {
    return await request<MediaImages>(primary);
  } catch (movieErr) {
    try {
      return await request<MediaImages>(fallback);
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

const ageRatingCache = new Map<string, string>();
const inFlightAgeRequests = new Map<string, Promise<string>>();
const AGE_STORAGE_KEY = 'tmdb_card_age_ratings';

export const formatShortAgeRating = (rawRating: any): string => {
  if (!rawRating) return 'N/A';
  const str = String(rawRating).trim();
  if (!str) return 'N/A';

  const plusMatch = str.match(/\b(\d{1,2})\+/);
  if (plusMatch) {
    return `${plusMatch[1]}+`;
  }

  const upper = str.toUpperCase();
  if (/\b(NC-17|ADULT|18)\b/.test(upper)) return '18+';
  if (/\b(R|TV-MA|16)\b/.test(upper)) return '16+';
  if (/\b(15)\b/.test(upper)) return '15+';
  if (/\b(14)\b/.test(upper)) return '14+';
  if (/\b(PG-13|TV-14|13|12)\b/.test(upper)) return '12+';
  if (/\b(TV-PG|PG|6|7)\b/.test(upper)) return '6+';
  if (/\b(TV-Y7)\b/.test(upper)) return '6+';
  if (/\b(TV-Y|TV-G|G|U|0)\b/.test(upper)) return '0+';

  const numMatch = str.match(/\b(\d{1,2})\b/);
  if (numMatch) {
    return `${numMatch[1]}+`;
  }

  return 'N/A';
};

export const mapAgeToCategory = (rawRating: any): string => {
  if (!rawRating) return 'N/A';
  const short = formatShortAgeRating(rawRating);
  if (short === 'N/A') return 'N/A';
  if (short.startsWith('18')) return '18+';
  if (short.startsWith('16') || short.startsWith('15')) return '16+';
  if (short.startsWith('14') || short.startsWith('13') || short.startsWith('12')) {
    return '12+';
  }
  if (short.startsWith('7') || short.startsWith('6')) return '6+';
  if (short.startsWith('0')) return '0+';
  return short;
};

export const matchesAgeFilter = (itemRating: any, filterAge?: string | string[]): boolean => {
  if (!filterAge || filterAge === 'all') return true;
  const targetCategory = mapAgeToCategory(itemRating);
  if (targetCategory === 'N/A') return false;

  const selectedAges = Array.isArray(filterAge)
    ? filterAge
    : filterAge
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

  if (selectedAges.length === 0 || selectedAges.includes('all')) return true;
  return selectedAges.includes(targetCategory);
};

export const getCachedAgeRating = (id: string | number): string | null => {
  if (!id) return null;
  const key = String(id);
  if (ageRatingCache.has(key)) return ageRatingCache.get(key) || null;
  try {
    const raw = sessionStorage.getItem(AGE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[key]) {
        ageRatingCache.set(key, parsed[key]);
        return parsed[key];
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return null;
};

export const setCachedAgeRating = (id: string | number, rating: string): void => {
  if (!id || !rating) return;
  const key = String(id);
  ageRatingCache.set(key, rating);
  try {
    const raw = sessionStorage.getItem(AGE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[key] = rating;
    sessionStorage.setItem(AGE_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage quota error
  }
};

export const getMediaAgeRating = async (
  id: string | number,
  explicitType?: 'movie' | 'tv' | string,
  existingRating?: string
): Promise<string> => {
  if (existingRating) {
    const formatted = formatShortAgeRating(existingRating);
    if (id) setCachedAgeRating(id, formatted);
    return formatted;
  }

  if (!id) return 'N/A';
  const key = String(id);

  const cached = getCachedAgeRating(key);
  if (cached) return cached;

  if (inFlightAgeRequests.has(key)) {
    return inFlightAgeRequests.get(key)!;
  }

  const promise = (async () => {
    try {
      const resolvedType = (explicitType === 'movie' || explicitType === 'tv')
        ? explicitType
        : mediaTypeCache.get(key) || 'movie';
      const isTv = resolvedType === 'tv';

      let fullRating: string | null = null;

      if (isTv) {
        const res = await request<any>(`/tv/${id}/content_ratings`).catch(() => null);
        if (res && Array.isArray(res.results) && res.results.length > 0) {
          fullRating = extractAgeRating({ content_ratings: res }, true);
        }
      } else {
        const res = await request<any>(`/movie/${id}/release_dates`).catch(() => null);
        if (res && Array.isArray(res.results) && res.results.length > 0) {
          fullRating = extractAgeRating({ release_dates: res }, false);
        }
      }

      if (!fullRating && !explicitType) {
        if (isTv) {
          const res = await request<any>(`/movie/${id}/release_dates`).catch(() => null);
          if (res && Array.isArray(res.results) && res.results.length > 0) {
            fullRating = extractAgeRating({ release_dates: res }, false);
          }
        } else {
          const res = await request<any>(`/tv/${id}/content_ratings`).catch(() => null);
          if (res && Array.isArray(res.results) && res.results.length > 0) {
            fullRating = extractAgeRating({ content_ratings: res }, true);
          }
        }
      }

      const shortRating = formatShortAgeRating(fullRating);
      setCachedAgeRating(key, shortRating);
      return shortRating;
    } catch {
      return 'N/A';
    } finally {
      inFlightAgeRequests.delete(key);
    }
  })();

  inFlightAgeRequests.set(key, promise);
  return promise;
};
