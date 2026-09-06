import css from './MediaTypeBadge.module.css';

export const MediaTypeBadge = ({
  mediaType,
  item,
  isDetails = false,
  className = '',
}) => {
  const type =
    mediaType ||
    item?.media_type ||
    (item?.first_air_date || (item?.name && !item?.title) ? 'tv' : 'movie');

  const isTv = type === 'tv';

  return (
    <div
      className={`${css.typeBadge} ${isTv ? css.tvBadge : css.movieBadge} ${
        isDetails ? css.detailsBadge : css.posterBadge
      } ${className}`.trim()}
      title={isTv ? 'TV Series' : 'Feature Movie'}
    >
      <span className={css.typeIcon}>{isTv ? '📺' : '🎬'}</span>
      <span className={css.typeLabel}>{isTv ? 'Series' : 'Movie'}</span>
    </div>
  );
};

export default MediaTypeBadge;
