import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import css from './LanguageToggle.module.css';

export const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();

  // If English is active, display UA (offering switch to Ukrainian)
  // If Ukrainian is active, display EN (offering switch to English)
  const buttonLabel = language === 'en' ? 'UA' : 'EN';
  const buttonTitle =
    language === 'en'
      ? 'Перемкнути на українську мову'
      : 'Switch to English language';

  return (
    <button
      type="button"
      className={`${css.langToggleBtn} ${language === 'en' ? css.uaTheme : ''}`}
      onClick={toggleLanguage}
      title={buttonTitle}
      aria-label={buttonTitle}
    >
      <span className={css.globeIcon} role="img" aria-hidden="true">
        🌐
      </span>
      <span className={css.langLabel}>{buttonLabel}</span>
    </button>
  );
};

export default LanguageToggle;
