import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMovieVideos } from 'fetch';
import { VideoTrailer } from 'types';
import { useLanguage } from '../../context/LanguageContext';
import Loader from '../Loader/Loader';
import css from './Videos.module.css';

const checkPlayable = (key: string): Promise<boolean> => {
  return new Promise(resolve => {
    const img = new Image();
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(false);
      }
    }, 2500);

    img.onload = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(img.naturalWidth > 120);
      }
    };
    img.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(false);
      }
    };
    img.src = `https://img.youtube.com/vi/${key}/mqdefault.jpg`;
  });
};

export const formatVideoTitle = (
  rawTitle: string | undefined,
  type: string | undefined,
  language: string
): string => {
  if (!rawTitle && !type) return '';
  const text = (rawTitle || type || '').trim();
  if (language !== 'uk') {
    return text;
  }

  // If text already contains Ukrainian/Cyrillic characters, return as is (provided by TMDB)
  if (/[а-яА-ЯіїєґІЇЄҐ]/.test(text)) {
    return text;
  }

  const lower = text.toLowerCase();

  // Exact matches
  if (lower === 'official trailer') return 'Офіційний трейлер';
  if (lower === 'teaser trailer') return 'Тизер-трейлер';
  if (lower === 'official teaser') return 'Офіційний тизер';
  if (lower === 'final trailer') return 'Фінальний трейлер';
  if (lower === 'main trailer') return 'Головний трейлер';
  if (lower === 'trailer') return 'Трейлер';
  if (lower === 'teaser') return 'Тизер';
  if (lower === 'clip') return 'Уривок';
  if (lower === 'first look clip' || lower === 'first look') return 'Уривок «Перший погляд»';
  if (lower === 'sneak peek') return 'Ексклюзивний фрагмент';
  if (lower === 'behind the scenes') return 'За лаштунками';
  if (lower === 'featurette') return 'Про створення';
  if (lower === 'bloopers') return 'Невдалі дублі';

  // Compound / Substring replacements
  let translated = text
    .replace(/\bOfficial Teaser Trailer\b/gi, 'Офіційний тизер-трейлер')
    .replace(/\bOfficial Trailer\b/gi, 'Офіційний трейлер')
    .replace(/\bTeaser Trailer\b/gi, 'Тизер-трейлер')
    .replace(/\bOfficial Teaser\b/gi, 'Офіційний тизер')
    .replace(/\bFinal Trailer\b/gi, 'Фінальний трейлер')
    .replace(/\bMain Trailer\b/gi, 'Головний трейлер')
    .replace(/\bExclusive Official Clip\b/gi, 'Ексклюзивний офіційний уривок')
    .replace(/\bOfficial Clip\b/gi, 'Офіційний уривок')
    .replace(/\bExclusive Clip\b/gi, 'Ексклюзивний уривок')
    .replace(/\bFirst Look Clip\b/gi, 'Уривок «Перший погляд»')
    .replace(/\bBehind the Scenes\b/gi, 'За лаштунками')
    .replace(/\bFeaturette\b/gi, 'Про створення')
    .replace(/\bSneak Peek\b/gi, 'Ексклюзивний фрагмент')
    .replace(/\bBloopers\b/gi, 'Невдалі дублі')
    .replace(/\bTrailer\s+(\d+)\b/gi, 'Трейлер $1')
    .replace(/\bTeaser\s+(\d+)\b/gi, 'Тизер $1')
    .replace(/\bClip\s+(\d+)\b/gi, 'Уривок $1');

  return translated;
};

