import { getMovieReviews } from 'fetch';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import css from './Reviews.module.css';


export const Reviews = () => {
  const { movieId } = useParams();
  const [imageReviews, setImageReviews] = useState({});

  useEffect(() => {
    const fetchMovieReviews = async () => {
      try {
        await getMovieReviews(movieId)
          .then(response => response.json())
          .then(response => setImageReviews(response));
      } catch (error) {
        console.log(error);
      }
    };
    fetchMovieReviews();
  }, [movieId]);

  return (
    <div className={css.reviewsContainer}>
      <h2>Reviews:</h2>
      {imageReviews.results && imageReviews.results.length > 0 ? (
        <ul className={css.reviewList}>
          {imageReviews.results.map(review => (
            <li key={review.id} className={css.reviewCard}>
              <span className={css.author}>Author: {review.author}</span>
              <p className={css.content}>{review.content}</p>
              <p className={css.date}>
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Sorry, no reviews for this movie =(</p>
      )}
    </div>
  );
};

export default Reviews;
