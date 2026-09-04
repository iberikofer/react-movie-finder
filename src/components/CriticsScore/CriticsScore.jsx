import useMovieRating from '../../hooks/useMovieRating';
import ScoreSummary from './ScoreSummary';
import StarRatingInput from './StarRatingInput';
import css from './CriticsScore.module.css';

export const CriticsScore = ({ movieId }) => {
  const {
    averageRating,
    formattedAverage,
    totalVotes,
    starColor,
    submitRating,
    resetRating,
  } = useMovieRating(movieId);

  return (
    <div className={css.criticsScoreWrapper}>
      <ScoreSummary
        averageRating={averageRating}
        formattedAverage={formattedAverage}
        totalVotes={totalVotes}
        starColor={starColor}
        onReset={resetRating}
      />
      <StarRatingInput onRate={submitRating} />
    </div>
  );
};

export default CriticsScore;
