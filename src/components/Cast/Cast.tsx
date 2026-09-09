import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMovieCredits } from 'fetch';
import { CastMember } from 'types';
import { useLanguage } from '../../context/LanguageContext';
import Loader from '../Loader/Loader';
import css from './Cast.module.css';

export const Cast: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const { language, t } = useLanguage();
  const [cast, setCast] = useState<CastMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const castRef = useRef(cast);
  castRef.current = cast;
  const prevLangRef = useRef<string>(language);
  const hasDataRef = useRef<boolean>(false);

  useEffect(() => {
    if (!movieId) return;
    let isMounted = true;
    const isLangChange = prevLangRef.current !== language;
    prevLangRef.current = language;

    if (!hasDataRef.current || (isLangChange && !hasDataRef.current)) {
      setIsLoading(true);
    } else if (isLangChange && hasDataRef.current) {
      setIsTranslating(true);
    }

    const fetchCredits = async () => {
      const startTime = Date.now();
      try {
        const data = await getMovieCredits(movieId);
        
        if (isLangChange && hasDataRef.current) {
          const elapsed = Date.now() - startTime;
          if (elapsed < 420) {
            await new Promise(resolve => setTimeout(resolve, 420 - elapsed));
          }
        }

        if (isMounted) {
          setCast(data.cast || []);
          hasDataRef.current = true;
        }
      } catch (error) {
        console.error('Failed to load cast:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsTranslating(false);
        }
      }
    };

    fetchCredits();
    return () => {
      isMounted = false;
    };
  }, [movieId, language]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Translating overlay */}
      <div
        className={`${css.translatingOverlay} ${
          isTranslating ? css.translatingActive : css.translatingHidden
        }`}
        aria-hidden={!isTranslating}
        aria-live="polite"
      >
        <Loader
          label={t('movie.translatingSlate', 'TRANSLATE')}
          caption={t('movie.translating', 'Translating...')}
        />
      </div>
      <section className={css.castSection} aria-label={t('movie.castAndCrew')}>
        <div className={css.headerRow}>
          <h2 className={css.sectionTitle}>
            <span className={css.titleIcon}>👥</span> {t('movie.castAndCrew')}
          </h2>
        </div>
        {isLoading && !isTranslating ? (
          <Loader caption={t('cast.loading')} />
        ) : (
        <div className={css.castContainer}>
          {cast.length > 0 ? (
            <ul className={css.castList}>
              {cast.map(person => (
                <li key={person.id} className={css.castItem}>
                  <img
                    src={
                    person.profile_path
                      ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                      : 'https://placehold.co/185x278/2a2a2a/ffffff?text=No+Photo'
                    }
                    alt={person.name}
                    className={css.castImage}
                  />
                  <div className={css.actorInfo}>
                    <p className={css.actorName}>{person.name}</p>
                    <p className={css.characterName}>
                      {t('cast.character')} {person.character || '—'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>
              {t('cast.noCast')}
            </p>
          )}
        </div>
        )}
      </section>
    </div>
  );
};

export default Cast;
