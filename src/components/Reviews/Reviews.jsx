import { getMovieReviews } from 'fetch';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Loader from '../Loader/Loader';
import css from './Reviews.module.css';

const SOFT_ACCENT_COLORS = [
  '#38bdf8', // Soft Sky Blue
  '#fb923c', // Soft Warm Orange
  '#34d399', // Soft Mint
  '#c084fc', // Soft Lavender
  '#fb7185', // Soft Rose
  '#facc15', // Soft Honey Gold
  '#2dd4bf', // Soft Teal
  '#a78bfa', // Soft Purple
  '#f472b6', // Soft Pink
  '#38d9a9', // Soft Turquoise
];

const getSoftAccentColor = (id, index) => {
  if (!id) return SOFT_ACCENT_COLORS[index % SOFT_ACCENT_COLORS.length];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const mixedIndex = Math.abs(hash + index * 3);
  return SOFT_ACCENT_COLORS[mixedIndex % SOFT_ACCENT_COLORS.length];
};

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
          {reviews.map((review, index) => {
            const date = review.created_at
              ? new Date(review.created_at).toLocaleDateString()
              : null;
            const accent = getSoftAccentColor(review.id, index);
            return (
              <li
                key={review.id}
                className={css.reviewCard}
                style={{ borderLeftColor: accent }}
              >
                <span className={css.author} style={{ color: accent }}>
                  Author: {review.author}
                </span>
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
