import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMovieReviews } from 'fetch';
import { Review } from 'types';
import { useLanguage } from '../../context/LanguageContext';
import Loader from '../Loader/Loader';
import css from './Reviews.module.css';

const SOFT_ACCENT_COLORS = [
  '#38bdf8', // Soft Sky Blue
  '#fb923c', // Soft Tangerine
  '#34d399', // Soft Mint Emerald
  '#e879f9', // Soft Orchid Fuchsia
  '#facc15', // Soft Honey Gold
  '#a78bfa', // Soft Iris Violet
  '#fb7185', // Soft Coral Rose
  '#2dd4bf', // Soft Turquoise Teal
  '#fdba74', // Soft Peach Apricot
  '#818cf8', // Soft Periwinkle Indigo
  '#4ade80', // Soft Meadow Green
  '#f472b6', // Soft Pink Flamingo
  '#22d3ee', // Soft Aquamarine Cyan
  '#f97316', // Soft Warm Amber
  '#c084fc', // Soft Lavender
  '#a3e635', // Soft Lime
  '#f43f5e', // Soft Crimson
  '#60a5fa', // Soft Cornflower Blue
  '#d946ef', // Soft Magenta
  '#38d9a9', // Soft Jade
];

const getSoftAccentColor = (index: number, movieId: string = ''): string => {
  let seed = 0;
  const str = String(movieId || '');
  for (let i = 0; i < str.length; i++) {
    seed = (seed * 31 + str.charCodeAt(i)) & 0xffffff;
  }
  const colorIndex = (seed + index) % SOFT_ACCENT_COLORS.length;
  return SOFT_ACCENT_COLORS[colorIndex];
};

export const Reviews: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const { language, t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const reviewsRef = useRef(reviews);
  reviewsRef.current = reviews;

  useEffect(() => {
    if (!movieId) return;
    let isMounted = true;
    if (reviewsRef.current.length === 0) {
      setIsLoading(true);
    }

    const fetchReviews = async () => {
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

    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [movieId, language]);

  return (
    <section className={css.reviewsContainer} aria-label={t('movie.communityReviews')}>
      <div className={css.headerRow}>
        <h2 className={css.sectionTitle}>
          <span className={css.titleIcon}>💬</span> {t('movie.communityReviews')}
        </h2>
      </div>
      {isLoading ? (
        <Loader caption={t('reviews.loading')} />
      ) : reviews.length > 0 ? (
        <ul className={css.reviewList}>
          {reviews.map((review, index) => {
            const date = review.created_at
              ? new Date(review.created_at).toLocaleDateString(language === 'uk' ? 'uk-UA' : 'en-US')
              : null;
            const accent = getSoftAccentColor(index, movieId);
            return (
              <li
                key={review.id}
                className={css.reviewCard}
                style={{ borderLeftColor: accent }}
              >
                <span className={css.author} style={{ color: accent }}>
                  {t('reviews.author')} {review.author}
                </span>
                <p className={css.content}>{review.content}</p>
                {date && <p className={css.date}>{date}</p>}
              </li>
            );
          })}
        </ul>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>
          {t('reviews.noReviews')}
        </p>
      )}
    </section>
  );
};

export default Reviews;
