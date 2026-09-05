import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getMovieImages } from 'fetch';
import css from './MovieGallery.module.css';

// Speed of continuous drift in pixels per second
const DRIFT_SPEED = 25;

export const MovieGallery = ({ movieId, movieTitle = 'Movie' }) => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const trackRef = useRef(null);
  const set1Ref = useRef(null);
  const isHoveredRef = useRef(false);
  const lightboxOpenRef = useRef(false);
  const isManualScrollingRef = useRef(false);
  const manualTimeoutRef = useRef(null);
  const scrollPosRef = useRef(0);
  const targetScrollRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => {
    lightboxOpenRef.current = lightboxIndex !== null;
  }, [lightboxIndex]);

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

  // Create base items list with minimum 8 photos so it spans beyond any screen width
  const repeatFactor = images.length > 0 && images.length < 8
    ? Math.ceil(8 / images.length)
    : 1;

  const baseItems = images.length > 0
    ? Array.from({ length: repeatFactor }, () => images).flat()
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
    if (!track || baseItems.length === 0) return;

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
  }, [baseItems.length, getSingleSetWidth]);

  // Sync scroll position and resume auto-drift when browser finishes smooth scroll
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

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
  }, [getSingleSetWidth]);

  // Continuous, slow, buttery-smooth linear marquee loop via requestAnimationFrame
  useEffect(() => {
    if (images.length <= 1) return;

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
  }, [images.length, getSingleSetWidth]);

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
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex(prev => (prev + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex(prev => (prev - 1 + images.length) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, images.length]);

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
        onClick={() => setLightboxIndex(originalIdx)}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            setLightboxIndex(originalIdx);
          }
        }}
        title="Click to view full screen"
      >
        <img
          src={`https://image.tmdb.org/t/p/w780${item.file_path}`}
          alt={`${movieTitle} still ${originalIdx + 1}`}
          className={css.thumbnail}
          loading="lazy"
        />
        <div className={css.photoOverlay}>
          <span className={css.zoomIcon}>🔍</span>
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

        <div className={css.controlsGroup}>
          <button
            type="button"
            className={css.navArrowBtn}
            onClick={scrollPrev}
            aria-label="Previous photos"
            title="Previous photos"
          >
            ‹
          </button>
          <button
            type="button"
            className={css.navArrowBtn}
            onClick={scrollNext}
            aria-label="Next photos"
            title="Next photos"
          >
            ›
          </button>
        </div>
      </div>

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

      {/* Fullscreen Lightbox Modal rendered via Portal onto document.body */}
      {lightboxIndex !== null && images[lightboxIndex] && createPortal(
        <div
          className={css.lightboxOverlay}
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className={css.lightboxCloseBtn}
            onClick={() => setLightboxIndex(null)}
            aria-label="Close fullscreen gallery"
            title="Close (Esc)"
          >
            ✕
          </button>

          <button
            type="button"
            className={`${css.lightboxArrow} ${css.lightboxPrev}`}
            onClick={e => {
              e.stopPropagation();
              setLightboxIndex(prev => (prev - 1 + images.length) % images.length);
            }}
            aria-label="Previous image"
            title="Previous (←)"
          >
            ‹
          </button>

          <div
            className={css.lightboxContent}
            onClick={e => e.stopPropagation()}
          >
            <div className={css.lightboxImageWrapper}>
              <img
                src={`https://image.tmdb.org/t/p/original${images[lightboxIndex].file_path}`}
                alt={`${movieTitle} full resolution still ${lightboxIndex + 1}`}
                className={css.lightboxImage}
              />
            </div>

            <div className={css.lightboxFooter}>
              <span className={css.lightboxTitle}>{movieTitle}</span>
              <span className={css.lightboxCounter}>
                {lightboxIndex + 1} / {images.length}
              </span>
              <span className={css.lightboxTip}>Use ← / → arrows or Esc to close</span>
            </div>
          </div>

          <button
            type="button"
            className={`${css.lightboxArrow} ${css.lightboxNext}`}
            onClick={e => {
              e.stopPropagation();
              setLightboxIndex(prev => (prev + 1) % images.length);
            }}
            aria-label="Next image"
            title="Next (→)"
          >
            ›
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MovieGallery;
