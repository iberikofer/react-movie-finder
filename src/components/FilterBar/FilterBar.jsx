import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getAllGenres } from 'fetch';
import { getGenreIcon } from '../GenreFilter/GenreFilter';
import css from './FilterBar.module.css';

const TYPE_OPTIONS = [
  { id: 'all', label: 'All', icon: '🍿', fullLabel: '🍿 All Types' },
  { id: 'movie', label: 'Movies', icon: '🎬', fullLabel: '🎬 Movies' },
  { id: 'tv', label: 'TV Shows', icon: '📺', fullLabel: '📺 TV Series' },
];

const AGE_OPTIONS = [
  { id: 'all', label: 'All', icon: '🌐', fullLabel: '🌐 All Ages' },
  { id: '0+', label: '0+', icon: '🟢', fullLabel: '🟢 0+ (General / G)' },
  { id: '6+', label: '6+', icon: '🟡', fullLabel: '🟡 6+ (Kids / PG)' },
  { id: '12+', label: '12+', icon: '🟠', fullLabel: '🟠 12+ (Teens / PG-13)' },
  { id: '16+', label: '16+', icon: '🔴', fullLabel: '🔴 16+ (Mature / TV-14)' },
  { id: '18+', label: '18+', icon: '⛔', fullLabel: '⛔ 18+ (Adults / R)' },
];

const SORT_OPTIONS = [
  { id: 'popularity.desc', label: 'Popular', icon: '🔥', fullLabel: '🔥 Most Popular' },
  { id: 'vote_average.desc', label: 'Top Rated', icon: '⭐', fullLabel: '⭐ Highest Rated' },
  { id: 'primary_release_date.desc', label: 'Newest', icon: '📅', fullLabel: '📅 Newest First' },
  { id: 'original_title.asc', label: 'A-Z', icon: '🔤', fullLabel: '🔤 Title (A-Z)' },
];

