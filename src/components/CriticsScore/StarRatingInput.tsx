import React, { useState, useRef, useEffect } from 'react';
import StarIcon from './StarIcon';
import { useLanguage } from '../../context/LanguageContext';
import css from './CriticsScore.module.css';


interface BurstInfo {
  starIndex: number;
  value: number;
  id: number;
}

export interface StarRatingInputProps {
  onRate?: (value: number) => void;
}

export const StarRatingInput: React.FC<StarRatingInputProps> = ({ onRate }) => {
  const { t } = useLanguage();
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [burstInfo, setBurstInfo] = useState<BurstInfo | null>(null);
  const burstTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getTooltipLabel = (val: number): string => {
    if (val <= 1) return t('critics.awful', 'Awful');
    if (val <= 2) return t('critics.meh', 'Meh');
    if (val <= 3) return t('critics.decent', 'Decent');
    if (val <= 4) return t('critics.great', 'Great');
    return t('critics.masterpiece', 'Masterpiece');
  };

  useEffect(() => {
    return () => {
      if (burstTimerRef.current) {
        clearTimeout(burstTimerRef.current);
      }
    };
  }, []);

  const handleRate = (value: number, starIndex: number) => {
    if (onRate) {
      onRate(value);
    }

    if (burstTimerRef.current) {
      clearTimeout(burstTimerRef.current);
    }

    setBurstInfo({ starIndex, value, id: Date.now() });
    burstTimerRef.current = setTimeout(() => {
      setBurstInfo(null);
    }, 650);
  };

  return (
    <div className={`${css.ratingRow} ${css.yourRatingRow}`}>
      <span className={css.sourceLabelYourRating}>{t('critics.yourRating', 'Your Rating')}</span>

      <div
        className={css.starInputGroup}
        onMouseLeave={() => setHoverValue(null)}
      >
        {[1, 2, 3, 4, 5].map(starIndex => {
          let fill = 0;
          if (hoverValue !== null) {
            if (hoverValue >= starIndex) {
              fill = 100;
            } else if (hoverValue === starIndex - 0.5) {
              fill = 50;
            } else {
              fill = 0;
            }
          }

          const isHoveredStar =
            hoverValue !== null && Math.ceil(hoverValue) === starIndex;
          const isBursting = burstInfo && burstInfo.starIndex === starIndex;

          return (
            <div key={starIndex} className={css.starSlot}>
              {/* Left half hit-box (0.5) */}
              <div
                className={css.halfHitLeft}
                onMouseEnter={() => setHoverValue(starIndex - 0.5)}
                onClick={() => handleRate(starIndex - 0.5, starIndex)}
                title={`${starIndex - 0.5} ${t('critics.stars', 'stars')}`}
                role="button"
                aria-label={`${t('critics.rateStars', 'Rate')} ${starIndex - 0.5} ${t('critics.stars', 'stars')}`}
              />

              {/* Right half hit-box (1.0) */}
              <div
                className={css.halfHitRight}
                onMouseEnter={() => setHoverValue(starIndex)}
                onClick={() => handleRate(starIndex, starIndex)}
                title={`${starIndex} ${t('critics.stars', 'stars')}`}
                role="button"
                aria-label={`${t('critics.rateStars', 'Rate')} ${starIndex} ${t('critics.stars', 'stars')}`}
              />

              {/* Star Icon with animated wrapper */}
              <div
                className={`${css.starIconWrapper} ${
                  isBursting ? css.starActive : ''
                }`}
              >
                <StarIcon
                  size={26}
                  fillPercent={fill}
                  color="var(--color-star-input)"
                  emptyColor="rgba(254, 243, 199, 0.2)"
                />
              </div>

              {/* Tooltip bubble positioned over active hovered star */}
              {isHoveredStar && hoverValue !== null && (
                <div className={css.tooltip}>
                  {getTooltipLabel(hoverValue)} ({hoverValue} ★)
                </div>
              )}

              {/* Variant 3 Yellow Shockwave Ring */}
              {isBursting && (
                <div key={burstInfo.id} className={css.burstOverlay}>
                  <span className={css.neonRingYellow} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StarRatingInput;
