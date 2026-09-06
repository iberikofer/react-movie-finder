import css from './ClapperboardLoader.module.css';

export const ClapperboardLoader = ({
  caption = 'Loading scene...',
  isCentered = false,
}) => {
  return (
    <div
      className={`${css.loaderWrapper} ${isCentered ? css.loaderWrapperCentered : ''}`}
      role="status"
      aria-label="Loading"
    >
      <div className={css.clapperboard}>
        <div className={css.clapperHinge} />
        <div className={css.clapperArm} />
        <div className={css.clapperBody}>
          <div className={css.boardLines}>
            <div className={css.boardLine} />
            <div className={`${css.boardLine} ${css.boardLineShort}`} />
          </div>
          <div className={css.boardGrid}>
            <span>SCENE 01</span>
            <span style={{ textAlign: 'right' }}>TAKE 01</span>
          </div>
        </div>
      </div>
      {caption && <p className={css.loaderCaption}>{caption}</p>}
    </div>
  );
};

export default ClapperboardLoader;
