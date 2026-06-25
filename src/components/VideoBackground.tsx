import { useEffect, useRef } from 'react';
import styles from './VideoBackground.module.css';

const POSTER = '/assets/bg-poster.webp';
const VIDEO = '/assets/bg.webm';

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const video = videoRef.current;
    if (!video || mediaQuery.matches) {
      return;
    }

    void video.play().catch(() => {
      // Autoplay may be blocked; poster remains visible.
    });
  }, []);

  return (
    <div className={styles.background} aria-hidden="true">
      <img className={styles.poster} src={POSTER} alt="" />
      <video
        ref={videoRef}
        className={styles.video}
        muted
        loop
        playsInline
        autoPlay
        poster={POSTER}
      >
        <source src={VIDEO} type="video/webm" />
      </video>
      <div className={styles.scrim} />
    </div>
  );
}
