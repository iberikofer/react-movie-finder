import React from 'react';
import { MediaItem } from 'types';
import { useSavedMovies } from '../../hooks/useSavedMovies';
import { useLanguage } from '../../context/LanguageContext';
import css from './SaveMovieButton.module.css';

interface BookmarkIconProps {
  filled?: boolean;
  size?: number;
}

const BookmarkIcon: React.FC<BookmarkIconProps> = ({ filled = false, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={css.bookmarkSvg}
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export interface SaveMovieButtonProps {
  movie?: MediaItem | null;
  isDetails?: boolean;
  className?: string;
  onBeforeRemove?: (movie: MediaItem) => void;
}

export const SaveMovieButton: React.FC<SaveMovieButtonProps> = ({
  movie,
  isDetails = false,
  className = '',
  onBeforeRemove,
}) => {
  const { t } = useLanguage();
  const { isSaved, toggleSave } = useSavedMovies();
  if (!movie || !movie.id) return null;

  const saved = isSaved(movie.id);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (saved && onBeforeRemove) {
      onBeforeRemove(movie);
      return;
    }
    toggleSave(movie);
  };

  const buttonClass = isDetails
    ? `${css.detailsSaveBtn} ${saved ? css.detailsSaveBtnSaved : ''} ${className}`
    : `${css.cardSaveBtn} ${saved ? css.cardSaveBtnSaved : ''} ${className}`;

  const label = saved
    ? t('bookmark.remove', 'Remove from saved watchlist')
    : t('bookmark.add', 'Add to saved watchlist');

  return (
    <button
      type="button"
      onClick={handleClick}
      className={buttonClass}
      title={label}
      aria-label={label}
    >
      <BookmarkIcon filled={saved} size={isDetails ? 18 : 16} />
    </button>
  );
};

export default SaveMovieButton;