export const Videos: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const { language, t } = useLanguage();
  const [video, setVideo] = useState<VideoTrailer | null>(null);
  const [availableVideos, setAvailableVideos] = useState<VideoTrailer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);
  const hasVideoRef = useRef(false);
  hasVideoRef.current = Boolean(video || availableVideos.length > 0);

  const handleSelectVideo = (selected: VideoTrailer) => {
    if (!selected || selected.key === video?.key) {
      return;
    }
    setIsIframeLoaded(false);
    setVideo(selected);
    if (movieId && selected.key) {
      sessionStorage.setItem(`video_selected_key_${movieId}`, selected.key);
    }
  };

  useEffect(() => {
    setIsIframeLoaded(false);
    const fallbackTimer = setTimeout(() => {
      setIsIframeLoaded(true);
    }, 2500);
    return () => clearTimeout(fallbackTimer);
  }, [video?.key]);

  useEffect(() => {
    const handleVideosTabClick = (e: Event) => {
      const customEvent = e as CustomEvent<{ movieId?: string }>;
      if (!customEvent.detail?.movieId || String(customEvent.detail.movieId) === String(movieId)) {
        if (movieId) {
          sessionStorage.removeItem(`video_selected_key_${movieId}`);
        }
        if (availableVideos.length > 0) {
          const first = availableVideos[0];
          if (first.key !== video?.key) {
            setIsIframeLoaded(false);
            setVideo(first);
          }
        }
      }
    };

    window.addEventListener('videos_tab_click', handleVideosTabClick);
    return () => {
      window.removeEventListener('videos_tab_click', handleVideosTabClick);
    };
  }, [movieId, availableVideos, video?.key]);

  const prevLangRef = useRef(language);
  useEffect(() => {
    if (prevLangRef.current !== language) {
      prevLangRef.current = language;
      if (movieId) {
        sessionStorage.removeItem(`video_selected_key_${movieId}`);
      }
    }
  }, [language, movieId]);

  useEffect(() => {
    if (!movieId) return;
    let isMounted = true;
    if (!hasVideoRef.current) {
      setIsLoading(true);
    }

    const fetchVideos = async () => {
      try {
        const data = await getMovieVideos(movieId);
        if (!isMounted) return;

        const results = data.results || [];
        const youtubeVideos = results.filter(v => v.site === 'YouTube' && v.key);

        // Filter out private or deleted videos via thumbnail liveness check
        const checkedList = await Promise.all(
          youtubeVideos.map(async v => ({
            video: v,
            playable: await checkPlayable(v.key),
          }))
        );

        if (!isMounted) return;

        const playableVideos = checkedList.filter(item => item.playable).map(item => item.video);
        const candidateVideos = playableVideos.length > 0 ? playableVideos : youtubeVideos;

        const rankVideo = (v: VideoTrailer): number => {
          let score = 0;
          const isUk = language === 'uk';
          const nameLower = (v.name || '').toLowerCase();

          if (isUk) {
            if (v.iso_639_1 === 'uk') score += 100;
            if (nameLower.includes('україн') || nameLower.includes('ukrain')) score += 50;
          }

          if (v.type === 'Trailer') score += 30;
          else if (v.type === 'Teaser') score += 20;
          else if (v.type === 'Clip') score += 10;
          else score += 5;

          if (v.official === true) score += 10;
          if (nameLower.includes('official')) score += 5;

          return score;
        };

        const sorted = [...candidateVideos].sort((a, b) => rankVideo(b) - rankVideo(a));

        setAvailableVideos(sorted);

        // Restore previously selected video from sessionStorage if available
        const savedKey = movieId
          ? sessionStorage.getItem(`video_selected_key_${movieId}`) ||
            sessionStorage.getItem(`trailer_selected_key_${movieId}`)
          : null;
        const selectedFromStorage = savedKey
          ? sorted.find(v => v.key === savedKey || v.id === savedKey)
          : null;
        const chosen = selectedFromStorage || sorted[0] || null;

        setVideo(chosen);
      } catch (error) {
        console.error('Failed to load videos:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchVideos();
    return () => {
      isMounted = false;
    };
  }, [movieId, language]);

  return (
    <section className={css.videosSection} aria-label={t('movie.officialTrailer')}>
      <div className={css.headerRow}>
        <h2 className={css.sectionTitle}>
          <span className={css.titleIcon}>▶</span> {t('movie.officialTrailer')}
        </h2>
      </div>

      {isLoading ? (
        <Loader caption={t('trailer.loading')} />
      ) : video ? (
        <div className={css.videoWrapper}>
          {video && (
            <h3 key={video.key} className={css.videoCaption}>
              {formatVideoTitle(video.name, video.type, language)}
            </h3>
          )}
          <div className={css.responsivePlayerBox}>
            {/* Glowing loader overlay while iframe initializes or switches */}
            <div
              className={`${css.playerLoaderOverlay} ${isIframeLoaded ? css.playerLoaderOverlayHidden : ''}`}
              aria-hidden="true"
            >
              <div className={css.playerSpinner} />
            </div>

            <iframe
              key={video.key}
              className={`${css.videoFrame} ${isIframeLoaded ? css.videoFrameLoaded : ''}`}
              src={`https://www.youtube.com/embed/${video.key}?rel=0&modestbranding=1`}
              title={formatVideoTitle(video.name, video.type, language) || 'Movie Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setIsIframeLoaded(true)}
            />
          </div>

          {availableVideos.length > 1 && (
            <div className={css.selectorBar} role="group" aria-label={t('trailer.selectVideo')}>
              <span className={css.selectorLabel}>{t('trailer.selectVideo')}</span>
              <div className={css.chipsList}>
                {availableVideos.slice(0, 8).map(v => {
                  const localizedTitle = formatVideoTitle(v.name, v.type, language);
                  return (
                    <button
                      key={v.id || v.key}
                      type="button"
                      className={`${css.chipBtn} ${video.key === v.key ? css.chipBtnActive : ''}`}
                      onClick={() => handleSelectVideo(v)}
                      title={localizedTitle}
                    >
                      <span className={css.chipIcon}>
                        {v.type === 'Trailer' ? '🎬' : v.type === 'Teaser' ? '⚡' : '▶'}
                      </span>
                      <span className={css.chipTitle}>{localizedTitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={css.emptyState}>
          <span className={css.emptyIcon} role="img" aria-label={t('trailer.noTrailerAria', 'No trailer')}>
            🎬
          </span>
          <p className={css.emptyText}>{t('trailer.empty')}</p>
        </div>
      )}
    </section>
  );
};

export default Videos;
