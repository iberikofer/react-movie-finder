import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getMovieImages } from 'fetch';
import { ImageItem } from 'types';
import Loader from '../Loader/Loader';
import { useLanguage } from '../../context/LanguageContext';
import css from './MovieGallery.module.css';

// Speed of continuous drift in pixels per second
const DRIFT_SPEED = 25;
const POST_SCROLL_PAUSE_MS = 750;
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

const ZOOM_LEVELS = [1, 1.8, 2.6];

const calculateMaxPan = (
  containerW: number,
  containerH: number,
  aspectRatio: number,
  scale: number
): { maxPanX: number; maxPanY: number } => {
  if (scale <= 1 || containerW <= 0 || containerH <= 0) {
    return { maxPanX: 0, maxPanY: 0 };
  }

  const containerAspect = containerW / containerH;
  let renderedW = containerW;
  let renderedH = containerH;

  if (aspectRatio > containerAspect) {
    // Wider than container: touches left/right, letterboxed top/bottom
    renderedW = containerW;
    renderedH = containerW / aspectRatio;
  } else {
    // Taller than container: touches top/bottom, pillarboxed left/right
    renderedH = containerH;
    renderedW = containerH * aspectRatio;
  }

  const scaledW = renderedW * scale;
  const scaledH = renderedH * scale;

  const maxPanX = Math.max(0, (scaledW - containerW) / 2);
  const maxPanY = Math.max(0, (scaledH - containerH) / 2);

  return { maxPanX, maxPanY };
};

interface LightboxSlideProps {
  img: ImageItem;
  idx: number;
  movieTitle?: string;
  slideDirection: 'next' | 'prev' | 'none';
  isCached: boolean;
  onViewed: (path: string) => void;
  onZoomChange?: (isZoomed: boolean) => void;
  resetZoomTrigger?: number;
}

