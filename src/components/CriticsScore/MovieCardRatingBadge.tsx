import React, { useState, useEffect } from 'react';
import { getMovieRatingSummary } from '../../hooks/useMovieRating';
import { useLanguage } from '../../context/LanguageContext';

export interface MovieCardRatingBadgeProps {
  movieId?: string | number;
}

export const MovieCardRatingBadge: React.FC<MovieCardRatingBadgeProps> = ({ movieId }) => {
  const { t } = useLanguage();
  const [summary, setSummary] = useState(() => getMovieRatingSummary(movieId));

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (
        !customEvent.detail ||
        customEvent.detail.all ||
        String(customEvent.detail.movieId) === String(movieId)
      ) {
        setSummary(getMovieRatingSummary(movieId));
      }
    };

    window.addEventListener('critics_score_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('critics_score_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [movieId]);

  if (!summary.hasVotes) return null;

  let color = '#10b981';
  if (summary.averageRating < 3.0) {
    color = '#f43f5e';
  } else if (summary.averageRating <= 3.5) {
    color = '#f59e0b';
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(6, 44, 38, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1px solid ${color}`,
        borderRadius: '8px',
        padding: '3px 8px',
        color: '#fef3c7',
        fontSize: '0.82rem',
        fontWeight: '800',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
        zIndex: 5,
        letterSpacing: '0.3px',
      }}
      title={`${t('critics.cardTooltip', 'Critics Score')}: ${summary.averageRating}/5 (${summary.totalVotes} ${summary.totalVotes === 1 ? t('critics.voteOne', 'vote') : t('critics.votes', 'votes')})`}
    >
      <span style={{ color }}>★</span>
      <span>{summary.averageRating}</span>
    </div>
  );
};

export default MovieCardRatingBadge;
