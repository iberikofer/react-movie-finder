import { useState, useEffect } from 'react';
import css from './ScrollToTop.module.css';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = document.documentElement.scrollTop || window.pageYOffset;
      if (scrolled > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
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
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </>
  );
};

export default ScrollToTop;
