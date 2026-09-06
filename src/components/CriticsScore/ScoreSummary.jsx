import StarIcon from './StarIcon';
import css from './CriticsScore.module.css';

export const ScoreSummary = ({
  averageRating = 0,
  formattedAverage = '0.0',
  totalVotes = 0,
  starColor = 'var(--color-star-empty)',
  onReset,
  isRow = false,
}) => {
  const hasVotes = totalVotes > 0;

  return (
    <div className={isRow ? css.summaryRow : css.summaryContainer}>
      <span className={isRow ? css.sourceLabelCritics : css.summaryLabel}>
        Critics
      </span>

      <div className={css.starsRow}>
        {[1, 2, 3, 4, 5].map(starIndex => {
          let fill = 0;
          if (hasVotes) {
            // Precise fractional fill for rendered average stars
            const diff = averageRating - (starIndex - 1);
            if (diff >= 1) {
              fill = 100;
            } else if (diff >= 0.5) {
              fill = 50;
            } else if (diff > 0) {
              fill = Math.round(diff * 100);
            } else {
              fill = 0;
            }
          }

          return (
            <StarIcon
              key={starIndex}
              size={isRow ? 20 : 22}
              fillPercent={fill}
              color={starColor}
            />
          );
        })}
      </div>

      {hasVotes ? (
        <>
          <span className={css.numericScore}>{formattedAverage}/5</span>
          <span className={css.voteCount}>
            ({totalVotes} {totalVotes === 1 ? 'rating' : 'ratings'})
          </span>
          {onReset && (
            <button
              type="button"
              className={css.resetBtn}
              onClick={onReset}
              title="Reset rating for this movie"
            >
              Reset Rating
            </button>
          )}
        </>
      ) : (
        <span className={css.emptyInvite}>Be the first to rate!</span>
      )}
    </div>
  );
};

export default ScoreSummary;
