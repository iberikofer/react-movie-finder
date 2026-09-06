import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getMovieDetails, getMovieWatchProviders } from 'fetch';
import Loader from '../Loader/Loader';
import css from './MovieInfo.module.css';

// Format USD currency with full separators ($165,000,000)
const formatCurrency = amount => {
  if (!amount || amount <= 0) return 'Not disclosed';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format minutes into "2h 19m"
const formatRuntime = minutes => {
  if (!minutes || minutes <= 0) return 'Unknown';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

// Format release date nicely (e.g. "October 15, 1999")
const formatDate = dateStr => {
  if (!dateStr) return 'Unknown';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
};

// Popular world languages with word names (and strictly lowercase 'russian' as requested)
const POPULAR_LANGUAGES = {
  en: 'English',
  uk: 'Ukrainian',
  ja: 'Japan (Japanese)',
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

const formatLanguageName = (code = '') => {
  if (!code) return 'Unknown';
  const lower = code.toLowerCase();
  if (lower === 'ru') return 'russian';
  if (POPULAR_LANGUAGES[lower]) return POPULAR_LANGUAGES[lower];
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(lower);
    if (lower === 'ru') return 'russian';
    return name || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
};

// Direct official homepages for streaming/rental services
const getProviderHomeUrl = (name = '') => {
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

export const MovieInfo = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [providersData, setProvidersData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchData = async () => {
      try {
        const [details, providers] = await Promise.all([
          getMovieDetails(movieId),
          getMovieWatchProviders(movieId).catch(() => ({ results: {} })),
        ]);

        if (!isMounted) return;
        setMovie(details);
        setProvidersData(providers);

        // Auto-detect country based on browser language/locale
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

        // Fallback to first available country if default detected not found
        if (!availableCountries.includes(detectedCountry) && availableCountries.length > 0) {
          detectedCountry = availableCountries[0];
        }

        setSelectedCountry(detectedCountry);
      } catch (error) {
        console.error('Failed to load movie info & providers:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [movieId]);

  // List of available countries sorted with display names
  const countryOptions = useMemo(() => {
    if (!providersData?.results) return [];
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

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
  }, [providersData]);

  if (isLoading) {
    return <Loader caption="Loading movie facts & streaming providers..." />;
  }

  if (!movie) {
    return (
      <div className={css.infoSection}>
        <div className={css.emptyState}>
          <span className={css.emptyIcon}>ℹ️</span>
          <p className={css.emptyText}>Movie information is currently unavailable.</p>
        </div>
      </div>
    );
  }

  // Extract quick facts
  const isTvShow = Boolean(movie.number_of_seasons || movie.first_air_date);
  const runtimeDisplay = isTvShow
    ? movie.episode_run_time && movie.episode_run_time.length > 0
      ? `${formatRuntime(movie.episode_run_time[0])} / ep`
      : 'Varies by episode'
    : formatRuntime(movie.runtime);

  const budget = movie.budget || 0;
  const revenue = movie.revenue || 0;
  const hasFinancials = budget > 0 && revenue > 0;
  const profit = revenue - budget;
  const roi = hasFinancials ? Math.round(((revenue - budget) / budget) * 100) : null;

  // Selected country providers
  const currentCountryData = providersData?.results?.[selectedCountry] || null;
  const streamProviders = currentCountryData?.flatrate || [];
  const rentProviders = currentCountryData?.rent || [];
  const buyProviders = currentCountryData?.buy || [];
  const justWatchLink = currentCountryData?.link || null;
  const hasAnyProviders =
    streamProviders.length > 0 || rentProviders.length > 0 || buyProviders.length > 0;

  return (
    <section className={css.infoSection} aria-label="Movie facts and watch providers">
      <div className={css.headerRow}>
        <h2 className={css.sectionTitle}>
          <span className={css.titleIcon}>ℹ️</span>{' '}
          {isTvShow ? 'Show Info & Where to Watch' : 'Movie Info & Where to Watch'}
        </h2>
      </div>

      <div className={css.blockSubheader}>
        <span className={css.subIcon}>⚡</span>
        <h3 className={css.subTitle}>Quick Facts</h3>
      </div>

      <div className={css.factsGrid}>
        <div className={`${css.factCard} ${css.taglineCard}`}>
          <span className={css.factLabel}>💬 Tagline</span>
          <span className={css.taglineValue}>
            {movie.tagline ? `"${movie.tagline}"` : 'No official tagline'}
          </span>
        </div>

        <div className={css.factCard}>
          <span className={css.factLabel}>⏱️ Runtime</span>
          <span className={css.factValue}>{runtimeDisplay}</span>
        </div>

        <div className={css.factCard}>
          <span className={css.factLabel}>💰 Budget</span>
          <span className={css.factValue}>
            {isTvShow ? 'TV Series budget' : formatCurrency(budget)}
          </span>
        </div>

        <div className={css.factCard}>
          <span className={css.factLabel}>🎟️ Box Office Revenue</span>
          <span className={css.factValue}>
            {isTvShow ? 'Broadcast / Streaming' : formatCurrency(revenue)}
          </span>
        </div>

        <div className={css.factCard}>
          <span className={css.factLabel}>📌 Status</span>
          <span className={css.statusBadge}>{movie.status || 'Released'}</span>
        </div>

        <div className={css.factCard}>
          <span className={css.factLabel}>📅 Release Date</span>
          <span className={css.factValue}>
            {formatDate(movie.release_date || movie.first_air_date)}
          </span>
        </div>

        {hasFinancials && (
          <div className={css.factCard}>
            <span className={css.factLabel}>📈 Profitability & ROI</span>
            <div className={css.roiWrapper}>
              <span
                className={`${css.roiBadge} ${
                  profit >= 0 ? css.roiPositive : css.roiNegative
                }`}
              >
                {profit >= 0 ? `+${roi}% ROI` : `${roi}% ROI`}
              </span>
              <span className={css.profitValue}>
                ({profit >= 0 ? `+${formatCurrency(profit)}` : `-${formatCurrency(Math.abs(profit))}`})
              </span>
            </div>
          </div>
        )}

        {isTvShow && (
          <>
            <div className={css.factCard}>
              <span className={css.factLabel}>📺 Seasons & Episodes</span>
              <span className={css.factValue}>
                {movie.number_of_seasons} {movie.number_of_seasons === 1 ? 'Season' : 'Seasons'} •{' '}
                {movie.number_of_episodes} Episodes
              </span>
            </div>

            {movie.networks && movie.networks.length > 0 && (
              <div className={`${css.factCard} ${css.wideCard}`}>
                <span className={css.factLabel}>📡 Original Networks</span>
                <div className={css.companiesRow}>
                  {movie.networks.map(net => (
                    <div key={net.id} className={css.companyItem}>
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {movie.production_companies && movie.production_companies.length > 0 && (
          <div className={`${css.factCard} ${css.wideCard}`}>
            <span className={css.factLabel}>🏢 Production Companies</span>
            <div className={css.companiesRow}>
              {movie.production_companies.map(comp => (
                <div key={comp.id} className={css.companyItem}>
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
                </div>
              ))}
            </div>
          </div>
        )}

        {movie.production_countries && movie.production_countries.length > 0 && (
          <div className={css.factCard}>
            <span className={css.factLabel}>🌍 Production Countries</span>
            <span className={css.factValue}>
              {movie.production_countries.map(c => c.name).join(', ')}
            </span>
          </div>
        )}

        {movie.original_language && (
          <div className={css.factCard}>
            <span className={css.factLabel}>🗣️ Original Language</span>
            <span className={css.factValue}>
              {formatLanguageName(movie.original_language)}{' '}
              <span className={css.langCodeBadge}>
                ({movie.original_language.toLowerCase() === 'ru' ? 'ru' : movie.original_language.toUpperCase()})
              </span>
            </span>
          </div>
        )}
      </div>

      <div className={css.whereToWatchSection}>
        <div className={css.watchHeaderRow}>
          <div className={css.blockSubheader}>
            <span className={css.subIcon}>🎬</span>
            <h3 className={css.subTitle}>Where to Watch</h3>
          </div>

          {countryOptions.length > 0 && (
            <div className={css.countrySelectorWrapper}>
              <label htmlFor="countrySelect" className={css.selectorLabel}>
                Region:
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
          )}
        </div>

        {hasAnyProviders ? (
          <div className={css.providersContainer}>
            {streamProviders.length > 0 && (
              <div className={css.categoryBlock}>
                <h4 className={css.categoryTitle}>
                  <span className={css.categoryIcon}>📺</span> Stream (Subscription)
                </h4>
                <div className={css.providerList}>
                  {streamProviders.map(prov => (
                    <a
                      key={prov.provider_id}
                      href={getProviderHomeUrl(prov.provider_name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={css.providerCard}
                      title={`Open ${prov.provider_name} official website (opens in new tab)`}
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
                  <span className={css.categoryIcon}>🎟️</span> Rent
                </h4>
                <div className={css.providerList}>
                  {rentProviders.map(prov => (
                    <a
                      key={prov.provider_id}
                      href={getProviderHomeUrl(prov.provider_name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={css.providerCard}
                      title={`Open ${prov.provider_name} official website (opens in new tab)`}
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
                  <span className={css.categoryIcon}>💳</span> Buy
                </h4>
                <div className={css.providerList}>
                  {buyProviders.map(prov => (
                    <a
                      key={prov.provider_id}
                      href={getProviderHomeUrl(prov.provider_name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={css.providerCard}
                      title={`Open ${prov.provider_name} official website (opens in new tab)`}
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
                  View streaming options on JustWatch / TMDB ↗
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className={css.noProvidersNotice}>
            <span className={css.noProvidersIcon}>📡</span>
            <p className={css.noProvidersText}>
              No streaming or rental providers are listed for {selectedCountry || 'this region'}.
              Try selecting another country from the dropdown above.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default MovieInfo;
