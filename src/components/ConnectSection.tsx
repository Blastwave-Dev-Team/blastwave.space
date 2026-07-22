import {
  BYOND_URL,
  SERVER_ADDRESS,
  STATION_COMMON,
  STATION_OFFICIAL,
} from '../data/connection';
import { useFadeIn } from '../hooks/useFadeIn';
import { CopyButton } from './CopyButton';
import styles from './ConnectSection.module.css';
import copyStyles from './CopyButton.module.css';
import { useState, useEffect } from "react";

interface SS13Status {
  version : string | undefined,
  error : string | undefined,
  msg : string | undefined,
  players : string,
  popcap : string,
  map_name : string,
  round_id : string
}

function InfoSection() {
  return (
    <div className={styles.flexChild}>
      <p className={styles.address} aria-label="Server address">
        <span className={styles.addressPrefix}>byond://</span>{SERVER_ADDRESS}
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
  )
}

function RoundInfo() {
  const [status, setStatus] = useState<SS13Status>()
  useEffect(() => {
    fetch("/api/status").then((res) => {
      if (res.status == 200) {
        return res.json()
      }
    }).then((res : SS13Status) => {
      if (!res.error)
        setStatus(res)
    })
  }, [])
  return (
    <div className={styles.flexChild}>
      {status ?
        <div>
          <p>Map: {status?.map_name}</p>
          <p>Players: {status?.players}/{status?.popcap}</p>
        </div> : 
        <p>Server offline.</p>
      }
    </div>
  )
}

export function ConnectSection() {
  const ref = useFadeIn<HTMLElement>();

  return (
    <section
      ref={ref}
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
          <div className={styles.flexContainer}>
            <InfoSection />
            <RoundInfo />
          </div>
        </div>
      </div>
    </section>
  );
}
