import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar({ activePage }) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.drop}></span>
        DAWNDREAM
      </div>
      <nav className={styles.nav}>
        <Link href="/" className={`${styles.navLink} ${!activePage || activePage === 'lore' ? styles.active : ''}`}>
          Lore & History
        </Link>
        <Link href="/clans" className={`${styles.navLink} ${activePage === 'clans' ? styles.active : ''}`}>
          Clans & Houses
        </Link>
      </nav>
      <div className={styles.right}>Second Life RPG System</div>
    </header>
  );
}
