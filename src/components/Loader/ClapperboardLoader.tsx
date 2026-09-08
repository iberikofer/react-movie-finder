import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import css from './ClapperboardLoader.module.css';

export interface ClapperboardLoaderProps {
  caption?: string;
  isCentered?: boolean;
  label?: string;
  title?: string;
}

const deriveLoaderLabel = (label?: string, caption: string = '', pathname: string = ''): string => {
  if (label && typeof label === 'string' && label.trim()) {
    return label.trim().toUpperCase();
  }

  const c = (caption || '').toLowerCase();
  const p = (pathname || '').toLowerCase();

  // 1. Check caption keywords first (English & Ukrainian)
  if (c.includes('trending') || c.includes('тренд')) return 'TRENDING';
  if (c.includes('search') || c.includes('пошук')) return 'SEARCH';
  if (c.includes('cast') || c.includes('актор') || c.includes('творц')) return 'CASTING';
  if (c.includes('review') || c.includes('відгук')) return 'REVIEWS';
  if (c.includes('trailer') || c.includes('трейлер') || c.includes('video') || c.includes('відео')) return 'VIDEOS';
  if (c.includes('similar') || c.includes('схож')) return 'SIMILAR';
  if (c.includes('saved') || c.includes('watchlist') || c.includes('збереж')) return 'SAVED';
  if (c.includes('image') || c.includes('photo') || c.includes('gallery') || c.includes('зображен') || c.includes('галере')) return 'GALLERY';
  if (c.includes('fact') || c.includes('provider') || c.includes('info') || c.includes('інформац')) return 'INFO';
  if (c.includes('translat') || c.includes('переклад') || c.includes('мов')) return 'TRANSLATE';
  if (c.includes('details') || c.includes('movie') || c.includes('show') || c.includes('детал') || c.includes('фільм') || c.includes('серіал') || c.includes('секці')) return 'DETAILS';
  if (c.includes('home') || c.includes('головн')) return 'HOME';

  // 2. Fall back to pathname
  if (p.includes('/trending')) return 'TRENDING';
  if (p === '/movies' || p.includes('/search')) return 'SEARCH';
  if (p.includes('/cast')) return 'CASTING';
  if (p.includes('/reviews')) return 'REVIEWS';
  if (p.includes('/videos') || p.includes('/trailer')) return 'VIDEOS';
  if (p.includes('/similar')) return 'SIMILAR';
  if (p.includes('/saved')) return 'SAVED';
  if (p.includes('/info')) return 'INFO';
  if (p.startsWith('/movies/')) return 'DETAILS';
  if (p === '/' || p === '') return 'HOME';

  return 'CINEMA';
};

export const ClapperboardLoader: React.FC<ClapperboardLoaderProps> = ({
  caption = 'Loading scene...',
  isCentered = false,
  label,
  title,
}) => {
  const { t } = useLanguage();
  const location = useLocation();
  const displayLabel = deriveLoaderLabel(label || title, caption, location?.pathname);

  return (
    <div
      className={`${css.loaderWrapper} ${isCentered ? css.loaderWrapperCentered : ''}`}
      role="status"
      aria-label={`${t('common.loading', 'Loading')} ${displayLabel}`}
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
