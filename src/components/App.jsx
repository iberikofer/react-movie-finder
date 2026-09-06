import { Route, Routes } from 'react-router-dom';
import { lazy, useEffect } from 'react';
import { getMovieGenres } from 'fetch';
import ScrollToTop from './ScrollToTop/ScrollToTop';
import Header from './Header/Header';

import Home from '../pages/Home';
import Saved from '../pages/Saved';
import Trending from '../pages/Trending';
import Movies from '../pages/Movies';
const MovieDetails = lazy(() => import('./MovieDetails/MovieDetails'));
const Cast = lazy(() => import('./Cast/Cast'));
const Reviews = lazy(() => import('./Reviews/Reviews'));
const Trailer = lazy(() => import('./Trailer/Trailer'));
const MovieInfo = lazy(() => import('./MovieInfo/MovieInfo'));
const SimilarMovies = lazy(() => import('./SimilarMovies/SimilarMovies'));
const RatingDistribution = lazy(() =>
  import('./CriticsScore/RatingDistribution')
);
const NotFound = lazy(() => import('../pages/NotFound'));

export const App = () => {
  useEffect(() => {
    getMovieGenres();
  }, []);

  return (
    <div>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Header />}>
            <Route index element={<Home />} />
            <Route path="movies" element={<Movies />} />
            <Route path="trending" element={<Trending />} />
            <Route path="saved" element={<Saved />} />
            <Route path="movies/:movieId" element={<MovieDetails />}>
              <Route path="rating" element={<RatingDistribution />} />
              <Route path="info" element={<MovieInfo />} />
              <Route path="trailer" element={<Trailer />} />
              <Route path="cast" element={<Cast />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="similar" element={<SimilarMovies />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
    </div>
  );
};

export default App;
