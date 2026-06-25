import { OFFERS } from '../data/offers';
import styles from './OffersSection.module.css';

export function OffersSection() {
  return (
    <section
      id="about"
      className={styles.section}
      aria-labelledby="about-heading"
    >
      <div className={styles.inner}>
        <h2 id="about-heading" className={styles.heading}>
          What We Offer
        </h2>
        <p className={styles.lead}>
          A Nova Sector /tg/station downstream built around Redline Station and
          the Blastwave Zone — with systems and setting you won&apos;t find on a
          stock SS13 server.
        </p>
        <ul className={styles.grid}>
          {OFFERS.map((offer) => (
            <li key={offer.title} className={styles.card}>
              <h3 className={styles.cardTitle}>{offer.title}</h3>
              <p className={styles.cardBody}>{offer.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
