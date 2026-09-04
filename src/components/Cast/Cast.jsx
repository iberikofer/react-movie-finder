import { getMovieCredits } from 'fetch';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Loader from '../Loader/Loader';
import css from './Cast.module.css';

export const Cast = () => {
  const { movieId } = useParams();
  const [cast, setCast] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchMovieCredits = async () => {
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

    fetchMovieCredits();
    return () => {
      isMounted = false;
    };
  }, [movieId]);

  return (
    <section className={css.castSection}>
      <h2>Cast & Crew:</h2>
      {isLoading ? (
        <Loader caption="Loading cast & crew..." />
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
                      Character: {person.character || 'N/A'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px' }}>
              No information about the cast.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default Cast;
