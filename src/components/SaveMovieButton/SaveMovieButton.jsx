import { useSavedMovies } from '../../hooks/useSavedMovies';
import css from './SaveMovieButton.module.css';

const BookmarkIcon = ({ filled = false, size = 16 }) => (
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

export const SaveMovieButton = ({
  movie,
  isDetails = false,
  className = '',
  onBeforeRemove,
}) => {
  const { isSaved, toggleSave } = useSavedMovies();
  if (!movie || !movie.id) return null;

  const saved = isSaved(movie.id);

  const handleClick = event => {
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

  return (
    <button
      type="button"
      onClick={handleClick}
      className={buttonClass}
      title={saved ? 'Remove from saved watchlist' : 'Add to saved watchlist'}
      aria-label={saved ? 'Remove from saved watchlist' : 'Add to saved watchlist'}
    >
      <BookmarkIcon filled={saved} size={isDetails ? 18 : 16} />
    </button>
  );
};

export default SaveMovieButton;

