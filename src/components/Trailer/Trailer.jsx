import { getMovieVideos } from 'fetch';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Loader from '../Loader/Loader';
import css from './Trailer.module.css';

export const Trailer = () => {
  const { movieId } = useParams();
  const [video, setVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchTrailer = async () => {
      try {
        const data = await getMovieVideos(movieId);
        if (!isMounted) return;

        const results = data.results || [];
        // Prioritize official YouTube trailer, then any YouTube trailer, then teaser
        const youtubeVideos = results.filter(v => v.site === 'YouTube');
        const officialTrailer = youtubeVideos.find(
          v => v.type === 'Trailer' && (v.official === true || v.name?.toLowerCase().includes('official'))
        );
        const anyTrailer = youtubeVideos.find(v => v.type === 'Trailer');
        const anyTeaser = youtubeVideos.find(v => v.type === 'Teaser');
        const chosenVideo = officialTrailer || anyTrailer || anyTeaser || youtubeVideos[0] || null;

        setVideo(chosenVideo);
      } catch (error) {
        console.error('Failed to load trailer:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTrailer();
    return () => {
      isMounted = false;
    };
  }, [movieId]);

  return (
    <section className={css.trailerSection}>
      <div className={css.headerRow}>
        <h2 className={css.sectionTitle}>
          <span className={css.titleIcon}>▶</span> Official Trailer
        </h2>
      </div>

      {isLoading ? (
        <Loader caption="Loading trailer..." />
      ) : video ? (
        <div className={css.videoWrapper}>
          <div className={css.responsivePlayerBox}>
            <iframe
              className={css.videoFrame}
              src={`https://www.youtube.com/embed/${video.key}?rel=0&modestbranding=1`}
              title={video.name || 'Movie Trailer'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          {video.name && <p className={css.videoCaption}>{video.name}</p>}
        </div>
      ) : (
        <div className={css.emptyState}>
          <span className={css.emptyIcon} role="img" aria-label="No trailer">
            🎬
          </span>
          <p className={css.emptyText}>No official trailer available for this title yet.</p>
        </div>
      )}
    </section>
  );
};

export default Trailer;
