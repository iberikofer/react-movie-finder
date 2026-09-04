import ClapperboardLoader from './ClapperboardLoader';

export const Loader = ({ caption = 'Loading scene...' }) => {
  return <ClapperboardLoader caption={caption} />;
};

export default Loader;