export const FilterBar = ({
  type = 'all',
  onTypeChange,
  age = 'all',
  onAgeChange,
  selectedGenres = [],
  onToggleGenre,
  onClearGenres,
  sortBy = 'popularity.desc',
  onSortChange,
  onResetFilters,
  hasActiveFilters = false,
  variant = 'attached', // 'attached' or 'standalone'
  isFocused = false,
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null); // 'type' | 'age' | 'genres' | 'sort' | null
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef(null);
  const [allGenres, setAllGenres] = useState([]);
  const containerRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Load all available genres for movie and TV
  useEffect(() => {
    let isMounted = true;
    getAllGenres().then(genres => {
      if (isMounted && Array.isArray(genres) && genres.length > 0) {
        setAllGenres(genres);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const openMenu = name => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsClosing(false);
    setActiveDropdown(name);
  };

  const closeMenu = useCallback(() => {
    if (!activeDropdown || isClosing) return;
    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setIsClosing(false);
      closeTimeoutRef.current = null;
    }, 180);
  }, [activeDropdown, isClosing]);

  const toggleDropdown = name => {
    if (activeDropdown === name) {
      if (isClosing) {
        openMenu(name);
      } else {
        closeMenu();
      }
    } else {
      openMenu(name);
    }
  };

  // Handle outside click to close dropdowns
  useEffect(() => {
    if (!activeDropdown) return;

    const handleOutsideClick = event => {
      if (
        containerRef.current &&
        (containerRef.current.contains(event.target) ||
          event.target.closest(`.${css.filterBarContainer}`) ||
          event.target.closest(`.${css.genresWidePopup}`) ||
          event.target.closest(`.${css.verticalDropdown}`))
      ) {
        return;
      }
      closeMenu();
    };

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDropdown, closeMenu]);

  const handleSelectType = newType => {
    if (onTypeChange) onTypeChange(newType);
    closeMenu();
  };

  const selectedAges = useMemo(() => {
    if (!age || age === 'all') return [];
    if (Array.isArray(age)) return age;
    return age.split(',').map(s => s.trim()).filter(Boolean);
  }, [age]);

  const handleToggleAge = ageId => {
    if (ageId === 'all') {
      if (onAgeChange) onAgeChange('all');
      return;
    }

    let nextAges;
    if (selectedAges.includes(ageId)) {
      nextAges = selectedAges.filter(id => id !== ageId);
    } else {
      nextAges = AGE_OPTIONS.filter(
        o => o.id !== 'all' && (selectedAges.includes(o.id) || o.id === ageId)
      ).map(o => o.id);
    }

    if (onAgeChange) {
      onAgeChange(nextAges.length > 0 ? nextAges.join(',') : 'all');
    }
  };

  const handleSelectSort = newSort => {
    if (onSortChange) onSortChange(newSort);
    closeMenu();
  };

  const currentTypeObj = TYPE_OPTIONS.find(o => o.id === type) || TYPE_OPTIONS[0];
  const currentSortObj = SORT_OPTIONS.find(o => o.id === sortBy) || SORT_OPTIONS[0];

  // Resolve genre button label
  const getGenresButtonLabel = () => {
    if (selectedGenres.length === 0) return '🎭 Genres: All';
    if (selectedGenres.length === 1) {
      const found = allGenres.find(g => g.id === selectedGenres[0]);
      if (found) return `🎭 ${found.name}`;
    }
    return `🎭 Genres (${selectedGenres.length})`;
  };

  // Resolve age button label
  const getAgeButtonLabel = () => {
    if (selectedAges.length === 0) return '🌐 Age: All';
    if (selectedAges.length === 1) {
      const found = AGE_OPTIONS.find(o => o.id === selectedAges[0]);
      if (found) return `${found.icon} Age: ${found.label}`;
    }
    return `🌐 Ages (${selectedAges.length})`;
  };

  const isTypeOpen = activeDropdown === 'type' && !isClosing;
  const isGenresOpen = activeDropdown === 'genres' && !isClosing;
  const isAgeOpen = activeDropdown === 'age' && !isClosing;
  const isSortOpen = activeDropdown === 'sort' && !isClosing;
  const isAnyDropdownOpen = Boolean(activeDropdown);

  return (
    <div
      ref={containerRef}
      className={`${css.filterBarContainer} ${
        variant === 'standalone' ? css.standalone : css.attached
      } ${isFocused ? css.attachedFocused : ''}`}
    >
      <div className={css.buttonsRow}>
        {/* 1. Type Dropdown */}
        <div className={css.dropdownWrapper}>
          <button
            type="button"
            className={`${css.filterButton} ${type !== 'all' ? css.filterButtonActive : ''} ${
              isTypeOpen ? css.filterButtonOpen : ''
            }`}
            onClick={() => toggleDropdown('type')}
            aria-expanded={isTypeOpen}
            aria-label="Filter by media type"
          >
            <span className={css.btnText}>
              {currentTypeObj.icon} Type: {currentTypeObj.label}
            </span>
            <span className={`${css.arrowIcon} ${isTypeOpen ? css.arrowRotated : ''}`}>▾</span>
          </button>

          {activeDropdown === 'type' && (
            <div className={`${css.verticalDropdown} ${isClosing ? css.dropdownExit : ''}`}>
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`${css.dropdownItem} ${type === opt.id ? css.dropdownItemActive : ''}`}
                  onClick={() => handleSelectType(opt.id)}
                >
                  <span className={css.dropdownItemLabel}>{opt.fullLabel}</span>
                  {type === opt.id && <span className={css.activeCheck}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Genres Dropdown (Opens wide popup) */}
        <div className={css.dropdownWrapper}>
          <button
            type="button"
            className={`${css.filterButton} ${
              selectedGenres.length > 0 ? css.filterButtonActive : ''
            } ${isGenresOpen ? css.filterButtonOpen : ''}`}
            onClick={() => toggleDropdown('genres')}
            aria-expanded={isGenresOpen}
            aria-label="Filter by genres"
          >
            <span className={css.btnText}>{getGenresButtonLabel()}</span>
            <span className={`${css.arrowIcon} ${isGenresOpen ? css.arrowRotated : ''}`}>▾</span>
          </button>
        </div>

        {/* 3. Age Rating Dropdown */}
        <div className={css.dropdownWrapper}>
          <button
            type="button"
            className={`${css.filterButton} ${
              selectedAges.length > 0 ? css.filterButtonActive : ''
            } ${isAgeOpen ? css.filterButtonOpen : ''}`}
            onClick={() => toggleDropdown('age')}
            aria-expanded={isAgeOpen}
            aria-label="Filter by age rating"
          >
            <span className={css.btnText}>{getAgeButtonLabel()}</span>
            <span className={`${css.arrowIcon} ${isAgeOpen ? css.arrowRotated : ''}`}>▾</span>
          </button>

          {activeDropdown === 'age' && (
            <div className={`${css.verticalDropdown} ${isClosing ? css.dropdownExit : ''}`}>
              {AGE_OPTIONS.map(opt => {
                const isActive =
                  opt.id === 'all'
                    ? selectedAges.length === 0
                    : selectedAges.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${css.dropdownItem} ${
                      isActive ? css.dropdownItemActive : ''
                    }`}
                    onClick={() => handleToggleAge(opt.id)}
                  >
                    <span className={css.dropdownItemLabel}>{opt.fullLabel}</span>
                    {isActive && <span className={css.activeCheck}>✓</span>}
                  </button>
                );
              })}
              <div className={css.dropdownFooter}>
                <button
                  type="button"
                  className={css.dropdownDoneBtn}
                  onClick={closeMenu}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Sort Dropdown */}
        <div className={css.dropdownWrapper}>
          <button
            type="button"
            className={`${css.filterButton} ${
              sortBy !== 'popularity.desc' ? css.filterButtonActive : ''
            } ${isSortOpen ? css.filterButtonOpen : ''}`}
            onClick={() => toggleDropdown('sort')}
            aria-expanded={isSortOpen}
            aria-label="Sort movies"
          >
            <span className={css.btnText}>
              {currentSortObj.icon} Sort: {currentSortObj.label}
            </span>
            <span className={`${css.arrowIcon} ${isSortOpen ? css.arrowRotated : ''}`}>▾</span>
          </button>

          {activeDropdown === 'sort' && (
            <div
              className={`${css.verticalDropdown} ${css.verticalDropdownRight} ${
                isClosing ? css.dropdownExit : ''
              }`}
            >
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`${css.dropdownItem} ${
                    sortBy === opt.id ? css.dropdownItemActive : ''
                  }`}
                  onClick={() => handleSelectSort(opt.id)}
                >
                  <span className={css.dropdownItemLabel}>{opt.fullLabel}</span>
                  {sortBy === opt.id && <span className={css.activeCheck}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Centered Hidden Reset Button / Arrow tab */}
      <div className={`${css.resetSlot} ${isAnyDropdownOpen ? css.resetSlotDisabled : ''}`}>
        <button
          type="button"
          className={`${css.resetButton} ${hasActiveFilters ? css.resetButtonActive : ''} ${
            isAnyDropdownOpen ? css.resetButtonDisabled : ''
          }`}
          onClick={isAnyDropdownOpen ? undefined : onResetFilters}
          disabled={isAnyDropdownOpen}
          aria-disabled={isAnyDropdownOpen}
          title={
            isAnyDropdownOpen
              ? undefined
              : hasActiveFilters
              ? 'Click to reset all filters'
              : 'Reset filters to default'
          }
          aria-label="Reset all filters"
        >
          <span className={css.resetIcon}>↺</span>
          <span className={css.resetText}>Reset Filters</span>
        </button>
      </div>

      {/* Genres Dropdown Popup (Spans width of movie grid) */}
      {activeDropdown === 'genres' && (
        <div
          className={`${css.genresWidePopup} ${isClosing ? css.popupExit : ''}`}
          role="dialog"
          aria-label="Genre Selection"
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className={css.genresHeader}>
            <div className={css.genresTitleGroup}>
              <span className={css.genresTitle}>🎭 Select Genres</span>
              <span className={css.genresBadge}>
                {selectedGenres.length === 0
                  ? 'All genres'
                  : `${selectedGenres.length} selected`}
              </span>
            </div>
            <div className={css.genresActions}>
              {selectedGenres.length > 0 && (
                <button
                  type="button"
                  className={css.clearGenresBtn}
                  onClick={e => {
                    e.stopPropagation();
                    onClearGenres();
                  }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  Clear genres
                </button>
              )}
              <button
                type="button"
                className={css.closePopupBtn}
                onClick={e => {
                  e.stopPropagation();
                  closeMenu();
                }}
                aria-label="Close genres popup"
              >
                ✕
              </button>
            </div>
          </div>

          <div className={css.genresGrid}>
            {allGenres.map(genre => {
              const isSelected = selectedGenres.includes(genre.id);
              const icon = getGenreIcon(genre.id, genre.name);
              return (
                <button
                  key={genre.id}
                  type="button"
                  className={`${css.genrePill} ${isSelected ? css.genrePillSelected : ''}`}
                  onClick={e => {
                    e.stopPropagation();
                    onToggleGenre(genre.id);
                  }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  <span className={css.genreIcon}>{icon}</span>
                  <span className={css.genreName}>{genre.name}</span>
                </button>
              );
            })}
          </div>

          <div className={css.genresFooter}>
            <button
              type="button"
              className={css.doneBtn}
              onClick={e => {
                e.stopPropagation();
                closeMenu();
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

FilterBar.propTypes = {
  type: PropTypes.string,
  onTypeChange: PropTypes.func,
  age: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  onAgeChange: PropTypes.func,
  selectedGenres: PropTypes.arrayOf(PropTypes.number),
  onToggleGenre: PropTypes.func,
  onClearGenres: PropTypes.func,
  sortBy: PropTypes.string,
  onSortChange: PropTypes.func,
  onResetFilters: PropTypes.func,
  hasActiveFilters: PropTypes.bool,
  variant: PropTypes.oneOf(['attached', 'standalone']),
  isFocused: PropTypes.bool,
};

export default FilterBar;
