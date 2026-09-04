import { useState, useRef } from 'react';
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

const BURST_PARTICLES = [
  { id: 1, angle: '0deg', dist: '48px', size: '11px' },
  { id: 2, angle: '30deg', dist: '42px', size: '9px' },
  { id: 3, angle: '60deg', dist: '46px', size: '12px' },
  { id: 4, angle: '90deg', dist: '50px', size: '10px' },
  { id: 5, angle: '120deg', dist: '44px', size: '11px' },
  { id: 6, angle: '150deg', dist: '48px', size: '9px' },
  { id: 7, angle: '180deg', dist: '50px', size: '12px' },
  { id: 8, angle: '210deg', dist: '42px', size: '9px' },
  { id: 9, angle: '240deg', dist: '46px', size: '11px' },
  { id: 10, angle: '270deg', dist: '50px', size: '10px' },
  { id: 11, angle: '300deg', dist: '44px', size: '12px' },
  { id: 12, angle: '330deg', dist: '48px', size: '9px' },
];

export const StarRatingInput = ({ onRate }) => {
  const [hoverValue, setHoverValue] = useState(null);
  const [burstInfo, setBurstInfo] = useState(null);
  const burstTimerRef = useRef(null);

  const handleRate = (value, starIndex) => {
    if (onRate) {
      onRate(value);
    }

    if (burstTimerRef.current) {
      clearTimeout(burstTimerRef.current);
    }

    setBurstInfo({ starIndex, id: Date.now() });
    burstTimerRef.current = setTimeout(() => {
      setBurstInfo(null);
    }, 850);
  };

  return (
    <div className={css.inputSection}>
      <span className={css.inputHeading}>Rate this movie</span>

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

              {/* Star SVG */}
              <StarIcon
                size={30}
                fillPercent={fill}
                color="var(--color-star-input)"
                emptyColor="rgba(254, 243, 199, 0.2)"
              />

              {/* Tooltip bubble positioned over active star */}
              {isHoveredStar && (
                <div className={css.tooltip}>
                  {TOOLTIP_LABELS[hoverValue]} ({hoverValue} ★)
                </div>
              )}

              {/* Burst particles */}
              {isBursting && (
                <div className={css.burstContainer}>
                  {BURST_PARTICLES.map(p => (
                    <span
                      key={p.id}
                      className={css.burstParticle}
                      style={{
                        '--angle': p.angle,
                        '--dist': p.dist,
                        '--size': p.size,
                      }}
                    />
                  ))}
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
