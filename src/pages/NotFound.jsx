import { Link } from 'react-router-dom';
import css from './NotFound.module.css';

export const NotFound = () => {
  return (
    <div className={css.notFoundWrapper}>
      <div className={css.content}>
        <h1 className={css.errorCode}>404</h1>
        <h2 className={css.errorMessage}>Oops, this page is not found =(</h2>
        <p className={css.description}>
          The movie or page you are looking for might have been moved or
          deleted.
        </p>
        <Link to="/" className={css.homeBtn}>
          Go back to Home page
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
