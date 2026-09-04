import { getMovieReviews } from 'fetch';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Loader from '../Loader/Loader';
import css from './Reviews.module.css';

export const Reviews = () => {
  const { movieId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchMovieReviews = async () => {
      try {
        const data = await getMovieReviews(movieId);
        if (isMounted) {
          setReviews(data.results || []);
        }
      } catch (error) {
        console.error('Failed to load reviews:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMovieReviews();
    return () => {
      isMounted = false;
    };
  }, [movieId]);

  return (
    <section className={css.reviewsContainer}>
      <h2>Community Reviews:</h2>
      {isLoading ? (
        <Loader caption="Loading reviews..." />
      ) : reviews.length > 0 ? (
        <ul className={css.reviewList}>
          {reviews.map(review => {
            const date = review.created_at
              ? new Date(review.created_at).toLocaleDateString()
              : null;
            return (
              <li key={review.id} className={css.reviewCard}>
                <span className={css.author}>Author: {review.author}</span>
                <p className={css.content}>{review.content}</p>
                {date && <p className={css.date}>{date}</p>}
              </li>
            );
          })}
        </ul>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>
          No reviews available for this movie yet.
        </p>
      )}
    </section>
  );
};

export default Reviews;
