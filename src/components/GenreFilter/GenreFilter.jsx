import { useState, useEffect } from 'react';
import { getMovieGenres } from 'fetch';
import css from './GenreFilter.module.css';

export const GENRE_ICONS = {
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
  10759: '💥', // Action & Adventure (TV)
  10762: '👶', // Kids (TV)
  10763: '📰', // News (TV)
  10764: '🎪', // Reality (TV)
  10765: '🛸', // Sci-Fi & Fantasy (TV)
  10766: '🧼', // Soap (TV)
  10767: '🎙️', // Talk (TV)
  10768: '⚔️', // War & Politics (TV)
};

export const getGenreIcon = (genreId, genreName = '') => {
  if (genreId && GENRE_ICONS[genreId]) {
    return GENRE_ICONS[genreId];
  }
  const clean = String(genreName).toLowerCase().trim();
  const nameMap = {
    action: '💥',
    adventure: '🧭',
    animation: '🎨',
    comedy: '😂',
    crime: '🕵️',
    documentary: '📽️',
    drama: '🎭',
    family: '👨‍👩‍👧',
    fantasy: '🧙',
    history: '📜',
    horror: '👻',
    music: '🎵',
    mystery: '🔍',
    romance: '❤️',
    'sci-fi': '🚀',
    'science fiction': '🚀',
    'tv movie': '📺',
    thriller: '⚡',
    war: '⚔️',
    western: '🤠',
    'action & adventure': '💥',
    kids: '👶',
    news: '📰',
    reality: '🎪',
    'sci-fi & fantasy': '🛸',
    soap: '🧼',
    talk: '🎙️',
    'war & politics': '⚔️',
  };
  return nameMap[clean] || '🎬';
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

const getInitialGenres = allLabel => {
  try {
    const cached = localStorage.getItem('tmdb_movie_genres');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [{ id: 'all', name: allLabel }, ...parsed];
      }
    }
  } catch (err) {
    // LocalStorage fallback
  }
  return POPULAR_GENRES.map(g => (g.id === 'all' ? { ...g, name: allLabel } : g));
};

export const GenreFilter = ({
  selectedGenres = [],
  onToggleGenre,
  allLabel = 'All',
}) => {
  const [genres, setGenres] = useState(() => getInitialGenres(allLabel));

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
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GenreFilter;
