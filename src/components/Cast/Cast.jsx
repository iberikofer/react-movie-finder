import { getMovieCredits } from 'fetch';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import css from './Cast.module.css'

export const Cast = () => {
  const { movieId } = useParams();
  const [imageCredits, setImageCredits] = useState({});

  useEffect(() => {
    const fetchMovieCredits = async () => {
      try {
        await getMovieCredits(movieId)
          .then(response => response.json())
          .then(response => setImageCredits(response));
      } catch (error) {
        console.log(error);
      }
    };
    fetchMovieCredits();
  }, [movieId]);

  const creditsMarkup = (
    <div className={css.castContainer}>
      {imageCredits.cast && imageCredits.cast.length > 0 ? (
        <ul className={css.castList}>
          {imageCredits.cast.map(person => (
            <li key={person.id} className={css.castItem}>
              <img
                src={
                  person.profile_path
                    ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                    : 'https://via.placeholder.com/185x278?text=No+Photo'
                }
                alt={person.name}
                className={css.castImage}
              />
              <div className={css.actorInfo}>
                <p className={css.actorName}>{person.name}</p>
                <p className={css.characterName}>
                  Character: {person.character}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No information about the cast.</p>
      )}
    </div>
  );

  return (
    <div style={{ paddingLeft: 30 }}>
      <h2>Credits:</h2>
      {creditsMarkup}
    </div>
  );
};

export default Cast;
