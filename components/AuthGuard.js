import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './AuthGuard.module.css';

export default function AuthGuard({ children }) {
  const [player, setPlayer] = useState(undefined);

  useEffect(() => {
    fetch('/api/session')
      .then(r => r.json())
      .then(data => setPlayer(data.player))
      .catch(() => setPlayer(null));
  }, []);

  if (player === undefined) return (
    <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: '#5a3028', letterSpacing: '0.15em' }}>LOADING...</p>
    </div>
  );

  if (player) return <>{children}</>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.blurred} aria-hidden="true">{children}</div>
      <div className={styles.overlay}>
        <div className={styles.overlayCard}>
          <div className={styles.overlayLogo}>
            <span className={styles.drop}></span>
            DAWNDREAM
          </div>
          <h2 className={styles.overlayTitle}>Members Only</h2>
          <p className={styles.overlaySub}>This section is restricted to approved DawnDream members.</p>
          <Link href="/login" className={styles.loginBtn}>Login →</Link>
          <p className={styles.overlayNote}>Not a member? <Link href="/login" className={styles.registerLink}>Request access</Link></p>
        </div>
      </div>
    </div>
  );
}
