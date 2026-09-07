import { useLocation } from 'react-router-dom';
import css from './ClapperboardLoader.module.css';

const deriveLoaderLabel = (label, caption = '', pathname = '') => {
  if (label && typeof label === 'string' && label.trim()) {
    return label.trim().toUpperCase();
  }

  const c = (caption || '').toLowerCase();
  const p = (pathname || '').toLowerCase();

  // 1. Check caption keywords first (most specific to the current action)
  if (c.includes('trending')) return 'TRENDING';
  if (c.includes('search')) return 'SEARCH';
  if (c.includes('cast')) return 'CASTING';
  if (c.includes('review')) return 'REVIEWS';
  if (c.includes('trailer')) return 'TRAILER';
  if (c.includes('similar')) return 'SIMILAR';
  if (c.includes('saved') || c.includes('watchlist')) return 'SAVED';
  if (c.includes('image') || c.includes('photo') || c.includes('gallery')) return 'GALLERY';
  if (c.includes('fact') || c.includes('provider') || c.includes('info')) return 'INFO';
  if (c.includes('details') || c.includes('movie') || c.includes('show')) return 'DETAILS';
  if (c.includes('home')) return 'HOME';

  // 2. Fall back to pathname
  if (p.includes('/trending')) return 'TRENDING';
  if (p === '/movies' || p.includes('/search')) return 'SEARCH';
  if (p.includes('/cast')) return 'CASTING';
  if (p.includes('/reviews')) return 'REVIEWS';
  if (p.includes('/trailer')) return 'TRAILER';
  if (p.includes('/similar')) return 'SIMILAR';
  if (p.includes('/saved')) return 'SAVED';
  if (p.includes('/info')) return 'INFO';
  if (p.startsWith('/movies/')) return 'DETAILS';
  if (p === '/' || p === '') return 'HOME';

  return 'CINEMA';
};

export const ClapperboardLoader = ({
  caption = 'Loading scene...',
  isCentered = false,
  label,
  title,
}) => {
  const location = useLocation();
  const displayLabel = deriveLoaderLabel(label || title, caption, location?.pathname);

  return (
    <div
      className={`${css.loaderWrapper} ${isCentered ? css.loaderWrapperCentered : ''}`}
      role="status"
      aria-label={`Loading ${displayLabel}`}
    >
      <div className={css.clapperboard}>
        <div className={css.clapperHinge}>
          <span className={css.hingeRivet} />
          <span className={css.hingeRivet} />
          <span className={css.hingeRivet} />
        </div>
        <div className={css.clapperArm} />
        <div className={css.clapperBody}>
          <div className={css.clapperBodyTopBar} />
          <div className={css.clapperSlate}>
            <div className={css.slateSectionTitle}>{displayLabel}</div>
            <div className={css.slateDivider} />
            <div className={css.slateMetadata}>
              <span>SCENE 01</span>
              <span>TAKE 01</span>
            </div>
          </div>
        </div>
      </div>
      {caption && <p className={css.loaderCaption}>{caption}</p>}
    </div>
  );
};

export default ClapperboardLoader;
