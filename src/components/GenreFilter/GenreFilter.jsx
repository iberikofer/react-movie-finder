import { useState, useEffect } from 'react';
import { getMovieGenres } from 'fetch';
import css from './GenreFilter.module.css';

const GENRE_ICONS = {
  all: '🔥',
  28: '💥',
  12: '🧭',
  16: '🎨',
  35: '😂',
  80: '🕵️',
  99: '📽️',
  18: '🎭',
  10751: '👨‍👩‍👧',
  14: '🧙',
  36: '📜',
  27: '👻',
  10402: '🎵',
  9648: '🔍',
  10749: '❤️',
  878: '🚀',
  10770: '📺',
  53: '⚡',
  10752: '⚔️',
  37: '🤠',
};

const POPULAR_GENRES = [
  { id: 'all', name: 'All Trending' },
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 878, name: 'Sci-Fi' },
  { id: 27, name: 'Horror' },
  { id: 18, name: 'Drama' },
  { id: 53, name: 'Thriller' },
  { id: 16, name: 'Animation' },
  { id: 12, name: 'Adventure' },
  { id: 10749, name: 'Romance' },
  { id: 9648, name: 'Mystery' },
  { id: 14, name: 'Fantasy' },
  { id: 80, name: 'Crime' },
  { id: 10751, name: 'Family' },
  { id: 99, name: 'Documentary' },
];

export const GenreFilter = ({
  selectedGenres = [],
  onToggleGenre,
  allLabel = 'All',
}) => {
  const [genres, setGenres] = useState(POPULAR_GENRES);

  useEffect(() => {
    let isMounted = true;
    const loadGenres = async () => {
      try {
        const fetchedGenres = await getMovieGenres();
        if (isMounted && fetchedGenres.length > 0) {
          setGenres([
            { id: 'all', name: allLabel },
            ...fetchedGenres,
          ]);
        }
      } catch (err) {
        // Fallback to POPULAR_GENRES already in state
      }
    };
    loadGenres();
    return () => {
      isMounted = false;
    };
  }, [allLabel]);

  const selectedArray = Array.isArray(selectedGenres)
    ? selectedGenres
    : selectedGenres === 'all' || !selectedGenres
    ? []
    : [selectedGenres];

  const isAllSelected = selectedArray.length === 0;

  const handlePillClick = genreId => {
    if (genreId === 'all') {
      onToggleGenre([]);
      return;
    }

    const numId = Number(genreId);
    const exists = selectedArray.some(id => Number(id) === numId);
    const updated = exists
      ? selectedArray.filter(id => Number(id) !== numId)
      : [...selectedArray, numId];

    onToggleGenre(updated);
  };

  return (
    <div className={css.genreFilterWrapper} role="toolbar" aria-label="Filter movies by genre">
      <div className={css.pillsTrack}>
        {genres.map(genre => {
          const isSelected =
            genre.id === 'all'
              ? isAllSelected
              : selectedArray.some(id => Number(id) === Number(genre.id));

          const icon = GENRE_ICONS[genre.id] || '🎬';

          return (
            <button
              key={genre.id}
              type="button"
              className={`${css.genrePill} ${isSelected ? css.genrePillActive : ''}`}
              onClick={() => handlePillClick(genre.id)}
              aria-pressed={isSelected}
              title={
                genre.id === 'all'
                  ? 'Reset all genre filters'
                  : isSelected
                  ? `Remove ${genre.name} filter`
                  : `Add ${genre.name} to filter`
              }
            >
              <span className={css.pillIcon}>{icon}</span>
              <span className={css.pillText}>
                {genre.id === 'all' ? allLabel : genre.name}
              </span>
              {isSelected && genre.id !== 'all' && (
                <span className={css.activeCheck} aria-hidden="true">✔</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GenreFilter;
