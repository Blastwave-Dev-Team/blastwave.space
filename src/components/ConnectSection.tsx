import {
  BYOND_URL,
  SERVER_ADDRESS,
  STATION_COMMON,
  STATION_OFFICIAL,
} from '../data/connection';
import { CopyButton } from './CopyButton';
import styles from './ConnectSection.module.css';
import copyStyles from './CopyButton.module.css';

export function ConnectSection() {
  return (
    <section
      id="connect"
      className={styles.section}
      aria-labelledby="connect-heading"
    >
      <div className={styles.inner}>
        <div className={styles.panel}>
          <h1 id="connect-heading" className={styles.title}>
            Blastwave <span className={styles.titleAccent}>Station</span>
          </h1>
          <p className={styles.subtitle}>
            {STATION_COMMON} · {STATION_OFFICIAL}
          </p>
          <p className={styles.address} aria-label="Server address">
            {SERVER_ADDRESS}
          </p>
          <div className={styles.actions}>
            <a
              className={copyStyles.buttonPrimary}
              href={BYOND_URL}
            >
              Play Now
            </a>
            <CopyButton value={SERVER_ADDRESS} />
          </div>
        </div>
      </div>
    </section>
  );
}
