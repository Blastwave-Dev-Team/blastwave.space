import { useState } from 'react';
import { LORE_INTRO, LORE_SECTIONS } from '../data/lore';
import styles from './LoreSection.module.css';

export function LoreSection() {
  const [openId, setOpenId] = useState<string>(LORE_SECTIONS[0]?.id ?? '');

  return (
    <section
      id="lore"
      className={styles.section}
      aria-labelledby="lore-heading"
    >
      <div className={styles.inner}>
        <h2 id="lore-heading" className={styles.heading}>
          Lore
        </h2>
        <p className={styles.intro}>{LORE_INTRO}</p>
        <div className={styles.accordion}>
          {LORE_SECTIONS.map((section) => {
            const isOpen = openId === section.id;
            const panelId = `lore-panel-${section.id}`;

            return (
              <div key={section.id} className={styles.item}>
                <button
                  type="button"
                  className={styles.trigger}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() =>
                    setOpenId(isOpen ? '' : section.id)
                  }
                >
                  <span>{section.title}</span>
                  <span className={styles.triggerIcon} aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen ? (
                  <div
                    id={panelId}
                    className={styles.panel}
                    role="region"
                    aria-label={section.title}
                  >
                    {section.content.map((paragraph) => (
                      <p key={paragraph} className={styles.paragraph}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
