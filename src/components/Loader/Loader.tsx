import React from 'react';
import ClapperboardLoader from './ClapperboardLoader';
import { useLanguage } from '../../context/LanguageContext';

export interface LoaderProps {
  caption?: string;
  isCentered?: boolean;
  label?: string;
  title?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  caption,
  isCentered = false,
  label,
  title,
}) => {
  const { t } = useLanguage();
  const displayCaption = caption !== undefined ? caption : t('loader.default', 'Loading scene...');

  return (
    <ClapperboardLoader
      caption={displayCaption}
      isCentered={isCentered}
      label={label || title}
    />
  );
};

export default Loader;
