import ClapperboardLoader from './ClapperboardLoader';

export const Loader = ({ caption = 'Loading scene...', isCentered = false }) => {
  return <ClapperboardLoader caption={caption} isCentered={isCentered} />;
};

export default Loader;
