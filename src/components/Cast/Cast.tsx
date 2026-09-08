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
  const castRef = useRef(cast);
  castRef.current = cast;

  useEffect(() => {
    if (!movieId) return;
    let isMounted = true;
    if (castRef.current.length === 0) {
      setIsLoading(true);
    }

    const fetchCredits = async () => {
      try {
        const data = await getMovieCredits(movieId);
        if (isMounted) {
          setCast(data.cast || []);
        }
      } catch (error) {
        console.error('Failed to load cast:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCredits();
    return () => {
      isMounted = false;
    };
  }, [movieId, language]);

  return (
    <section className={css.castSection} aria-label={t('movie.castAndCrew')}>
      <div className={css.headerRow}>
        <h2 className={css.sectionTitle}>
          <span className={css.titleIcon}>👥</span> {t('movie.castAndCrew')}
        </h2>
      </div>
      {isLoading ? (
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
  );
};

export default Cast;
