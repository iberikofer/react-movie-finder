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

export const DEFAULT_SORT_OPTIONS = [
  { id: 'popularity.desc', label: 'Popular', icon: '🔥', fullLabel: '🔥 Most Popular' },
  { id: 'vote_average.desc', label: 'Top Rated', icon: '⭐', fullLabel: '⭐ Highest Rated' },
  { id: 'primary_release_date.desc', label: 'Newest', icon: '📅', fullLabel: '📅 Newest First' },
  { id: 'original_title.asc', label: 'A-Z', icon: '🔤', fullLabel: '🔤 Title (A-Z)' },
];

export const SAVED_SORT_OPTIONS = [
  { id: 'popularity.desc', label: 'Popular', icon: '🔥', fullLabel: '🔥 Most Popular' },
  { id: 'saved_at.desc', label: 'Newest Added', icon: '🕒', fullLabel: '🕒 Date Added (Newest)' },
  { id: 'saved_at.asc', label: 'Oldest Added', icon: '⏳', fullLabel: '⏳ Date Added (Oldest)' },
  { id: 'vote_average.desc', label: 'Top Rated', icon: '⭐', fullLabel: '⭐ Highest Rated' },
  { id: 'primary_release_date.desc', label: 'Release Date', icon: '📅', fullLabel: '📅 Release Date' },
  { id: 'original_title.asc', label: 'A-Z', icon: '🔤', fullLabel: '🔤 Title (A-Z)' },
];

export const SORT_OPTIONS = DEFAULT_SORT_OPTIONS;

const areArraysEqual = (arr1, arr2) => {
  if (arr1 === arr2) return true;
  if (!arr1 || !arr2) return false;
  if (arr1.length !== arr2.length) return false;
  const set = new Set(arr1.map(String));
  return arr2.every(item => set.has(String(item)));
};

