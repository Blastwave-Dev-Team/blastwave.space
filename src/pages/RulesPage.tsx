import { RULES, STAFF_ROLES } from '../data/rules';
import styles from './RulesPage.module.css';

const STAFF_LEVEL_CLASS = [
  styles.staffLevel1,
  styles.staffLevel2,
  styles.staffLevel3,
  styles.staffLevel4,
  styles.staffLevel5,
  styles.staffLevel6,
  styles.staffLevel6,
] as const;

export function RulesPage() {
  return (
    <div className={styles.section}>
      <div className={styles.inner}>
        <h1 className={styles.title}>
          Server <span className={styles.titleAccent}>Rules</span>
        </h1>
        <p className={styles.lead}>
          Official server rules and clarifications. Share a direct link to any
          rule using the anchors below.
        </p>

        <nav className={styles.toc} aria-label="Rules contents">
          <h2 className={styles.tocHeading}>Contents</h2>
          <ul className={styles.tocList}>
            {RULES.map((rule) => (
              <li key={rule.id}>
                <a className={styles.tocLink} href={`#${rule.id}`}>
                  Rule {rule.number}
                </a>
              </li>
            ))}
            <li>
              <a className={styles.tocLink} href="#staff-structure">
                Staff Structure
              </a>
            </li>
          </ul>
        </nav>

        <ol className={styles.rulesList}>
          {RULES.map((rule) => (
            <li key={rule.id}>
              <section id={rule.id} className={styles.ruleSection}>
                <h2 className={styles.ruleHeading}>
                  Rule {rule.number}: {rule.title}
                </h2>
                <ul className={styles.ruleList}>
                  {rule.summary.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {rule.clarifications && rule.clarifications.length > 0 ? (
                  <div className={styles.clarifications}>
                    <h3 className={styles.clarificationsHeading}>
                      Clarifications
                    </h3>
                    <ul className={styles.clarificationList}>
                      {rule.clarifications.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            </li>
          ))}
        </ol>

        <section id="staff-structure" className={styles.staffSection}>
          <h2 className={styles.staffHeading}>Staff Structure</h2>
          <ul className={styles.staffList}>
            {STAFF_ROLES.map((role) => (
              <li
                key={role.title}
                className={`${styles.staffItem} ${STAFF_LEVEL_CLASS[role.level] ?? styles.staffLevel1}`}
              >
                <h3 className={styles.staffTitle}>{role.title}</h3>
                <p className={styles.staffDescription}>{role.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
