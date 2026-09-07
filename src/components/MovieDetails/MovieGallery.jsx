import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { getMovieImages } from 'fetch';
import Loader from '../Loader/Loader';
import css from './MovieGallery.module.css';

// Speed of continuous drift in pixels per second
const DRIFT_SPEED = 25;
const GALLERY_CACHE_KEY = 'gallery_viewed_photos';

const getViewedPhotosSet = () => {
  try {
    const raw = sessionStorage.getItem(GALLERY_CACHE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const markPhotoAsViewed = path => {
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

const getLightboxImageUrl = img => {
  if (!img?.file_path) return '';
  // TMDB backdrop standard is w1280 (100KB, ultra-fast and crisp on any display).
  // Posters standard is w780 (also fast and crisp).
  const isPoster = img.aspect_ratio ? img.aspect_ratio < 1 : false;
  return `https://image.tmdb.org/t/p/${isPoster ? 'w780' : 'w1280'}${img.file_path}`;
};

const getThumbnailUrl = path => {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/w780${path}`;
};

const LightboxSlide = ({
  img,
  idx,
  movieTitle,
  slideDirection,
  isCached,
  onViewed,
}) => {
  const [isLoaded, setIsLoaded] = useState(() => isCached);
  const imgRef = useRef(null);

  const markLoaded = useCallback(() => {
    setIsLoaded(true);
    if (img?.file_path) {
      onViewed(img.file_path);
    }
  }, [img?.file_path, onViewed]);

  // Synchronously check if image is already cached in browser memory
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      markLoaded();
    }
  }, [markLoaded]);

  // Safety fallback: dismiss loader if loading takes longer than 1.8s
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
        alt={`${movieTitle} full resolution still ${idx + 1}`}
        decoding="async"
        fetchPriority="high"
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

LightboxSlide.propTypes = {
  img: PropTypes.shape({
    file_path: PropTypes.string,
    aspect_ratio: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  idx: PropTypes.number.isRequired,
  movieTitle: PropTypes.string,
  slideDirection: PropTypes.oneOf(['next', 'prev', 'none']).isRequired,
  isCached: PropTypes.bool.isRequired,
  onViewed: PropTypes.func.isRequired,
};

export const MovieGallery = ({ movieId, movieTitle = 'Movie' }) => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [slideDirection, setSlideDirection] = useState('none');
  const [loadedPhotos, setLoadedPhotos] = useState(() => getViewedPhotosSet());
  const viewedPhotosSetRef = useRef(loadedPhotos);

  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  const trackRef = useRef(null);
  const set1Ref = useRef(null);
  const isHoveredRef = useRef(false);
  const lightboxOpenRef = useRef(false);
  const isManualScrollingRef = useRef(false);
  const manualTimeoutRef = useRef(null);
  const scrollPosRef = useRef(0);
  const targetScrollRef = useRef(null);

  useEffect(() => {
    lightboxOpenRef.current = lightboxIndex !== null;
  }, [lightboxIndex]);

  const handlePhotoViewed = useCallback(path => {
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
    setLightboxIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const showPrevImage = useCallback(() => {
    if (images.length <= 1) return;
    setSlideDirection('prev');
    setLightboxIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    setSlideDirection('none');
  }, []);

  const openLightbox = useCallback(idx => {
    setSlideDirection('none');
    setLightboxIndex(idx);
  }, []);

  const handleTouchStart = e => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = e => {
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

  // Preload adjacent images (next and previous) softly into browser cache
  useEffect(() => {
    if (lightboxIndex === null || images.length <= 1) return;

    const nextIdx = (lightboxIndex + 1) % images.length;
    const prevIdx = (lightboxIndex - 1 + images.length) % images.length;

    const nextImg = images[nextIdx];
    const prevImg = images[prevIdx];

    const preloadObjects = [];
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
        // Fallback to posters if backdrops are empty
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

  // Create base items list with minimum 8 photos so it spans beyond any screen width (only when >= 5 photos)
  const repeatFactor = !hasFewPhotos && images.length < 8
    ? Math.ceil(8 / images.length)
    : 1;

  const baseItems = images.length > 0
    ? (hasFewPhotos ? images : Array.from({ length: repeatFactor }, () => images).flat())
    : [];

  // Helper to measure exact width of 1 set (all cards + gap)
  const getSingleSetWidth = useCallback(() => {
    if (!set1Ref.current) return 0;
    return set1Ref.current.getBoundingClientRect().width + 14;
  }, []);

  // Query all cards currently in the track and calculate exact scroll target for each
  const getCardPositions = useCallback(() => {
    const track = trackRef.current;
    if (!track) return [];
    const trackRect = track.getBoundingClientRect();
    const cardElements = Array.from(track.querySelectorAll(`.${css.photoCard}`));
    return cardElements.map(card => {
      const cardRect = card.getBoundingClientRect();
      return {
        element: card,
        // The exact scrollLeft where this card's right edge aligns 100% flush with visible track's right edge
        targetScrollForRight: track.scrollLeft + (cardRect.right - trackRect.right),
        // The exact scrollLeft where this card's left edge aligns 100% flush with visible track's left edge
        targetScrollForLeft: track.scrollLeft + (cardRect.left - trackRect.left),
      };
    });
  }, []);

  // Initialize track scroll position to Set 2 (middle set) on load
  useEffect(() => {
    const track = trackRef.current;
    if (!track || baseItems.length === 0 || hasFewPhotos) return;

    let attempts = 0;
    let timerId;

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

  // Sync scroll position and resume auto-drift when browser finishes smooth scroll
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

        // Brief pause (~800ms) after smooth scroll arrives, then resume auto-drift
        clearTimeout(manualTimeoutRef.current);
        manualTimeoutRef.current = setTimeout(() => {
          targetScrollRef.current = null;
          isManualScrollingRef.current = false;
        }, 800);
      }
    };

    track.addEventListener('scrollend', handleScrollEnd);
    return () => {
      track.removeEventListener('scrollend', handleScrollEnd);
      clearTimeout(manualTimeoutRef.current);
    };
  }, [getSingleSetWidth, hasFewPhotos]);

  // Continuous, slow, buttery-smooth linear marquee loop via requestAnimationFrame
  useEffect(() => {
    if (hasFewPhotos) return;

    let animationFrameId;
    let lastTime = performance.now();

    const renderLoop = currentTime => {
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
        // Increment continuous floating position
        scrollPosRef.current += DRIFT_SPEED * elapsed;

        // When we pass Set 2 into Set 3, seamlessly wrap back into Set 2
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

  // Manual Next arrow: reveals peeking photo on right + next one ("через одну") flush with right edge
  const scrollNext = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const setWidth = getSingleSetWidth();
    if (setWidth <= 20) return;

    // Seamless wrap check before computing target
    if (track.scrollLeft >= setWidth * 2) {
      track.scrollLeft -= setWidth;
      scrollPosRef.current = track.scrollLeft;
    }

    const cardPositions = getCardPositions();
    if (cardPositions.length === 0) return;

    // Use current in-flight destination or current scrollLeft as anchor
    const basePos =
      isManualScrollingRef.current && targetScrollRef.current !== null
        ? targetScrollRef.current
        : track.scrollLeft;

    // Cards whose right edge is beyond visible track's right edge (ordered ascending: closest first)
    const upcomingCards = cardPositions
      .filter(c => c.targetScrollForRight > basePos + 5)
      .sort((a, b) => a.targetScrollForRight - b.targetScrollForRight);
    if (upcomingCards.length === 0) return;

    // Step "через одну": upcomingCards[0] is the card starting to peek on right, upcomingCards[1] is the next one
    const nextCard = upcomingCards.length > 1 ? upcomingCards[1] : upcomingCards[0];

    const target = nextCard.targetScrollForRight;
    targetScrollRef.current = target;
    isManualScrollingRef.current = true;
    scrollPosRef.current = target;

    track.scrollTo({ left: target, behavior: 'smooth' });

    // Fallback timer to resume auto-drift if scrollend does not fire
    clearTimeout(manualTimeoutRef.current);
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

  // Manual Prev arrow: smoothly advances backward 'через одну' (2 photos) flush with left edge
  const scrollPrev = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const setWidth = getSingleSetWidth();
    if (setWidth <= 20) return;

    // Seamless wrap check before reversing
    if (track.scrollLeft <= setWidth * 0.5) {
      track.scrollLeft += setWidth;
      scrollPosRef.current = track.scrollLeft;
    }

    const cardPositions = getCardPositions();
    if (cardPositions.length === 0) return;

    // Use current in-flight destination or current scrollLeft as anchor
    const basePos =
      isManualScrollingRef.current && targetScrollRef.current !== null
        ? targetScrollRef.current
        : track.scrollLeft;

    // All previous cards behind track's left edge (ordered descending: closest first)
    const previousCards = cardPositions
      .filter(c => c.targetScrollForLeft < basePos - 5)
      .sort((a, b) => b.targetScrollForLeft - a.targetScrollForLeft);
    if (previousCards.length === 0) return;

    // Step "через одну" backward: previousCards[0] is peeking on left, previousCards[1] is the one before
    const prevCard = previousCards.length > 1 ? previousCards[1] : previousCards[0];

    const target = Math.max(0, prevCard.targetScrollForLeft);
    targetScrollRef.current = target;
    isManualScrollingRef.current = true;
    scrollPosRef.current = target;

    track.scrollTo({ left: target, behavior: 'smooth' });

    // Fallback timer to resume auto-drift if scrollend does not fire
    clearTimeout(manualTimeoutRef.current);
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

  // Handle user touch / wheel scroll
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

  // Lightbox keyboard navigation & body scroll lock
  useEffect(() => {
    if (lightboxIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = e => {
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

  const renderPhotoCard = (item, idx, setKey) => {
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
    <div
      className={css.galleryWrapper}
      aria-label="Movie photo gallery"
    >
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
          {/* Set 1 (Buffer on left for seamless backward scrolling) */}
          <div ref={set1Ref} className={css.photoSet}>
            {baseItems.map((item, idx) => renderPhotoCard(item, idx, 'set1'))}
          </div>

          {/* Set 2 (Active set where initial viewing begins) */}
          <div className={css.photoSet}>
            {baseItems.map((item, idx) => renderPhotoCard(item, idx, 'set2'))}
          </div>

          {/* Set 3 (Buffer on right for seamless infinite continuation) */}
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
                style={{
                  '--img-aspect-ratio': aspectRatio,
                }}
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

MovieGallery.propTypes = {
  movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  movieTitle: PropTypes.string,
};

export default MovieGallery;
