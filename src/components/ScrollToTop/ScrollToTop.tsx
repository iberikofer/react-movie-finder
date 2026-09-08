import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import css from './ScrollToTop.module.css';

export const ScrollToTop: React.FC = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrolled > 300);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          className={css.scrollBtn}
          onClick={scrollToTop}
          type="button"
          title={t('common.scrollToTop', 'Scroll to top')}
          aria-label={t('common.scrollToTop', 'Scroll to top')}
        >
          ↑
        </button>
      )}
    </>
  );
};

export default ScrollToTop;
