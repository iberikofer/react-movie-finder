import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMovieDetails, getMovieWatchProviders } from 'fetch';
import { MovieDetails } from 'types';
import { useLanguage } from '../../context/LanguageContext';
import Loader from '../Loader/Loader';
import css from './MovieInfo.module.css';

interface WatchProviderItem {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority?: number;
}

interface CountryWatchProviders {
  link?: string;
  flatrate?: WatchProviderItem[];
  rent?: WatchProviderItem[];
  buy?: WatchProviderItem[];
}

const formatCurrency = (amount: number | undefined, notDisclosedText: string): string => {
  if (!amount || amount <= 0) return notDisclosedText;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatRuntime = (minutes: number | undefined, lang: string, unknownText: string): string => {
  if (!minutes || minutes <= 0) return unknownText;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (lang === 'uk') {
    if (hours === 0) return `${remainingMinutes} хв`;
    if (remainingMinutes === 0) return `${hours} год`;
    return `${hours} год ${remainingMinutes} хв`;
  }
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

const formatDate = (dateStr: string | undefined, lang: string, unknownText: string): string => {
  if (!dateStr) return unknownText;
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(lang === 'uk' ? 'uk-UA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
};

const POPULAR_LANGUAGES_EN: Record<string, string> = {
  en: 'English',
  uk: 'Ukrainian',
  ja: 'Japanese',
  ko: 'Korean',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  zh: 'Chinese',
  pl: 'Polish',
  pt: 'Portuguese',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  nl: 'Dutch',
  tr: 'Turkish',
  hi: 'Hindi',
  cs: 'Czech',
  el: 'Greek',
  he: 'Hebrew',
  ar: 'Arabic',
  ru: 'russian',
};

const POPULAR_LANGUAGES_UK: Record<string, string> = {
  en: 'Англійська',
  uk: 'Українська',
  ja: 'Японська',
  ko: 'Корейська',
  fr: 'Французька',
  de: 'Німецька',
  es: 'Іспанська',
  it: 'Італійська',
  zh: 'Китайська',
  pl: 'Польська',
  pt: 'Португальська',
  sv: 'Шведська',
  no: 'Норвезька',
  da: 'Данська',
  fi: 'Фінська',
  nl: 'Нідерландська',
  tr: 'Турецька',
  hi: 'Гінді',
  cs: 'Чеська',
  el: 'Грецька',
  he: 'Іврит',
  ar: 'Арабська',
  ru: 'російська',
};

const formatLanguageName = (code: string = '', lang: string, unknownText: string): string => {
  if (!code) return unknownText;
  const lower = code.toLowerCase();
  if (lower === 'ru') return lang === 'uk' ? 'російська' : 'russian';
  if (lang === 'uk' && POPULAR_LANGUAGES_UK[lower]) return POPULAR_LANGUAGES_UK[lower];
  if (lang !== 'uk' && POPULAR_LANGUAGES_EN[lower]) return POPULAR_LANGUAGES_EN[lower];
  try {
    const name = new Intl.DisplayNames([lang === 'uk' ? 'uk' : 'en'], { type: 'language' }).of(lower);
    if (lower === 'ru') return lang === 'uk' ? 'російська' : 'russian';
    return name || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
};

const getProviderHomeUrl = (name: string = ''): string => {
  const n = name.toLowerCase();
  if (n.includes('netflix')) return 'https://www.netflix.com';
  if (n.includes('amazon') || n.includes('prime')) return 'https://www.primevideo.com';
  if (n.includes('apple')) return 'https://tv.apple.com';
  if (n.includes('google')) return 'https://play.google.com/store/movies';
  if (n.includes('youtube')) return 'https://www.youtube.com';
  if (n.includes('disney')) return 'https://www.disneyplus.com';
  if (n.includes('max') || n.includes('hbo')) return 'https://www.max.com';
  if (n.includes('hulu')) return 'https://www.hulu.com';
  if (n.includes('peacock')) return 'https://www.peacocktv.com';
  if (n.includes('paramount')) return 'https://www.paramountplus.com';
  if (n.includes('fandango') || n.includes('vudu')) return 'https://www.vudu.com';
  if (n.includes('megogo')) return 'https://megogo.net';
  if (n.includes('sweet.tv') || n.includes('sweet tv')) return 'https://sweet.tv';
  if (n.includes('kyivstar')) return 'https://tv.kyivstar.ua';
  if (n.includes('rakuten')) return 'https://www.rakuten.tv';
  if (n.includes('crunchyroll')) return 'https://www.crunchyroll.com';
  if (n.includes('tubi')) return 'https://tubitv.com';
  if (n.includes('pluto')) return 'https://pluto.tv';
  if (n.includes('mubi')) return 'https://mubi.com';
  if (n.includes('criterion')) return 'https://www.criterionchannel.com';
  if (n.includes('shudder')) return 'https://www.shudder.com';
  return `https://www.google.com/search?q=${encodeURIComponent(name + ' streaming')}`;
};

export const MovieInfo: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const { language, t } = useLanguage();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [providersData, setProvidersData] = useState<{ results?: Record<string, CountryWatchProviders> } | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const movieRef = useRef(movie);
  movieRef.current = movie;
  const prevLangRef = useRef<string>(language);
  const hasDataRef = useRef<boolean>(false);

  useEffect(() => {
    if (!movieId) return;
    let isMounted = true;
    const isLangChange = prevLangRef.current !== language;
    prevLangRef.current = language;

    if (!hasDataRef.current || (isLangChange && !hasDataRef.current)) {
      setIsLoading(true);
    } else if (isLangChange && hasDataRef.current) {
      setIsTranslating(true);
    }

    const fetchData = async () => {
      const startTime = Date.now();
      try {
        const [details, providers] = await Promise.all([
          getMovieDetails(movieId),
          getMovieWatchProviders(movieId).catch(() => ({ results: {} })),
        ]);

        if (isLangChange && hasDataRef.current) {
          const elapsed = Date.now() - startTime;
          if (elapsed < 420) {
            await new Promise(resolve => setTimeout(resolve, 420 - elapsed));
          }
        }

        if (!isMounted) return;
        setMovie(details);
        setProvidersData(providers);
        hasDataRef.current = true;

        const availableCountries = Object.keys(providers?.results || {});
        let detectedCountry = 'US';

        try {
          const browserLang = navigator.language || 'en-US';
          const parts = browserLang.split('-');
          if (parts.length > 1) {
            const countryCode = parts[1].toUpperCase();
            if (availableCountries.includes(countryCode)) {
              detectedCountry = countryCode;
            }
          }
        } catch (e) {
          console.warn('Could not detect country from browser locale:', e);
        }

        if (!availableCountries.includes(detectedCountry) && availableCountries.length > 0) {
          detectedCountry = availableCountries[0];
        }

        setSelectedCountry(detectedCountry);
      } catch (error) {
        console.error('Failed to load movie info & providers:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsTranslating(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [movieId, language]);

  const countryOptions = useMemo(() => {
    if (!providersData?.results) return [];
    const regionNames = new Intl.DisplayNames([language === 'uk' ? 'uk' : 'en'], { type: 'region' });

    return Object.keys(providersData.results)
      .map(code => {
        let name = code;
        try {
          name = regionNames.of(code) || code;
        } catch {
          name = code;
        }
        return { code, name };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [providersData, language]);

  const getLocalizedStatus = (statusStr?: string) => {
    if (!statusStr) return t('status.released');
    const s = statusStr.toLowerCase();
    if (s.includes('returning')) return t('status.returningSeries');
    if (s.includes('ended')) return t('status.ended');
    if (s.includes('released')) return t('status.released');
    if (s.includes('in production')) return t('status.inProduction');
    if (s.includes('post production')) return t('status.postProduction');
    if (s.includes('planned')) return t('status.planned');
    if (s.includes('canceled')) return t('status.canceled');
    if (s.includes('pilot')) return t('status.pilot');
    return statusStr;
  };

  const formatSeasonsLabel = (seasons: number, episodes: number) => {
    if (language === 'uk') {
      let seasonsWord = 'сезонів';
      const mod10 = seasons % 10;
      const mod100 = seasons % 100;
      if (mod10 === 1 && mod100 !== 11) seasonsWord = 'сезон';
      else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) seasonsWord = 'сезони';

      let episodesWord = 'серій';
      const epMod10 = episodes % 10;
      const epMod100 = episodes % 100;
      if (epMod10 === 1 && epMod100 !== 11) episodesWord = 'серія';
      else if (epMod10 >= 2 && epMod10 <= 4 && (epMod100 < 10 || epMod100 >= 20)) episodesWord = 'серії';

      return `${seasons} ${seasonsWord} • ${episodes} ${episodesWord}`;
    }
    return `${seasons} ${seasons === 1 ? 'Season' : 'Seasons'} • ${episodes} Episodes`;
  };

  if (isLoading && !isTranslating) {
    return <Loader caption={t('movieInfo.loading')} />;
  }

  if (!movie) {
    return (
      <div className={css.infoSection}>
        <div className={css.emptyState}>
          <span className={css.emptyIcon}>ℹ️</span>
          <p className={css.emptyText}>{t('movieInfo.unavailable')}</p>
        </div>
      </div>
    );
  }

  const isTvShow = Boolean(movie.number_of_seasons || movie.first_air_date);
  const runtimeDisplay = isTvShow
    ? movie.episode_run_time && (movie.episode_run_time as number[]).length > 0
      ? `${formatRuntime((movie.episode_run_time as number[])[0], language, t('movieInfo.unknown'))} / ep`
      : t('movieInfo.variesByEpisode')
    : formatRuntime(movie.runtime, language, t('movieInfo.unknown'));

  const budget = movie.budget || 0;
  const revenue = movie.revenue || 0;
  const hasFinancials = budget > 0 && revenue > 0;
  const profit = revenue - budget;
  const roi = hasFinancials ? Math.round(((revenue - budget) / budget) * 100) : null;

  const currentCountryData = providersData?.results?.[selectedCountry] || null;
  const streamProviders = currentCountryData?.flatrate || [];
  const rentProviders = currentCountryData?.rent || [];
  const buyProviders = currentCountryData?.buy || [];
  const justWatchLink = currentCountryData?.link || null;
  const hasAnyProviders =
    streamProviders.length > 0 || rentProviders.length > 0 || buyProviders.length > 0;

  return (
    <div style={{ position: 'relative' }}>
      {/* Translating overlay */}
      <div
        className={`${css.translatingOverlay} ${
          isTranslating ? css.translatingActive : css.translatingHidden
        }`}
        aria-hidden={!isTranslating}
        aria-live="polite"
      >
        <Loader
          label={t('movie.translatingSlate', 'TRANSLATE')}
          caption={t('movie.translating', 'Translating...')}
        />
      </div>
      <section className={css.infoSection} aria-label={isTvShow ? t('movieInfo.aboutSeriesTitle') : t('movieInfo.aboutMovieTitle')}>
      <div className={css.headerRow}>
        <h2 className={css.sectionTitle}>
          <span className={css.titleIcon}>ℹ️</span>{' '}
          {isTvShow ? t('movieInfo.aboutSeriesTitle') : t('movieInfo.aboutMovieTitle')}
        </h2>
      </div>

      {Boolean(movie.tagline && movie.tagline.trim()) && (
        <div className={`${css.factCard} ${css.taglineCard}`}>
          <span className={css.factLabel}>💬 {t('movieInfo.tagline')}</span>
          <span className={css.taglineValue}>"{movie.tagline?.trim()}"</span>
        </div>
      )}

      <div className={css.blockSubheader}>
        <span className={css.subIcon}>⚡</span>
        <h3 className={css.subTitle}>{t('movieInfo.quickFacts')}</h3>
      </div>

      <div className={css.factsGrid}>

        <div className={css.factCard}>
          <span className={css.factLabel}>🔞 {t('movieInfo.ageRestriction')}</span>
          <span className={css.factValue}>
            {movie.age_rating ? movie.age_rating : t('movieInfo.ageUnavailable')}
          </span>
        </div>

        <div className={css.factCard}>
          <span className={css.factLabel}>⏱️ {t('movieInfo.runtime')}</span>
          <span className={css.factValue}>{runtimeDisplay}</span>
        </div>

        <div className={css.factCard}>
          <span className={css.factLabel}>💰 {t('movieInfo.budget')}</span>
          <span className={css.factValue}>
            {isTvShow ? t('movieInfo.tvBudget') : formatCurrency(budget, t('movieInfo.notDisclosed'))}
          </span>
        </div>

        <div className={css.factCard}>
          <span className={css.factLabel}>🎟️ {t('movieInfo.boxOffice')}</span>
          <span className={css.factValue}>
            {isTvShow ? t('movieInfo.tvRevenue') : formatCurrency(revenue, t('movieInfo.notDisclosed'))}
          </span>
        </div>

        <div className={css.factCard}>
          <span className={css.factLabel}>📌 {t('movieInfo.status')}</span>
          <span className={css.statusBadge}>{getLocalizedStatus(movie.status)}</span>
        </div>

        <div className={css.factCard}>
          <span className={css.factLabel}>📅 {t('movieInfo.releaseDate')}</span>
          <span className={css.factValue}>
            {formatDate(movie.release_date || movie.first_air_date, language, t('movieInfo.unknown'))}
          </span>
        </div>

        {hasFinancials && roi !== null && (
          <div className={css.factCard}>
            <span className={css.factLabel}>📈 {t('movieInfo.profitability')}</span>
            <div className={css.roiWrapper}>
              <span
                className={`${css.roiBadge} ${
                  profit >= 0 ? css.roiPositive : css.roiNegative
                }`}
              >
                {profit >= 0 ? `+${roi}% ROI` : `${roi}% ROI`}
              </span>
              <span className={css.profitValue}>
                ({profit >= 0 ? `+${formatCurrency(profit, t('movieInfo.notDisclosed'))}` : `-${formatCurrency(Math.abs(profit), t('movieInfo.notDisclosed'))}`})
              </span>
            </div>
          </div>
        )}

        {isTvShow && (
          <div className={css.factCard}>
            <span className={css.factLabel}>📺 {t('movieInfo.seasonsAndEpisodes')}</span>
            <span className={css.factValue}>
              {formatSeasonsLabel(movie.number_of_seasons || 0, movie.number_of_episodes || 0)}
            </span>
          </div>
        )}

        {movie.production_countries && movie.production_countries.length > 0 && (
          <div className={css.factCard}>
            <span className={css.factLabel}>🌍 {t('movieInfo.countries')}</span>
            <span className={css.factValue}>
              {movie.production_countries.map(c => c.name).join(', ')}
            </span>
          </div>
        )}

        {movie.original_language && (
          <div className={css.factCard}>
            <span className={css.factLabel}>🗣️ {t('movieInfo.language')}</span>
            <span className={css.factValue}>
              {formatLanguageName(movie.original_language, language, t('movieInfo.unknown'))}{' '}
              <span className={css.langCodeBadge}>
                ({movie.original_language.toLowerCase() === 'ru' ? 'ru' : movie.original_language.toUpperCase()})
              </span>
            </span>
          </div>
        )}

        <div className={css.factCard}>
          <span className={css.factLabel}>🌐 {t('movieInfo.homepage')}</span>
          <span className={css.factValue}>
            {movie.homepage ? (
              <a href={movie.homepage} target="_blank" rel="noopener noreferrer" className={css.homepageLink}>
                {t('movieInfo.visitWebsite')}
              </a>
            ) : (
              <span className={css.textMuted}>{t('movieInfo.noWebsite')}</span>
            )}
          </span>
        </div>

        {isTvShow && movie.networks && (movie.networks as any[]).length > 0 && (
          <div className={`${css.factCard} ${css.wideCard}`}>
            <span className={css.factLabel}>📡 {t('movieInfo.networks')}</span>
            <div className={css.companiesRow}>
              {(movie.networks as any[]).map((net: any) => (
                <a
                  key={net.id}
                  href={`https://www.google.com/search?q=${encodeURIComponent(net.name + ' tv network')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css.companyItem}
                  title={t('movieInfo.searchOnGoogle', 'Search {query} on Google').replace('{query}', net.name)}
                >
                  {net.logo_path ? (
                    <div className={css.logoBox}>
                      <img
                        src={`https://image.tmdb.org/t/p/w154${net.logo_path}`}
                        alt={net.name}
                        className={css.companyLogo}
                      />
                    </div>
                  ) : null}
                  <span className={css.companyName}>{net.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {movie.production_companies && movie.production_companies.length > 0 && (
          <div className={`${css.factCard} ${css.wideCard}`}>
            <span className={css.factLabel}>🏢 {t('movieInfo.companies')}</span>
            <div className={css.companiesRow}>
              {movie.production_companies.map(comp => (
                <a
                  key={comp.id}
                  href={`https://www.google.com/search?q=${encodeURIComponent(comp.name + ' production company')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css.companyItem}
                  title={t('movieInfo.searchOnGoogle', 'Search {query} on Google').replace('{query}', comp.name)}
                >
                  {comp.logo_path ? (
                    <div className={css.logoBox}>
                      <img
                        src={`https://image.tmdb.org/t/p/w154${comp.logo_path}`}
                        alt={comp.name}
                        className={css.companyLogo}
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <span className={css.companyName}>{comp.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}


      </div>

      <div className={css.whereToWatchSection}>
        <div className={css.watchHeaderRow}>
          <div className={css.blockSubheader}>
            <span className={css.subIcon}>🎬</span>
            <h3 className={css.subTitle}>{t('movieInfo.whereToWatch')}</h3>
          </div>

          {countryOptions.length > 0 && (
            <div className={css.countrySelectorCol}>
              <div className={css.countrySelectorWrapper}>
                <label htmlFor="countrySelect" className={css.selectorLabel}>
                  {t('movieInfo.region')}
                </label>
                <select
                  id="countrySelect"
                  value={selectedCountry}
                  onChange={e => setSelectedCountry(e.target.value)}
                  className={css.countrySelect}
                >
                  {countryOptions.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              {language === 'uk' && (
                <span className={css.uaRegionNotice}>
                  {t('movieInfo.uaRegionNote')}
                </span>
              )}
            </div>
          )}
        </div>

        {hasAnyProviders ? (
          <div className={css.providersContainer}>
            {streamProviders.length > 0 && (
              <div className={css.categoryBlock}>
                <h4 className={css.categoryTitle}>
                  <span className={css.categoryIcon}>📺</span> {t('movieInfo.stream')}
                </h4>
                <div className={css.providerList}>
                  {streamProviders.map(prov => (
                    <a
                      key={prov.provider_id}
                      href={getProviderHomeUrl(prov.provider_name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={css.providerCard}
                      title={t('movieInfo.openProviderWebsite', 'Open {provider} official website (opens in new tab)').replace('{provider}', prov.provider_name)}
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w92${prov.logo_path}`}
                        alt={prov.provider_name}
                        className={css.providerLogo}
                      />
                      <span className={css.providerName}>{prov.provider_name}</span>
                      <span className={css.providerLinkIcon} aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {rentProviders.length > 0 && (
              <div className={css.categoryBlock}>
                <h4 className={css.categoryTitle}>
                  <span className={css.categoryIcon}>🎟️</span> {t('movieInfo.rent')}
                </h4>
                <div className={css.providerList}>
                  {rentProviders.map(prov => (
                    <a
                      key={prov.provider_id}
                      href={getProviderHomeUrl(prov.provider_name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={css.providerCard}
                      title={t('movieInfo.openProviderWebsite', 'Open {provider} official website (opens in new tab)').replace('{provider}', prov.provider_name)}
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w92${prov.logo_path}`}
                        alt={prov.provider_name}
                        className={css.providerLogo}
                      />
                      <span className={css.providerName}>{prov.provider_name}</span>
                      <span className={css.providerLinkIcon} aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {buyProviders.length > 0 && (
              <div className={css.categoryBlock}>
                <h4 className={css.categoryTitle}>
                  <span className={css.categoryIcon}>💳</span> {t('movieInfo.buy')}
                </h4>
                <div className={css.providerList}>
                  {buyProviders.map(prov => (
                    <a
                      key={prov.provider_id}
                      href={getProviderHomeUrl(prov.provider_name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={css.providerCard}
                      title={t('movieInfo.openProviderWebsite', 'Open {provider} official website (opens in new tab)').replace('{provider}', prov.provider_name)}
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w92${prov.logo_path}`}
                        alt={prov.provider_name}
                        className={css.providerLogo}
                      />
                      <span className={css.providerName}>{prov.provider_name}</span>
                      <span className={css.providerLinkIcon} aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {justWatchLink && (
              <div className={css.attributionRow}>
                <a
                  href={justWatchLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css.justWatchLink}
                >
                  {t('movieInfo.viewOnJustWatch')} ↗
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className={css.noProvidersNotice}>
            <span className={css.noProvidersIcon}>📡</span>
            <p className={css.noProvidersText}>
              {t('movieInfo.noProviders')}
            </p>
          </div>
        )}
      </div>
    </section>
    </div>
  );
};

export default MovieInfo;
