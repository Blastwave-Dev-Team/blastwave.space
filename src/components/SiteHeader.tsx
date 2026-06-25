import { Link } from 'react-router-dom';
import { GITHUB_URL, WIKI_URL } from '../data/connection';
import styles from './SiteHeader.module.css';

const NAV_ITEMS = [
  { to: '/#connect', label: 'Connect' },
  { to: '/#about', label: 'About' },
  { to: '/#lore', label: 'Lore' },
  { to: '/rules', label: 'Rules' },
] as const;

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} to="/">
          <img src="/logo.webp" alt="" className={styles.brandLogo} />
          Blastwave <span className={styles.brandAccent}>Station</span>
        </Link>
        <nav className={styles.nav} aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <Link key={item.to} className={styles.navLink} to={item.to}>
              {item.label}
            </Link>
          ))}
          <a
            className={styles.navLink}
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            className={styles.navLink}
            href={WIKI_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Wiki
          </a>
        </nav>
      </div>
    </header>
  );
}
