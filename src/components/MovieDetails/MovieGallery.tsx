import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getMovieImages } from 'fetch';
import { ImageItem } from 'types';
import Loader from '../Loader/Loader';
import css from './MovieGallery.module.css';

// Speed of continuous drift in pixels per second
const DRIFT_SPEED = 25;
const GALLERY_CACHE_KEY = 'gallery_viewed_photos';

const getViewedPhotosSet = (): Set<string> => {
  try {
    const raw = sessionStorage.getItem(GALLERY_CACHE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const markPhotoAsViewed = (path?: string): void => {
  if (!path) return;
  try {
    const current = getViewedPhotosSet();
    if (!current.has(path)) {
      current.add(path);
      sessionStorage.setItem(GALLERY_CACHE_KEY, JSON.stringify(Array.from(current)));
    }
  } catch {
    // Ignore quota errors
  }
};

const getLightboxImageUrl = (img?: ImageItem): string => {
  if (!img?.file_path) return '';
  const isPoster = img.aspect_ratio ? img.aspect_ratio < 1 : false;
  return `https://image.tmdb.org/t/p/${isPoster ? 'w780' : 'w1280'}${img.file_path}`;
};

const getThumbnailUrl = (path?: string): string => {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/w780${path}`;
};

interface LightboxSlideProps {
  img: ImageItem;
  idx: number;
  movieTitle?: string;
  slideDirection: 'next' | 'prev' | 'none';
  isCached: boolean;
  onViewed: (path: string) => void;
}

const LightboxSlide: React.FC<LightboxSlideProps> = ({
  img,
  idx,
  movieTitle,
  slideDirection,
  isCached,
  onViewed,
}) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(() => isCached);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const markLoaded = useCallback(() => {
    setIsLoaded(true);
    if (img?.file_path) {
      onViewed(img.file_path);
    }
  }, [img?.file_path, onViewed]);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      markLoaded();
    }
  }, [markLoaded]);

  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => {
      markLoaded();
    }, 1800);
    return () => clearTimeout(timer);
  }, [isLoaded, markLoaded]);

  const slideClass =
    slideDirection === 'next'
      ? css.slideInFromRight
      : slideDirection === 'prev'
      ? css.slideInFromLeft
      : css.slideFadeIn;

  return (
    <div className={`${css.slideContainer} ${slideClass}`}>
      <img
        ref={imgRef}
        src={getLightboxImageUrl(img)}
        alt={`${movieTitle || 'Movie'} full resolution still ${idx + 1}`}
        decoding="async"
        className={`${css.lightboxImage} ${isLoaded ? css.imageVisible : css.imageFading}`}
        onLoad={markLoaded}
        onError={markLoaded}
      />

      {!isLoaded && (
        <div className={css.lightboxLoaderContainer}>
          <Loader caption="Loading image..." />
        </div>
      )}
    </div>
  );
};

export interface MovieGalleryProps {
  movieId: string | number;
  movieTitle?: string;
}

export const MovieGallery: React.FC<MovieGalleryProps> = ({ movieId, movieTitle = 'Movie' }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | 'none'>('none');
  const [loadedPhotos, setLoadedPhotos] = useState<Set<string>>(() => getViewedPhotosSet());
  const viewedPhotosSetRef = useRef<Set<string>>(loadedPhotos);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const set1Ref = useRef<HTMLDivElement | null>(null);
  const isHoveredRef = useRef<boolean>(false);
  const lightboxOpenRef = useRef<boolean>(false);
  const isManualScrollingRef = useRef<boolean>(false);
  const manualTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollPosRef = useRef<number>(0);
  const targetScrollRef = useRef<number | null>(null);

  useEffect(() => {
    lightboxOpenRef.current = lightboxIndex !== null;
  }, [lightboxIndex]);

  const handlePhotoViewed = useCallback((path: string) => {
    if (!path) return;
    markPhotoAsViewed(path);
    viewedPhotosSetRef.current.add(path);
    setLoadedPhotos(prev => {
      if (prev.has(path)) return prev;
      const next = new Set(prev);
      next.add(path);
      return next;
    });
  }, []);

  const showNextImage = useCallback(() => {
    if (images.length <= 1) return;
    setSlideDirection('next');
    setLightboxIndex(prev => (prev === null ? 0 : (prev + 1) % images.length));
  }, [images.length]);

  const showPrevImage = useCallback(() => {
    if (images.length <= 1) return;
    setSlideDirection('prev');
    setLightboxIndex(prev => (prev === null ? 0 : (prev - 1 + images.length) % images.length));
  }, [images.length]);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    setSlideDirection('none');
  }, []);

  const openLightbox = useCallback((idx: number) => {
    setSlideDirection('none');
    setLightboxIndex(idx);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartXRef.current;
    const diffY = touchEndY - touchStartYRef.current;

    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        showNextImage();
      } else {
        showPrevImage();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Preload adjacent images
  useEffect(() => {
    if (lightboxIndex === null || images.length <= 1) return;

    const nextIdx = (lightboxIndex + 1) % images.length;
    const prevIdx = (lightboxIndex - 1 + images.length) % images.length;

    const nextImg = images[nextIdx];
    const prevImg = images[prevIdx];

    const preloadObjects: HTMLImageElement[] = [];
    [nextImg, prevImg].forEach(img => {
      if (img?.file_path && !viewedPhotosSetRef.current.has(img.file_path)) {
        const p = new Image();
        p.onload = () => {
          if (img.file_path) {
            handlePhotoViewed(img.file_path);
          }
        };
        p.src = getLightboxImageUrl(img);
        preloadObjects.push(p);
      }
    });

    return () => {
      preloadObjects.forEach(p => {
        p.onload = null;
        p.onerror = null;
        p.src = '';
      });
    };
  }, [lightboxIndex, images, handlePhotoViewed]);

  // Fetch backdrop images for the movie/show
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchImages = async () => {
      try {
        const data = await getMovieImages(movieId);
        if (!isMounted) return;
        const validBackdrops = (data?.backdrops || []).filter(img => img.file_path);
        const finalImages =
          validBackdrops.length > 0
            ? validBackdrops
            : (data?.posters || []).filter(img => img.file_path);
        setImages(finalImages);
      } catch (error) {
        console.error('Failed to load gallery images:', error);
        if (isMounted) setImages([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchImages();
    return () => {
      isMounted = false;
    };
  }, [movieId]);

  const hasFewPhotos = images.length < 5;

  const repeatFactor = !hasFewPhotos && images.length < 8
    ? Math.ceil(8 / images.length)
    : 1;

  const baseItems: ImageItem[] = images.length > 0
    ? (hasFewPhotos ? images : Array.from({ length: repeatFactor }, () => images).flat())
    : [];

  const getSingleSetWidth = useCallback((): number => {
    if (!set1Ref.current) return 0;
    return set1Ref.current.getBoundingClientRect().width + 14;
  }, []);

  const getCardPositions = useCallback(() => {
    const track = trackRef.current;
    if (!track) return [];
    const trackRect = track.getBoundingClientRect();
    const cardElements = Array.from(track.querySelectorAll<HTMLDivElement>(`.${css.photoCard}`));
    return cardElements.map(card => {
      const cardRect = card.getBoundingClientRect();
      return {
        element: card,
        targetScrollForRight: track.scrollLeft + (cardRect.right - trackRect.right),
        targetScrollForLeft: track.scrollLeft + (cardRect.left - trackRect.left),
      };
    });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || baseItems.length === 0 || hasFewPhotos) return;

    let attempts = 0;
    let timerId: NodeJS.Timeout;

    const initScroll = () => {
      const setWidth = getSingleSetWidth();
      if (setWidth > 20) {
        track.scrollLeft = setWidth;
        scrollPosRef.current = setWidth;
      } else if (attempts < 15) {
        attempts += 1;
        timerId = setTimeout(initScroll, 60);
      }
    };

    timerId = setTimeout(initScroll, 40);
    return () => clearTimeout(timerId);
  }, [baseItems.length, getSingleSetWidth, hasFewPhotos]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || hasFewPhotos) return;

    const handleScrollEnd = () => {
      if (isManualScrollingRef.current) {
        const setWidth = getSingleSetWidth();
        if (setWidth > 20) {
          if (track.scrollLeft >= setWidth * 2) {
            track.scrollLeft -= setWidth;
          } else if (track.scrollLeft <= setWidth * 0.5) {
            track.scrollLeft += setWidth;
          }
        }
        scrollPosRef.current = track.scrollLeft;

        if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
        manualTimeoutRef.current = setTimeout(() => {
          targetScrollRef.current = null;
          isManualScrollingRef.current = false;
        }, 800);
      }
    };

    track.addEventListener('scrollend', handleScrollEnd);
    return () => {
      track.removeEventListener('scrollend', handleScrollEnd);
      if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
    };
  }, [getSingleSetWidth, hasFewPhotos]);

  useEffect(() => {
    if (hasFewPhotos) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const renderLoop = (currentTime: number) => {
      const elapsed = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const track = trackRef.current;
      const setWidth = getSingleSetWidth();

      if (
        track &&
        setWidth > 0 &&
        !isHoveredRef.current &&
        !lightboxOpenRef.current &&
        !isManualScrollingRef.current
      ) {
        scrollPosRef.current += DRIFT_SPEED * elapsed;

        if (scrollPosRef.current >= setWidth * 2) {
          scrollPosRef.current -= setWidth;
        } else if (scrollPosRef.current <= setWidth * 0.5) {
          scrollPosRef.current += setWidth;
        }

        track.scrollLeft = scrollPosRef.current;
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hasFewPhotos, getSingleSetWidth]);

  const scrollNext = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const setWidth = getSingleSetWidth();
    if (setWidth <= 20) return;

    if (track.scrollLeft >= setWidth * 2) {
      track.scrollLeft -= setWidth;
      scrollPosRef.current = track.scrollLeft;
    }

    const cardPositions = getCardPositions();
    if (cardPositions.length === 0) return;

    const basePos =
      isManualScrollingRef.current && targetScrollRef.current !== null
        ? targetScrollRef.current
        : track.scrollLeft;

    const upcomingCards = cardPositions
      .filter(c => c.targetScrollForRight > basePos + 5)
      .sort((a, b) => a.targetScrollForRight - b.targetScrollForRight);
    if (upcomingCards.length === 0) return;

    const nextCard = upcomingCards.length > 1 ? upcomingCards[1] : upcomingCards[0];

    const target = nextCard.targetScrollForRight;
    targetScrollRef.current = target;
    isManualScrollingRef.current = true;
    scrollPosRef.current = target;

    track.scrollTo({ left: target, behavior: 'smooth' });

    if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
    manualTimeoutRef.current = setTimeout(() => {
      const curTrack = trackRef.current;
      if (curTrack) {
        if (curTrack.scrollLeft >= setWidth * 2) {
          curTrack.scrollLeft -= setWidth;
        } else if (curTrack.scrollLeft <= setWidth * 0.5) {
          curTrack.scrollLeft += setWidth;
        }
        scrollPosRef.current = curTrack.scrollLeft;
      }
      targetScrollRef.current = null;
      isManualScrollingRef.current = false;
    }, 1200);
  }, [getSingleSetWidth, getCardPositions]);

  const scrollPrev = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const setWidth = getSingleSetWidth();
    if (setWidth <= 20) return;

    if (track.scrollLeft <= setWidth * 0.5) {
      track.scrollLeft += setWidth;
      scrollPosRef.current = track.scrollLeft;
    }

    const cardPositions = getCardPositions();
    if (cardPositions.length === 0) return;

    const basePos =
      isManualScrollingRef.current && targetScrollRef.current !== null
        ? targetScrollRef.current
        : track.scrollLeft;

    const previousCards = cardPositions
      .filter(c => c.targetScrollForLeft < basePos - 5)
      .sort((a, b) => b.targetScrollForLeft - a.targetScrollForLeft);
    if (previousCards.length === 0) return;

    const prevCard = previousCards.length > 1 ? previousCards[1] : previousCards[0];

    const target = Math.max(0, prevCard.targetScrollForLeft);
    targetScrollRef.current = target;
    isManualScrollingRef.current = true;
    scrollPosRef.current = target;

    track.scrollTo({ left: target, behavior: 'smooth' });

    if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
    manualTimeoutRef.current = setTimeout(() => {
      const curTrack = trackRef.current;
      if (curTrack) {
        if (curTrack.scrollLeft >= setWidth * 2) {
          curTrack.scrollLeft -= setWidth;
        } else if (curTrack.scrollLeft <= setWidth * 0.5) {
          curTrack.scrollLeft += setWidth;
        }
        scrollPosRef.current = curTrack.scrollLeft;
      }
      targetScrollRef.current = null;
      isManualScrollingRef.current = false;
    }, 1200);
  }, [getSingleSetWidth, getCardPositions]);

  const handleScroll = useCallback(() => {
    if (isManualScrollingRef.current) return;
    const track = trackRef.current;
    const setWidth = getSingleSetWidth();
    if (!track || setWidth === 0) return;

    if (track.scrollLeft >= setWidth * 2.4) {
      track.scrollLeft -= setWidth;
    } else if (track.scrollLeft <= setWidth * 0.2) {
      track.scrollLeft += setWidth;
    }
    scrollPosRef.current = track.scrollLeft;
  }, [getSingleSetWidth]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (images.length > 1 && e.key === 'ArrowRight') {
        showNextImage();
      } else if (images.length > 1 && e.key === 'ArrowLeft') {
        showPrevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, images.length, closeLightbox, showNextImage, showPrevImage]);

  if (isLoading) {
    return (
      <div className={css.galleryWrapper}>
        <div className={css.loadingSkeleton}>
          <span className={css.loadingSpinner}>🎬</span>
          <span className={css.loadingText}>Loading photo gallery...</span>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className={css.galleryWrapper}>
        <div className={css.emptyPlaceholder}>
          <span className={css.emptyIcon}>📷</span>
          <span className={css.emptyText}>No images available for this title</span>
        </div>
      </div>
    );
  }

  const renderPhotoCard = (item: ImageItem, idx: number, setKey: string) => {
    const originalIdx = idx % images.length;
    return (
      <div
        key={`${item.file_path}-${setKey}-${idx}`}
        className={css.photoCard}
        onClick={() => {
          openLightbox(originalIdx);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            openLightbox(originalIdx);
          }
        }}
        title="Click to view full screen"
      >
        <div className={css.photoInner}>
          <img
            src={getThumbnailUrl(item.file_path)}
            alt={`${movieTitle} still ${originalIdx + 1}`}
            className={css.thumbnail}
            loading="lazy"
            decoding="async"
          />
          <div className={css.photoOverlay}>
            <span className={css.zoomIcon}>🔍</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={css.galleryWrapper} aria-label="Movie photo gallery">
      <div className={css.galleryHeader}>
        <div className={css.headerTitleGroup}>
          <span className={css.headerIcon}>📸</span>
          <h3 className={css.galleryTitle}>Photo Gallery</h3>
          <span className={css.photoCountBadge}>{images.length} photos</span>
        </div>

        {!hasFewPhotos && (
          <div className={css.controlsGroup}>
            <button
              type="button"
              className={`${css.navArrowBtn} ${css.prevBtn}`}
              onClick={scrollPrev}
              aria-label="Previous photos"
              title="Previous photos"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={css.arrowIcon}
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className={`${css.navArrowBtn} ${css.nextBtn}`}
              onClick={scrollNext}
              aria-label="Next photos"
              title="Next photos"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={css.arrowIcon}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {hasFewPhotos ? (
        <div className={`${css.carouselTrack} ${css.fewPhotosTrack}`}>
          <div className={`${css.photoSet} ${css.fewPhotosSet}`}>
            {images.map((item, idx) => renderPhotoCard(item, idx, 'single'))}
          </div>
        </div>
      ) : (
        <div
          className={css.carouselTrack}
          ref={trackRef}
          onScroll={handleScroll}
          onMouseEnter={() => {
            isHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
          }}
        >
          <div ref={set1Ref} className={css.photoSet}>
            {baseItems.map((item, idx) => renderPhotoCard(item, idx, 'set1'))}
          </div>

          <div className={css.photoSet}>
            {baseItems.map((item, idx) => renderPhotoCard(item, idx, 'set2'))}
          </div>

          <div className={css.photoSet}>
            {baseItems.map((item, idx) => renderPhotoCard(item, idx, 'set3'))}
          </div>
        </div>
      )}

      {lightboxIndex !== null && images[lightboxIndex] && (() => {
        const currentImg = images[lightboxIndex];
        const aspectRatio =
          currentImg.aspect_ratio ||
          (currentImg.width && currentImg.height
            ? currentImg.width / currentImg.height
            : 16 / 9);

        return createPortal(
          <div
            className={css.lightboxOverlay}
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className={css.lightboxCloseBtn}
              onClick={closeLightbox}
              aria-label="Close fullscreen gallery"
              title="Close (Esc)"
            >
              ✕
            </button>

            {images.length > 1 && (
              <button
                type="button"
                className={`${css.lightboxArrow} ${css.lightboxPrev}`}
                onClick={e => {
                  e.stopPropagation();
                  showPrevImage();
                }}
                aria-label="Previous image"
                title="Previous (←)"
              >
                ‹
              </button>
            )}

            <div
              className={css.lightboxContent}
              onClick={e => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className={`${css.lightboxImageWrapper} ${
                  loadedPhotos.has(currentImg.file_path) ? '' : css.skeleton
                }`}
                style={
                  {
                    '--img-aspect-ratio': aspectRatio,
                  } as React.CSSProperties
                }
              >
                <LightboxSlide
                  key={`slide-${lightboxIndex}-${currentImg.file_path}`}
                  img={currentImg}
                  idx={lightboxIndex}
                  movieTitle={movieTitle}
                  slideDirection={slideDirection}
                  isCached={loadedPhotos.has(currentImg.file_path)}
                  onViewed={handlePhotoViewed}
                />
              </div>

              <div className={css.lightboxFooter}>
                <span className={css.lightboxTitle}>{movieTitle}</span>
                {images.length > 1 && (
                  <span className={css.lightboxCounter}>
                    {lightboxIndex + 1} / {images.length}
                  </span>
                )}
                <span className={css.lightboxTip}>
                  {images.length > 1
                    ? 'Use ← / → arrows or Esc to close'
                    : 'Press Esc or click outside to close'}
                </span>
              </div>
            </div>

            {images.length > 1 && (
              <button
                type="button"
                className={`${css.lightboxArrow} ${css.lightboxNext}`}
                onClick={e => {
                  e.stopPropagation();
                  showNextImage();
                }}
                aria-label="Next image"
                title="Next (→)"
              >
                ›
              </button>
            )}
          </div>,
          document.body
        );
      })()}
    </div>
  );
};

export default MovieGallery;
