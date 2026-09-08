import React from 'react';
import { Link } from 'react-router-dom';
import StarIcon from './StarIcon';
import { useLanguage } from '../../context/LanguageContext';
import css from './CriticsScore.module.css';

export interface ScoreSummaryProps {
  averageRating?: number;
  formattedAverage?: string;
  totalVotes?: number;
  starColor?: string;
  onReset?: () => void;
  isRow?: boolean;
  ratingLink?: string;
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({
  averageRating = 0,
  formattedAverage = '0.0',
  totalVotes = 0,
  starColor = 'var(--color-star-empty)',
  onReset,
  isRow = false,
  ratingLink,
}) => {
  const { t } = useLanguage();
  const hasVotes = totalVotes > 0;

  const handleScrollToSubnav = () => {
    const scroll = () => {
      const subnavEl = document.getElementById('movie-subnav');
      if (subnavEl) {
        subnavEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    scroll();
    setTimeout(scroll, 80);
  };

  return (
    <div className={isRow ? css.summaryRow : css.summaryContainer}>
      {ratingLink ? (
        <Link
          to={ratingLink}
          className={isRow ? css.sourceLinkCritics : css.summaryLabel}
          onClick={handleScrollToSubnav}
          title={t('movie.viewCriticsRating', 'View Critics Rating breakdown ↗')}
        >
          {t('movie.criticsRating', 'Critics Rating')}{' '}
          <span className={css.externalArrow}>↗</span>
        </Link>
      ) : (
        <span className={isRow ? css.sourceLabelCritics : css.summaryLabel}>
          {t('movie.criticsRating', 'Critics Rating')}
        </span>
      )}

      <div className={css.starsRow}>
        {[1, 2, 3, 4, 5].map(starIndex => {
          let fill = 0;
          if (hasVotes) {
            const diff = averageRating - (starIndex - 1);
            if (diff >= 1) {
              fill = 100;
            } else if (diff >= 0.5) {
              fill = 50;
            } else if (diff > 0) {
              fill = Math.round(diff * 100);
            } else {
              fill = 0;
            }
          }

          return (
            <StarIcon
              key={starIndex}
              size={isRow ? 20 : 22}
              fillPercent={fill}
              color={starColor}
            />
          );
        })}
      </div>

      {hasVotes ? (
        <>
          <span className={css.numericScore}>{formattedAverage}/5</span>
          <span className={css.voteCount}>
            ({totalVotes} {totalVotes === 1 ? t('movie.ratingOne', 'rating') : t('movie.ratings', 'ratings')})
          </span>
          {onReset && (
            <button
              type="button"
              className={css.resetBtn}
              onClick={onReset}
              title={t('movie.resetRating', 'Reset rating for this movie')}
            >
              🔄 {t('movie.resetRating', 'Reset Rating')}
            </button>
          )}
        </>
      ) : (
        <span className={css.emptyInvite}>{t('movie.firstToRate', 'Be the first to rate!')}</span>
      )}
    </div>
  );
};

export default ScoreSummary;
