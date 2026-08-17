import { useEffect, useState } from 'react';
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

type RoundState =
  | { kind: 'loading' }
  | { kind: 'ok'; players: string; popcap: string; map_name: string }
  | { kind: 'down' };

type StatusPayload = {
  players?: string;
  popcap?: string;
  map_name?: string;
};

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
  );
}

function formatPlayers(players: string, popcap: string): string {
  if (!popcap || popcap === '0') {
    return players;
  }
  return `${players}/${popcap}`;
}

function RoundInfoBody({ state }: { state: RoundState }) {
  switch (state.kind) {
    case 'loading':
      return <p>Checking server…</p>;
    case 'ok':
      return (
        <div>
          <p>Map: {state.map_name}</p>
          <p>Players: {formatPlayers(state.players, state.popcap)}</p>
        </div>
      );
    case 'down':
      return <p>Server offline.</p>;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

function RoundInfo() {
  const [state, setState] = useState<RoundState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    fetch('/api/status')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('status request failed');
        }
        return res.json() as Promise<StatusPayload>;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (typeof data.players !== 'string' || typeof data.map_name !== 'string') {
          setState({ kind: 'down' });
          return;
        }
        setState({
          kind: 'ok',
          players: data.players,
          popcap: typeof data.popcap === 'string' ? data.popcap : '',
          map_name: data.map_name,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ kind: 'down' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.flexChild}>
      <RoundInfoBody state={state} />
    </div>
  );
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
