import React from 'react';
import { MediaItem } from 'types';
import css from './MediaTypeBadge.module.css';

export interface MediaTypeBadgeProps {
  mediaType?: 'movie' | 'tv' | string;
  item?: MediaItem;
  isDetails?: boolean;
  className?: string;
  onFilterType?: (type: 'movie' | 'tv') => void;
}

export const MediaTypeBadge: React.FC<MediaTypeBadgeProps> = ({
  mediaType,
  item,
  isDetails = false,
  className = '',
  onFilterType,
}) => {
  const type =
    mediaType ||
    item?.media_type ||
    (item?.first_air_date || (item?.name && !item?.title) ? 'tv' : 'movie');

  const isTv = type === 'tv';

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (onFilterType) {
      e.preventDefault();
      e.stopPropagation();
      onFilterType(isTv ? 'tv' : 'movie');
    }
  };

  const titleText = onFilterType
    ? isTv
      ? 'Filter by TV Series (Click to apply)'
      : 'Filter by Feature Movie (Click to apply)'
    : isTv
    ? 'TV Series'
    : 'Feature Movie';

  return (
    <div
      role={onFilterType ? 'button' : undefined}
      tabIndex={onFilterType ? 0 : undefined}
      className={`${css.typeBadge} ${isTv ? css.tvBadge : css.movieBadge} ${
        isDetails ? css.detailsBadge : css.posterBadge
      } ${className}`.trim()}
      title={titleText}
      onClick={handleClick}
      onKeyDown={e => {
        if (onFilterType && (e.key === 'Enter' || e.key === ' ')) {
          handleClick(e);
        }
      }}
    >
      <span className={css.typeIcon}>{isTv ? '📺' : '🎬'}</span>
      <span className={css.typeLabel}>{isTv ? 'Series' : 'Movie'}</span>
    </div>
  );
};

export default MediaTypeBadge;
