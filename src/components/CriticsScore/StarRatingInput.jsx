import { useState, useRef, useEffect } from 'react';
import StarIcon from './StarIcon';
import css from './CriticsScore.module.css';

const TOOLTIP_LABELS = {
  0.5: 'Awful',
  1: 'Awful',
  1.5: 'Meh',
  2: 'Meh',
  2.5: 'Decent',
  3: 'Decent',
  3.5: 'Great',
  4: 'Great',
  4.5: 'Masterpiece',
  5: 'Masterpiece',
};

export const StarRatingInput = ({ onRate }) => {
  const [hoverValue, setHoverValue] = useState(null);
  const [burstInfo, setBurstInfo] = useState(null);
  const burstTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (burstTimerRef.current) {
        clearTimeout(burstTimerRef.current);
      }
    };
  }, []);

  const handleRate = (value, starIndex) => {
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
      <span className={css.sourceLabelYourRating}>Your Rating</span>

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
                title={`${starIndex - 0.5} stars`}
                role="button"
                aria-label={`Rate ${starIndex - 0.5} stars`}
              />

              {/* Right half hit-box (1.0) */}
              <div
                className={css.halfHitRight}
                onMouseEnter={() => setHoverValue(starIndex)}
                onClick={() => handleRate(starIndex, starIndex)}
                title={`${starIndex} stars`}
                role="button"
                aria-label={`Rate ${starIndex} stars`}
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
              {isHoveredStar && (
                <div className={css.tooltip}>
                  {TOOLTIP_LABELS[hoverValue]} ({hoverValue} ★)
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
