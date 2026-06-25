import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import styles from '../App.module.css';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { VideoBackground } from './VideoBackground';

export function SiteLayout() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      return;
    }

    const target = document.querySelector(hash);
    target?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [hash]);

  return (
    <div className={styles.page}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <VideoBackground />
      <SiteHeader />
      <div className={styles.content}>
        <main id="main-content">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
