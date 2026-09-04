import { useParams } from 'react-router-dom';
import useMovieRating from '../../hooks/useMovieRating';
import StarIcon from './StarIcon';
import css from './CriticsScore.module.css';

export const RatingDistribution = () => {
  const { movieId } = useParams();
  const {
    averageRating,
    formattedAverage,
    totalVotes,
    satisfactionScore,
    satisfactionBadge,
    satisfactionColor,
    starColor,
    distribution,
  } = useMovieRating(movieId);

  const hasVotes = totalVotes > 0;

  return (
    <div className={css.distributionContainer}>
      <div className={css.distHeader}>
        <div className={css.overallScoreBlock}>
          <span className={css.overallBigScore}>{formattedAverage}</span>
          <span className={css.overallScoreDenominator}>/ 5</span>
        </div>

        <div className={css.overallStarsBlock}>
          <div className={css.starsRow}>
            {[1, 2, 3, 4, 5].map(starIndex => {
              let fill = 0;
              if (hasVotes) {
                const diff = averageRating - (starIndex - 1);
                if (diff >= 1) fill = 100;
                else if (diff >= 0.5) fill = 50;
                else if (diff > 0) fill = Math.round(diff * 100);
              }
              return (
                <StarIcon
                  key={starIndex}
                  size={26}
                  fillPercent={fill}
                  color={starColor}
                />
              );
            })}
          </div>
          <span className={css.totalVotesLabel}>
            {totalVotes} {totalVotes === 1 ? 'total rating' : 'total ratings'}
          </span>
        </div>
      </div>

      {hasVotes ? (
        <>
          {/* Detailed 10-tier breakdown bars */}
          <div className={css.tiersGrid}>
            {distribution.map(tier => (
              <div key={tier.stars} className={css.tierRow}>
                <div className={css.tierLabel}>
                  <span>{tier.stars}</span>
                  <StarIcon
                    size={14}
                    fillPercent={100}
                    color="var(--color-star-input)"
                  />
                </div>

                <div className={css.tierTrack}>
                  <div
                    className={css.tierFill}
                    style={{ width: `${tier.percentage}%` }}
                  />
                </div>

                <div className={css.tierStats}>
                  <span>{tier.percentage}%</span>
                  <span className={css.tierCount}>({tier.count})</span>
                </div>
              </div>
            ))}
          </div>

          {/* Satisfaction Score Bar (inspired by react-feedback-page) */}
          <div className={css.satisfactionCard}>
            <div className={css.satisfactionHeader}>
              <h3 className={css.satisfactionTitle}>Satisfaction Score</h3>
              <span
                className={css.satisfactionBadge}
                style={{ backgroundColor: satisfactionColor }}
              >
                {satisfactionBadge}
              </span>
            </div>

            <div className={css.satisfactionProgressWrapper}>
              <div className={css.satisfactionTrack}>
                <div
                  className={css.satisfactionFill}
                  style={{
                    width: `${satisfactionScore}%`,
                    backgroundColor: satisfactionColor,
                  }}
                />
              </div>
              <span
                className={css.satisfactionPercent}
                style={{ color: satisfactionColor }}
              >
                {satisfactionScore}%
              </span>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
          <p style={{ margin: 0, fontSize: '1.05rem' }}>
            No community ratings yet for this film.
          </p>
          <p style={{ marginTop: '8px', fontSize: '0.9rem', fontStyle: 'italic' }}>
            Rate this movie above to start the Critics Score distribution!
          </p>
        </div>
      )}
    </div>
  );
};

export default RatingDistribution;
