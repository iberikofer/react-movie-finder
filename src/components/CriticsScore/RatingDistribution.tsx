import React from 'react';
import { useParams } from 'react-router-dom';
import useMovieRating from '../../hooks/useMovieRating';
import { useLanguage } from '../../context/LanguageContext';
import StarIcon from './StarIcon';
import css from './CriticsScore.module.css';

export const RatingDistribution: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const { language, t } = useLanguage();
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

  const formatVotesLabel = (count: number) => {
    if (language === 'uk') {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod10 === 1 && mod100 !== 11) return `${count} оцінка`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} оцінки`;
      return `${count} оцінок`;
    }
    return `${count} ${count === 1 ? 'total rating' : 'total ratings'}`;
  };

  const getBadgeText = (badge: string) => {
    const b = badge.toLowerCase();
    if (b.includes('excellent')) return t('movie.satisfactionExcellent');
    if (b.includes('average')) return t('movie.satisfactionAverage');
    return t('movie.satisfactionLow');
  };

  return (
    <div className={css.distributionContainer}>
      <div className={css.headerRow}>
        <h2 className={css.sectionTitle}>
          <span className={css.titleIcon}>★</span> {t('movie.criticsRating')}
        </h2>
      </div>

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
          <span className={css.totalVotesLabel}>{formatVotesLabel(totalVotes)}</span>
        </div>
      </div>

      {hasVotes ? (
        <>
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

          <div className={css.satisfactionCard}>
            <div className={css.satisfactionHeader}>
              <h3 className={css.satisfactionTitle}>{t('movie.satisfactionScore')}</h3>
              <span
                className={css.satisfactionBadge}
                style={{ backgroundColor: satisfactionColor }}
              >
                {getBadgeText(satisfactionBadge)}
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
            {t('movie.emptyRatingTitle')}
          </p>
          <p style={{ marginTop: '8px', fontSize: '0.9rem', fontStyle: 'italic' }}>
            {t('movie.emptyRatingDesc')}
          </p>
        </div>
      )}
    </div>
  );
};

export default RatingDistribution;