const LightboxSlide: React.FC<LightboxSlideProps> = ({
  img,
  idx,
  movieTitle,
  slideDirection,
  isCached,
  onViewed,
  onZoomChange,
  resetZoomTrigger,
}) => {
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = useState<boolean>(() => isCached);
  const [zoomIndex, setZoomIndex] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);
  const maxPanRef = useRef<{ maxPanX: number; maxPanY: number }>({ maxPanX: 0, maxPanY: 0 });

  const currentZoom = ZOOM_LEVELS[zoomIndex];
  const isMaxZoom = zoomIndex === ZOOM_LEVELS.length - 1;

  const getImageAspectRatio = useCallback((): number => {
    if (imgRef.current && imgRef.current.naturalWidth > 0 && imgRef.current.naturalHeight > 0) {
      return imgRef.current.naturalWidth / imgRef.current.naturalHeight;
    }
    if (img.aspect_ratio && img.aspect_ratio > 0) {
      return img.aspect_ratio;
    }
    if (img.width && img.height && img.height > 0) {
      return img.width / img.height;
    }
    return 16 / 9;
  }, [img.aspect_ratio, img.width, img.height]);

  // Reset zoom whenever resetZoomTrigger changes
  useEffect(() => {
    if (resetZoomTrigger && resetZoomTrigger > 0) {
      setZoomIndex(0);
      setPan({ x: 0, y: 0 });
      onZoomChange?.(false);
    }
  }, [resetZoomTrigger, onZoomChange]);

  // Re-clamp pan on window resize
  useEffect(() => {
    const handleResize = () => {
      if (zoomIndex === 0) return;
      const containerW = window.innerWidth;
      const containerH = window.innerHeight;
      const aspect = getImageAspectRatio();
      const scale = ZOOM_LEVELS[zoomIndex];
      const { maxPanX, maxPanY } = calculateMaxPan(containerW, containerH, aspect, scale);

      setPan(prev => ({
        x: Math.max(-maxPanX, Math.min(maxPanX, prev.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, prev.y)),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoomIndex, getImageAspectRatio]);

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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !isLoaded) return;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    hasDraggedRef.current = false;

    if (zoomIndex > 0) {
      setIsDragging(true);
      const containerW = containerRef.current?.clientWidth || window.innerWidth;
      const containerH = containerRef.current?.clientHeight || window.innerHeight;
      const aspect = getImageAspectRatio();
      const scale = ZOOM_LEVELS[zoomIndex];
      maxPanRef.current = calculateMaxPan(containerW, containerH, aspect, scale);

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.hypot(dx, dy) > 4) {
      hasDraggedRef.current = true;
      if (zoomIndex > 0) {
        const { maxPanX, maxPanY } = maxPanRef.current;
        const newX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx));
        const newY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy));
        setPan({ x: newX, y: newY });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !isLoaded) return;
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    setIsDragging(false);
    dragStartRef.current = null;

    // If user dragged to pan, don't trigger zoom change
    if (hasDraggedRef.current) {
      return;
    }

    // Click: zoom in or reset to original
    if (isMaxZoom) {
      setZoomIndex(0);
      setPan({ x: 0, y: 0 });
      onZoomChange?.(false);
    } else {
      const nextIndex = zoomIndex + 1;
      const prevScale = ZOOM_LEVELS[zoomIndex];
      const nextScale = ZOOM_LEVELS[nextIndex];
      const aspect = getImageAspectRatio();

      // In fullscreen zoomed mode, the container occupies the full viewport
      const containerW = zoomIndex === 0 ? window.innerWidth : (containerRef.current?.clientWidth || window.innerWidth);
      const containerH = zoomIndex === 0 ? window.innerHeight : (containerRef.current?.clientHeight || window.innerHeight);

      const { maxPanX, maxPanY } = calculateMaxPan(containerW, containerH, aspect, nextScale);

      // Distance from container / viewport center
      const clickOffsetX = e.clientX - window.innerWidth / 2;
      const clickOffsetY = e.clientY - window.innerHeight / 2;

      // Point on the unscaled image relative to its center
      const imagePointX = (clickOffsetX - pan.x) / prevScale;
      const imagePointY = (clickOffsetY - pan.y) / prevScale;

      // Target pan so the clicked point stays under cursor / centered
      const targetPanX = clickOffsetX - imagePointX * nextScale;
      const targetPanY = clickOffsetY - imagePointY * nextScale;

      const clampedX = Math.max(-maxPanX, Math.min(maxPanX, targetPanX));
      const clampedY = Math.max(-maxPanY, Math.min(maxPanY, targetPanY));

      setPan({ x: clampedX, y: clampedY });
      setZoomIndex(nextIndex);
      onZoomChange?.(true);
    }
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomIndex(0);
    setPan({ x: 0, y: 0 });
    onZoomChange?.(false);
  };

  const slideClass =
    slideDirection === 'next'
      ? css.slideInFromRight
      : slideDirection === 'prev'
      ? css.slideInFromLeft
      : css.slideFadeIn;

  return (
    <div className={`${css.slideContainer} ${slideClass}`}>
      <div
        ref={containerRef}
        className={`${css.zoomContainer} ${
          !isLoaded
            ? ''
            : isDragging
            ? css.cursorGrabbing
            : isMaxZoom
            ? css.cursorZoomOut
            : zoomIndex > 0
            ? css.cursorGrab
            : css.cursorZoomIn
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <img
          ref={imgRef}
          src={getLightboxImageUrl(img)}
          alt={`${movieTitle || 'Movie'} full resolution still ${idx + 1}`}
          decoding="async"
          draggable={false}
          className={`${css.lightboxImage} ${isLoaded ? css.imageVisible : css.imageFading}`}
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${currentZoom})`,
            transformOrigin: '50% 50%',
            transition: isDragging
              ? 'none'
              : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onLoad={markLoaded}
          onError={markLoaded}
        />

        {isLoaded && zoomIndex > 0 && (
          <button
            type="button"
            className={css.zoomBadge}
            onClick={handleBadgeClick}
            aria-live="polite"
            title={t('gallery.resetZoom', 'Click to reset zoom')}
          >
            <span className={css.zoomBadgeIcon}>{isMaxZoom ? '🔍⁻' : '🔍⁺'}</span>
            <span>{currentZoom}x</span>
            {isMaxZoom && (
              <span className={css.zoomBadgeMax}>{t('gallery.maxZoom', 'Max')}</span>
            )}
          </button>
        )}

        {!isLoaded && (
          <div className={css.lightboxLoaderContainer}>
            <Loader caption={t('gallery.loadingImage', 'Loading image...')} />
          </div>
        )}
      </div>
    </div>
  );
};

