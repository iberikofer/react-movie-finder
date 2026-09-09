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
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const reviewsRef = useRef(reviews);
  reviewsRef.current = reviews;
  const prevLangRef = useRef<string>(language);
  const hasDataRef = useRef<boolean>(false);

  useEffect(() => {
    if (!movieId) return;
    let isMounted = true;
    const isLangChange = prevLangRef.current !== language;
    prevLangRef.current = language;

    if (!hasDataRef.current || (isLangChange && !hasDataRef.current)) {
      setIsLoading(true);
    } else if (isLangChange && hasDataRef.current) {
      setIsTranslating(true);
    }

    const fetchReviews = async () => {
      const startTime = Date.now();
      try {
        const data = await getMovieReviews(movieId);
        
        if (isLangChange && hasDataRef.current) {
          const elapsed = Date.now() - startTime;
          if (elapsed < 420) {
            await new Promise(resolve => setTimeout(resolve, 420 - elapsed));
          }
        }

        if (isMounted) {
          setReviews(data.results || []);
          hasDataRef.current = true;
        }
      } catch (error) {
        console.error('Failed to load reviews:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsTranslating(false);
        }
      }
    };

    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [movieId, language]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Translating overlay */}
      <div
        className={`${css.translatingOverlay} ${
          isTranslating ? css.translatingActive : css.translatingHidden
        }`}
        aria-hidden={!isTranslating}
        aria-live="polite"
      >
        <Loader
          label={t('movie.translatingSlate', 'TRANSLATE')}
          caption={t('movie.translating', 'Translating...')}
        />
      </div>
      <section className={css.reviewsContainer} aria-label={t('movie.communityReviews')}>
        <div className={css.headerRow}>
          <h2 className={css.sectionTitle}>
            <span className={css.titleIcon}>💬</span> {t('movie.communityReviews')}
          </h2>
        </div>
        {isLoading && !isTranslating ? (
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
    </div>
  );
};

export default Reviews;
