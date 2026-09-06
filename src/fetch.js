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

export const getMovies = queryText => {
  return request(
    `/search/movie?query=${encodeURIComponent(queryText)}&include_adult=false&language=en-US&page=1`
  );
};

export const getTrendingMovies = (page = 1) => {
  return request(`/trending/all/day?language=en-US&page=${page}`);
};

export const getMovieGenres = async () => {
  try {
    const data = await request('/genre/movie/list?language=en-US');
    return data.genres || [];
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

export const getMovieDetails = async movieId => {
  try {
    const movieData = await request(`/movie/${movieId}?language=en-US`);
    return {
      ...movieData,
      title: movieData.title || movieData.original_title,
    };
  } catch (movieErr) {
    try {
      const tvData = await request(`/tv/${movieId}?language=en-US`);
      return {
        ...tvData,
        title: tvData.name || tvData.original_name,
        release_date: tvData.first_air_date,
      };
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

export const getMovieCredits = async movieId => {
  try {
    return await request(`/movie/${movieId}/credits?language=en-US`);
  } catch (movieErr) {
    try {
      return await request(`/tv/${movieId}/credits?language=en-US`);
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

export const getMovieReviews = async movieId => {
  try {
    return await request(`/movie/${movieId}/reviews?language=en-US&page=1`);
  } catch (movieErr) {
    try {
      return await request(`/tv/${movieId}/reviews?language=en-US&page=1`);
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

export const getMovieVideos = async movieId => {
  try {
    const data = await request(`/movie/${movieId}/videos?language=en-US`);
    if (data.results && data.results.length > 0) return data;
    return await request(`/movie/${movieId}/videos`);
  } catch (movieErr) {
    try {
      const tvData = await request(`/tv/${movieId}/videos?language=en-US`);
      if (tvData.results && tvData.results.length > 0) return tvData;
      return await request(`/tv/${movieId}/videos`);
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

export const getSimilarMovies = async movieId => {
  const normalizeResults = data => ({
    ...data,
    results: (data.results || []).map(item => ({
      ...item,
      title: item.title || item.name || item.original_title || item.original_name,
      release_date: item.release_date || item.first_air_date,
    })),
  });

  try {
    const recData = await request(`/movie/${movieId}/recommendations?language=en-US&page=1`);
    if (recData.results && recData.results.length > 0) {
      return normalizeResults(recData);
    }
    const simData = await request(`/movie/${movieId}/similar?language=en-US&page=1`);
    return normalizeResults(simData);
  } catch (movieErr) {
    try {
      const tvRecData = await request(`/tv/${movieId}/recommendations?language=en-US&page=1`);
      if (tvRecData.results && tvRecData.results.length > 0) {
        return normalizeResults(tvRecData);
      }
      const tvSimData = await request(`/tv/${movieId}/similar?language=en-US&page=1`);
      return normalizeResults(tvSimData);
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

export const getMovieWatchProviders = async movieId => {
  try {
    return await request(`/movie/${movieId}/watch/providers`);
  } catch (movieErr) {
    try {
      return await request(`/tv/${movieId}/watch/providers`);
    } catch (tvErr) {
      throw movieErr;
    }
  }
};

export const getMovieImages = async movieId => {
  try {
    return await request(`/movie/${movieId}/images`);
  } catch (movieErr) {
    try {
      return await request(`/tv/${movieId}/images`);
    } catch (tvErr) {
      throw movieErr;
    }
  }
};


