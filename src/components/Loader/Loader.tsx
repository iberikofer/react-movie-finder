import React from 'react';
import ClapperboardLoader from './ClapperboardLoader';

export interface LoaderProps {
  caption?: string;
  isCentered?: boolean;
  label?: string;
  title?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  caption = 'Loading scene...',
  isCentered = false,
  label,
  title,
}) => {
  return (
    <ClapperboardLoader
      caption={caption}
      isCentered={isCentered}
      label={label || title}
    />
  );
};

export default Loader;
