import { Link } from 'react-router-dom';
import { GITHUB_URL, WIKI_URL } from '../data/connection';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <nav className={styles.links} aria-label="Footer">
          <Link className={styles.link} to="/rules">
            Rules
          </Link>
          <a
            className={styles.link}
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            className={styles.link}
            href={WIKI_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Wiki
          </a>
        </nav>
        <p className={styles.meta}>
          Blastwave Station · blastwave.space
        </p>
      </div>
    </footer>
  );
}
