import ClapperboardLoader from './ClapperboardLoader';

export const Loader = ({
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
