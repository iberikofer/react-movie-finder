import React, { useState, useEffect } from 'react';
import { MediaItem } from 'types';
import {
  formatShortAgeRating,
  getCachedAgeRating,
  getMediaAgeRating,
} from '../../fetch';
import css from './AgeRatingBadge.module.css';

export interface AgeRatingBadgeProps {
  movie?: MediaItem | null;
  onFilterAge?: (age: string) => void;
}

export const AgeRatingBadge: React.FC<AgeRatingBadgeProps> = ({ movie, onFilterAge }) => {
  const movieId = movie?.id;
  const mediaType = movie?.media_type === 'tv' ? 'tv' : 'movie';
  const existingRating = movie?.age_rating;

  const [rating, setRating] = useState<string | null>(() => {
    if (existingRating) {
      return formatShortAgeRating(existingRating);
    }
    return movieId ? getCachedAgeRating(movieId) : null;
  });

  useEffect(() => {
    if (existingRating) {
      setRating(formatShortAgeRating(existingRating));
      return;
    }

    if (!movieId) {
      setRating('N/A');
      return;
    }

    let isMounted = true;
    getMediaAgeRating(movieId, mediaType, existingRating).then(res => {
      if (isMounted) {
        setRating(res || 'N/A');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [movieId, mediaType, existingRating]);

  if (!rating) {
    return null;
  }

  let themeClass = css.ageGeneral;
  if (rating === 'N/A') {
    themeClass = css.ageUnavailable;
  } else if (rating.startsWith('18') || rating.includes('18+')) {
    themeClass = css.ageAdult;
  } else if (
    rating.startsWith('16') ||
    rating.startsWith('15') ||
    rating.startsWith('14') ||
    rating.startsWith('13') ||
    rating.startsWith('12')
  ) {
    themeClass = css.ageTeen;
  }

  const isClickable = Boolean(onFilterAge && rating !== 'N/A');

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (!isClickable || !onFilterAge) return;
    e.preventDefault();
    e.stopPropagation();

    let targetAge = 'all';
    if (rating.startsWith('18') || rating.includes('18+')) targetAge = '18+';
    else if (rating.startsWith('16') || rating.startsWith('15')) targetAge = '16+';
    else if (
      rating.startsWith('14') ||
      rating.startsWith('13') ||
      rating.startsWith('12')
    ) {
      targetAge = '12+';
    } else if (rating.startsWith('7') || rating.startsWith('6')) targetAge = '6+';
    else if (rating.startsWith('0')) targetAge = '0+';

    if (targetAge !== 'all') {
      onFilterAge(targetAge);
    }
  };

  const tooltipTitle =
    rating === 'N/A'
      ? 'Age rating unavailable (N/A — Not Available)'
      : isClickable
      ? `Filter by ${rating} (Click to apply)`
      : `Age rating: ${rating}`;

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={`${css.ageBadge} ${themeClass} ${
        isClickable ? css.clickableBadge : ''
      }`}
      title={tooltipTitle}
      aria-label={tooltipTitle}
      onClick={handleClick}
      onKeyDown={e => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          handleClick(e);
        }
      }}
    >
      <span className={css.ageValue}>{rating}</span>
    </div>
  );
};

export default AgeRatingBadge;
