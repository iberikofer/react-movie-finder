import React, { useId } from 'react';

export interface StarIconProps {
  fillPercent?: number;
  color?: string;
  emptyColor?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const StarIcon: React.FC<StarIconProps> = ({
  fillPercent = 100,
  color = '#f59e0b',
  emptyColor = 'rgba(254, 243, 199, 0.22)',
  size = 24,
  className = '',
  style = {},
}) => {
  const rawId = useId();
  const gradId = `star-grad-${rawId.replace(/:/g, '')}`;

  const clampedPercent = Math.max(0, Math.min(100, fillPercent));

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset={`${clampedPercent}%`} stopColor={color} />
          <stop offset={`${clampedPercent}%`} stopColor={emptyColor} />
        </linearGradient>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={`url(#${gradId})`}
        stroke={clampedPercent > 0 ? color : 'rgba(254, 243, 199, 0.3)'}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default StarIcon;
