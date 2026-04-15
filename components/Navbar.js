import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from './Navbar.module.css';

export default function Navbar({ activePage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [player, setPlayer] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/session')
      .then(r => r.json())
      .then(data => setPlayer(data.player))
      .catch(() => {});
  }, [router.pathname]);

  const links = [
    { href: '/', label: 'Lore & History', page: 'lore' },
    { href: '/clans', label: 'Clans & Houses', page: 'clans' },
    { href: '/hordes', label: 'Hordes', page: 'hordes' },
    { href: '/bloodlines', label: 'Bloodlines', page: 'bloodlines' },
    { href: '/chronicles', label: 'Chronicles', page: 'chronicles' },
    { href: '/events', label: 'Events', page: 'events' },
    { href: '/gallery', label: 'Gallery', page: 'gallery' },
    { href: '/players', label: 'The Coven', page: 'players' },
    { href: '/eternal-press', label: 'The Eternal Press', page: 'eternal-press' },
  ];

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    setPlayer(null);
    router.push('/login');
  }

  return (
    <header className={styles.header}>
      <div className={styles.logo}><span className={styles.drop}></span>DAWNDREAM</div>
      <nav className={styles.nav}>
        {links.map(link => (
          <Link key={link.page} href={link.href} className={`${styles.navLink} ${!activePage && link.page === 'lore' || activePage === link.page ? styles.active : ''}`}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className={styles.rightArea}>
        {player ? (
          <div className={styles.userArea}>
            <Link href="/profile" className={styles.userName}>{player.avatarName}</Link>
            {player.role === 'admin' && <Link href="/admin" className={styles.adminLink}>Admin</Link>}
            <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <Link href="/login" className={styles.loginLink}>Login</Link>
        )}
      </div>
      <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''}`}></span>
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''}`}></span>
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''}`}></span>
      </button>
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {links.map(link => (
            <Link key={link.page} href={link.href} className={`${styles.mobileLink} ${!activePage && link.page === 'lore' || activePage === link.page ? styles.mobileLinkActive : ''}`} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          {player ? (
            <>
              <Link href="/profile" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>My Profile</Link>
              {player.role === 'admin' && <Link href="/admin" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
              <button className={styles.mobileLogout} onClick={handleLogout}>Logout ({player.avatarName})</button>
            </>
          ) : (
            <Link href="/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Login / Register</Link>
          )}
          <div className={styles.mobileFooter}>Second Life RPG System</div>
        </div>
      )}
    </header>
  );
}
