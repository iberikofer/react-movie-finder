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

export const getTrendingMovies = () => {
  return request('/trending/all/day?language=en-US');
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

