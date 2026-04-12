import Link from 'next/link';
import styles from './AuthGuard.module.css';

export default function AuthGuard({ children, player }) {
  if (player) return <>{children}</>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.blurred}>{children}</div>
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