export const FilterBar = ({
  type = 'all',
  onTypeChange,
  age = 'all',
  onAgeChange,
  selectedGenres = [],
  onToggleGenre,
  onClearGenres,
  onGenresChange,
  sortBy = 'popularity.desc',
  onSortChange,
  onResetFilters,
  hasActiveFilters = false,
  variant = 'attached', // 'attached' or 'standalone'
  isFocused = false,
  sortOptions = DEFAULT_SORT_OPTIONS,
  defaultSort = 'popularity.desc',
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null); // 'type' | 'age' | 'genres' | 'sort' | null
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef(null);
  const [allGenres, setAllGenres] = useState([]);
  const containerRef = useRef(null);

  const selectedAges = useMemo(() => {
    if (!age || age === 'all') return [];
    if (Array.isArray(age)) return age;
    return age.split(',').map(s => s.trim()).filter(Boolean);
  }, [age]);

  const AGE_ORDER = useMemo(() => ['0+', '6+', '12+', '16+', '18+'], []);

  // Staged states for dropdowns with a "Done" button (genres & age)
  const [stagedGenres, setStagedGenres] = useState(selectedGenres);
  const stagedGenresRef = useRef(selectedGenres);

  const [stagedAges, setStagedAges] = useState(selectedAges);
  const stagedAgesRef = useRef(selectedAges);

  // Track whether cascade has already fired during the current open session of age dropdown
  const hasCascadedInSessionRef = useRef(false);

  // Sync staged state with props when dropdown is closed
  useEffect(() => {
    if (activeDropdown !== 'genres') {
      setStagedGenres(selectedGenres);
      stagedGenresRef.current = selectedGenres;
    }
  }, [selectedGenres, activeDropdown]);

  useEffect(() => {
    if (activeDropdown !== 'age') {
      setStagedAges(selectedAges);
      stagedAgesRef.current = selectedAges;
    }
  }, [selectedAges, activeDropdown]);

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

  // Commit staged values to parents
  const commitStagedValues = useCallback(
    dropdownName => {
      if (dropdownName === 'genres') {
        const currentStaged = stagedGenresRef.current;
        if (!areArraysEqual(currentStaged, selectedGenres)) {
          if (onGenresChange) {
            onGenresChange(currentStaged);
          } else if (onToggleGenre) {
            const toAdd = currentStaged.filter(g => !selectedGenres.includes(g));
            const toRemove = selectedGenres.filter(g => !currentStaged.includes(g));
            toAdd.forEach(g => onToggleGenre(g));
            toRemove.forEach(g => onToggleGenre(g));
          }
        }
      } else if (dropdownName === 'age') {
        const currentStaged = stagedAgesRef.current;
        if (!areArraysEqual(currentStaged, selectedAges)) {
          if (onAgeChange) {
            const nextVal = currentStaged.length > 0 ? currentStaged.join(',') : 'all';
            onAgeChange(nextVal);
          }
        }
      }
    },
    [selectedGenres, selectedAges, onGenresChange, onToggleGenre, onAgeChange]
  );

  const openMenu = useCallback(
    name => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }

      // If switching from another dropdown, commit that dropdown first
      if (activeDropdown && activeDropdown !== name) {
        commitStagedValues(activeDropdown);
      }

      // Initialize staged state for the newly opened dropdown
      if (name === 'genres') {
        setStagedGenres(selectedGenres);
        stagedGenresRef.current = selectedGenres;
      } else if (name === 'age') {
        setStagedAges(selectedAges);
        stagedAgesRef.current = selectedAges;
        hasCascadedInSessionRef.current = false;
      }

      setIsClosing(false);
      setActiveDropdown(name);
    },
    [activeDropdown, commitStagedValues, selectedGenres, selectedAges]
  );

  const closeMenu = useCallback(() => {
    if (!activeDropdown || isClosing) return;

    // Immediately commit changes of the dropdown that is closing
    commitStagedValues(activeDropdown);
    hasCascadedInSessionRef.current = false;

    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setIsClosing(false);
      closeTimeoutRef.current = null;
    }, 180);
  }, [activeDropdown, isClosing, commitStagedValues]);

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

  // Handle outside click and Escape key to commit and close dropdowns
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

  const handleToggleStagedAge = ageId => {
    if (ageId === 'all') {
      setStagedAges([]);
      stagedAgesRef.current = [];
      hasCascadedInSessionRef.current = false;
      return;
    }

    if (stagedAges.includes(ageId)) {
      // Unselect specifically this category
      const nextAges = stagedAges.filter(id => id !== ageId);
      setStagedAges(nextAges);
      stagedAgesRef.current = nextAges;
    } else {
      // Selecting an age category
      if (!hasCascadedInSessionRef.current) {
        // First selection in this open session: cascade down!
        const targetIdx = AGE_ORDER.indexOf(ageId);
        const cascadingAges = targetIdx !== -1 ? AGE_ORDER.slice(0, targetIdx + 1) : [ageId];
        const combined = new Set([...stagedAges, ...cascadingAges]);
        const nextAges = AGE_ORDER.filter(id => combined.has(id));
        setStagedAges(nextAges);
        stagedAgesRef.current = nextAges;
        hasCascadedInSessionRef.current = true;
      } else {
        // Second or subsequent selection in this same session: NO cascade!
        const combined = new Set([...stagedAges, ageId]);
        const nextAges = AGE_ORDER.filter(id => combined.has(id));
        setStagedAges(nextAges);
        stagedAgesRef.current = nextAges;
      }
    }
  };

  const handleToggleStagedGenre = genreId => {
    let nextGenres;
    if (stagedGenres.includes(genreId)) {
      nextGenres = stagedGenres.filter(id => id !== genreId);
    } else {
      nextGenres = [...stagedGenres, genreId];
    }
    setStagedGenres(nextGenres);
    stagedGenresRef.current = nextGenres;
  };

  const handleClearStagedGenres = () => {
    setStagedGenres([]);
    stagedGenresRef.current = [];
  };

  const handleSelectSort = newSort => {
    if (onSortChange) onSortChange(newSort);
    closeMenu();
  };

  const currentTypeObj = TYPE_OPTIONS.find(o => o.id === type) || TYPE_OPTIONS[0];
  const currentSortObj = sortOptions.find(o => o.id === sortBy) || sortOptions[0] || DEFAULT_SORT_OPTIONS[0];

  // Resolve genre button label (reflect staged list if open)
  const getGenresButtonLabel = () => {
    const list = activeDropdown === 'genres' ? stagedGenres : selectedGenres;
    if (list.length === 0) return '🎭 Genres: All';
    if (list.length === 1) {
      const found = allGenres.find(g => g.id === list[0]);
      if (found) return `🎭 ${found.name}`;
    }
    return `🎭 Genres (${list.length})`;
  };

  // Resolve age button label (reflect staged list if open)
  const getAgeButtonLabel = () => {
    const list = activeDropdown === 'age' ? stagedAges : selectedAges;
    if (list.length === 0) return '🌐 Age: All';
    if (list.length === 1) {
      const found = AGE_OPTIONS.find(o => o.id === list[0]);
      if (found) return `${found.icon} Age: ${found.label}`;
    }
    const highestSelected = list[list.length - 1];
    const highestIdx = AGE_ORDER.indexOf(highestSelected);
    if (
      highestIdx !== -1 &&
      list.length === highestIdx + 1 &&
      AGE_ORDER.slice(0, highestIdx + 1).every(id => list.includes(id))
    ) {
      const found = AGE_OPTIONS.find(o => o.id === highestSelected);
      return `${found?.icon || '🌐'} Age: Up to ${highestSelected}`;
    }
    return `🌐 Ages (${list.length})`;
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
              (activeDropdown === 'genres' ? stagedGenres.length > 0 : selectedGenres.length > 0)
                ? css.filterButtonActive
                : ''
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
              (activeDropdown === 'age' ? stagedAges.length > 0 : selectedAges.length > 0)
                ? css.filterButtonActive
                : ''
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
                    ? stagedAges.length === 0
                    : stagedAges.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${css.dropdownItem} ${
                      isActive ? css.dropdownItemActive : ''
                    }`}
                    onClick={() => handleToggleStagedAge(opt.id)}
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
              sortBy !== defaultSort ? css.filterButtonActive : ''
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
              {sortOptions.map(opt => (
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
                {stagedGenres.length === 0
                  ? 'All genres'
                  : `${stagedGenres.length} selected`}
              </span>
            </div>
            <div className={css.genresActions}>
              {stagedGenres.length > 0 && (
                <button
                  type="button"
                  className={css.clearGenresBtn}
                  onClick={e => {
                    e.stopPropagation();
                    handleClearStagedGenres();
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
              const isSelected = stagedGenres.includes(genre.id);
              const icon = getGenreIcon(genre.id, genre.name);
              return (
                <button
                  key={genre.id}
                  type="button"
                  className={`${css.genrePill} ${isSelected ? css.genrePillSelected : ''}`}
                  onClick={e => {
                    e.stopPropagation();
                    handleToggleStagedGenre(genre.id);
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
  onGenresChange: PropTypes.func,
  sortBy: PropTypes.string,
  onSortChange: PropTypes.func,
  onResetFilters: PropTypes.func,
  hasActiveFilters: PropTypes.bool,
  variant: PropTypes.oneOf(['attached', 'standalone']),
  isFocused: PropTypes.bool,
  sortOptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      fullLabel: PropTypes.string.isRequired,
    })
  ),
  defaultSort: PropTypes.string,
};

export default FilterBar;
