import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import css from './NotFound.module.css';

export const NotFound: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className={css.notFoundWrapper}>
      <div className={css.content}>
        <h1 className={css.errorCode}>{t('notFound.title', '404')}</h1>
        <h2 className={css.errorMessage}>{t('notFound.message', 'Oops, this page is not found =(')}</h2>
        <p className={css.description}>
          {t('notFound.description', 'The movie or page you are looking for might have been moved or deleted.')}
        </p>
        <Link to="/" className={css.homeBtn}>
          {t('notFound.goHome', 'Go back to Home page')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