export interface MovieGalleryProps {
  movieId: string | number;
  movieTitle?: string;
}

export const MovieGallery: React.FC<MovieGalleryProps> = ({ movieId, movieTitle = 'Movie' }) => {
  const { t } = useLanguage();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [resetZoomTrigger, setResetZoomTrigger] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | 'none'>('none');
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loadedPhotos, setLoadedPhotos] = useState<Set<string>>(() => getViewedPhotosSet());
  const viewedPhotosSetRef = useRef<Set<string>>(loadedPhotos);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

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
  const pauseUntilRef = useRef<number>(0);

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
    if (isClosing || images.length <= 1) return;
    setIsZoomed(false);
    setSlideDirection('next');
    setLightboxIndex(prev => (prev === null ? 0 : (prev + 1) % images.length));
  }, [isClosing, images.length]);

  const showPrevImage = useCallback(() => {
    if (isClosing || images.length <= 1) return;
    setIsZoomed(false);
    setSlideDirection('prev');
    setLightboxIndex(prev => (prev === null ? 0 : (prev - 1 + images.length) % images.length));
  }, [isClosing, images.length]);

  const closeLightbox = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setIsZoomed(false);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setLightboxIndex(null);
      setIsClosing(false);
      setSlideDirection('none');
    }, 240);
  }, [isClosing]);

  const openLightbox = useCallback((idx: number) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsClosing(false);
    setIsZoomed(false);
    setSlideDirection('none');
    setLightboxIndex(idx);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return;
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isZoomed) return;
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

  const getCardStep = useCallback((): number => {
    const track = trackRef.current;
    if (!track) return 284;
    const firstCard = track.querySelector<HTMLDivElement>(`.${css.photoCard}`);
    if (!firstCard) return 284;
    const rect = firstCard.getBoundingClientRect();
    return Math.round(rect.width) + 14;
  }, []);

  const getAllCardBounds = useCallback((): Array<{ left: number; right: number }> => {
    const track = trackRef.current;
    if (!track) return [];
    const trackRect = track.getBoundingClientRect();
    const cards = Array.from(track.querySelectorAll<HTMLDivElement>(`.${css.photoCard}`));
    return cards.map(card => {
      const rect = card.getBoundingClientRect();
      const left = track.scrollLeft + (rect.left - trackRect.left);
      const right = left + rect.width;
      return { left: Math.round(left), right: Math.round(right) };
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
            if (targetScrollRef.current !== null) {
              targetScrollRef.current -= setWidth;
            }
          } else if (track.scrollLeft <= setWidth * 0.5) {
            track.scrollLeft += setWidth;
            if (targetScrollRef.current !== null) {
              targetScrollRef.current += setWidth;
            }
          }
        }
        scrollPosRef.current = track.scrollLeft;

        if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
        targetScrollRef.current = null;
        isManualScrollingRef.current = false;
        pauseUntilRef.current = performance.now() + POST_SCROLL_PAUSE_MS;
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
        !isManualScrollingRef.current &&
        currentTime >= pauseUntilRef.current
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
      if (targetScrollRef.current !== null) {
        targetScrollRef.current -= setWidth;
      }
    }

    const viewportWidth = track.clientWidth;
    const allBounds = getAllCardBounds();
    const cardStep = getCardStep();

    const currentBase =
      isManualScrollingRef.current && targetScrollRef.current !== null
        ? targetScrollRef.current
        : track.scrollLeft;

    const currentRight = currentBase + viewportWidth;

    let nextTarget: number;
    if (allBounds.length > 0) {
      const offscreenCards = allBounds
        .filter(b => b.right > currentRight + 6)
        .sort((a, b) => a.right - b.right);

      if (offscreenCards.length > 0) {
        const first = offscreenCards[0];
        const isPartiallyVisible = first.left < currentRight - 20;
        const targetIdx = isPartiallyVisible ? 2 : 1;
        const chosenCard =
          offscreenCards[Math.min(targetIdx, offscreenCards.length - 1)];
        nextTarget = chosenCard.right - viewportWidth;
      } else {
        nextTarget = currentBase + cardStep * 2;
      }
    } else {
      nextTarget = currentBase + cardStep * 2;
    }

    targetScrollRef.current = nextTarget;
    isManualScrollingRef.current = true;
    scrollPosRef.current = nextTarget;

    track.scrollTo({ left: nextTarget, behavior: 'smooth' });

    if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
    manualTimeoutRef.current = setTimeout(() => {
      const curTrack = trackRef.current;
      if (curTrack) {
        if (curTrack.scrollLeft >= setWidth * 2) {
          curTrack.scrollLeft -= setWidth;
        } else if (curTrack.scrollLeft < setWidth * 0.5) {
          curTrack.scrollLeft += setWidth;
        }
        scrollPosRef.current = curTrack.scrollLeft;
      }
      targetScrollRef.current = null;
      isManualScrollingRef.current = false;
      pauseUntilRef.current = performance.now() + POST_SCROLL_PAUSE_MS;
    }, 550);
  }, [getSingleSetWidth, getAllCardBounds, getCardStep]);

  const scrollPrev = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const setWidth = getSingleSetWidth();
    if (setWidth <= 20) return;

    if (track.scrollLeft <= setWidth * 0.5) {
      track.scrollLeft += setWidth;
      if (targetScrollRef.current !== null) {
        targetScrollRef.current += setWidth;
      }
    }

    const allBounds = getAllCardBounds();
    const cardStep = getCardStep();

    const currentBase =
      isManualScrollingRef.current && targetScrollRef.current !== null
        ? targetScrollRef.current
        : track.scrollLeft;

    const currentLeft = currentBase;

    let prevTarget: number;
    if (allBounds.length > 0) {
      const offscreenCardsLeft = allBounds
        .filter(b => b.left < currentLeft - 6)
        .sort((a, b) => b.left - a.left);

      if (offscreenCardsLeft.length > 0) {
        const first = offscreenCardsLeft[0];
        const isPartiallyVisible = first.right > currentLeft + 20;
        const targetIdx = isPartiallyVisible ? 2 : 1;
        const chosenCard =
          offscreenCardsLeft[Math.min(targetIdx, offscreenCardsLeft.length - 1)];
        prevTarget = Math.max(0, chosenCard.left);
      } else {
        prevTarget = Math.max(0, currentBase - cardStep * 2);
      }
    } else {
      prevTarget = Math.max(0, currentBase - cardStep * 2);
    }

    targetScrollRef.current = prevTarget;
    isManualScrollingRef.current = true;
    scrollPosRef.current = prevTarget;

    track.scrollTo({ left: prevTarget, behavior: 'smooth' });

    if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
    manualTimeoutRef.current = setTimeout(() => {
      const curTrack = trackRef.current;
      if (curTrack) {
        if (curTrack.scrollLeft >= setWidth * 2) {
          curTrack.scrollLeft -= setWidth;
        } else if (curTrack.scrollLeft < setWidth * 0.5) {
          curTrack.scrollLeft += setWidth;
        }
        scrollPosRef.current = curTrack.scrollLeft;
      }
      targetScrollRef.current = null;
      isManualScrollingRef.current = false;
      pauseUntilRef.current = performance.now() + POST_SCROLL_PAUSE_MS;
    }, 550);
  }, [getSingleSetWidth, getAllCardBounds, getCardStep]);

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
        if (isZoomed) {
          setResetZoomTrigger(prev => prev + 1);
        } else {
          closeLightbox();
        }
      } else if (!isZoomed && images.length > 1 && e.key === 'ArrowRight') {
        if (!isClosing) showNextImage();
      } else if (!isZoomed && images.length > 1 && e.key === 'ArrowLeft') {
        if (!isClosing) showPrevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, isClosing, isZoomed, images.length, closeLightbox, showNextImage, showPrevImage]);

  if (isLoading) {
    return (
      <div className={css.galleryWrapper}>
        <div className={css.loadingSkeleton}>
          <span className={css.loadingSpinner}>🎬</span>
          <span className={css.loadingText}>{t('gallery.loading', 'Loading photo gallery...')}</span>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className={css.galleryWrapper}>
        <div className={css.emptyPlaceholder}>
          <span className={css.emptyIcon}>📷</span>
          <span className={css.emptyText}>{t('gallery.noImages', 'No images available for this title')}</span>
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
        title={t('gallery.clickFullscreen', 'Click to view full screen')}
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
    <div className={css.galleryWrapper} aria-label={t('gallery.ariaLabel', 'Movie photo gallery')}>
      <div className={css.galleryHeader}>
        <div className={css.headerTitleGroup}>
          <span className={css.headerIcon}>📸</span>
          <h3 className={css.galleryTitle}>{t('gallery.title', 'Photo Gallery')}</h3>
          <span className={css.photoCountBadge}>
            {images.length} {images.length === 1 ? t('gallery.photoOne', 'photo') : t('gallery.photos', 'photos')}
          </span>
        </div>

        {!hasFewPhotos && (
          <div className={css.controlsGroup}>
            <button
              type="button"
              className={`${css.navArrowBtn} ${css.prevBtn}`}
              onClick={scrollPrev}
              aria-label={t('gallery.prevPhotos', 'Previous photos')}
              title={t('gallery.prevPhotos', 'Previous photos')}
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
              aria-label={t('gallery.nextPhotos', 'Next photos')}
              title={t('gallery.nextPhotos', 'Next photos')}
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
            className={`${css.lightboxOverlay} ${isClosing ? css.isClosing : ''} ${
              isZoomed ? css.isZoomed : ''
            }`}
            onClick={() => {
              if (isZoomed) {
                setResetZoomTrigger(prev => prev + 1);
              } else {
                closeLightbox();
              }
            }}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className={css.lightboxCloseBtn}
              onClick={closeLightbox}
              aria-label={t('gallery.closeAria', 'Close fullscreen gallery')}
              title={t('gallery.close', 'Close (Esc)')}
            >
              ✕
            </button>

            {images.length > 1 && (
              <button
                type="button"
                className={`${css.lightboxArrow} ${css.lightboxPrev} ${
                  isZoomed ? css.arrowHidden : ''
                }`}
                onClick={e => {
                  e.stopPropagation();
                  showPrevImage();
                }}
                aria-label={t('gallery.prevPhotos', 'Previous image')}
                title={t('gallery.prevImage', 'Previous (←)')}
              >
                ‹
              </button>
            )}

            <div
              className={`${css.lightboxContent} ${isZoomed ? css.isZoomed : ''}`}
              onClick={e => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className={`${css.lightboxImageWrapper} ${isZoomed ? css.isZoomed : ''} ${
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
                  onZoomChange={(zoomed: boolean) => setIsZoomed(zoomed)}
                  resetZoomTrigger={resetZoomTrigger}
                />
              </div>

              <div
                className={`${css.lightboxFooter} ${isZoomed ? css.footerHidden : ''}`}
              >
                <span className={css.lightboxTitle}>{movieTitle}</span>
                {images.length > 1 && (
                  <span className={css.lightboxCounter}>
                    {lightboxIndex + 1} / {images.length}
                  </span>
                )}
                <span className={css.lightboxTip}>
                  {images.length > 1
                    ? t('gallery.tipMultiple', 'Use ← / → arrows or Esc to close')
                    : t('gallery.tipSingle', 'Press Esc or click outside to close')}
                </span>
              </div>
            </div>

            {images.length > 1 && (
              <button
                type="button"
                className={`${css.lightboxArrow} ${css.lightboxNext} ${
                  isZoomed ? css.arrowHidden : ''
                }`}
                onClick={e => {
                  e.stopPropagation();
                  showNextImage();
                }}
                aria-label={t('gallery.nextPhotos', 'Next image')}
                title={t('gallery.nextImage', 'Next (→)')}
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
