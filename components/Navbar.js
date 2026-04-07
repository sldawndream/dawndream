import Link from 'next/link';
import { useState } from 'react';
import styles from './Navbar.module.css';

export default function Navbar({ activePage }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '/', label: 'Lore & History', page: 'lore' },
    { href: '/clans', label: 'Clans & Houses', page: 'clans' },
    { href: '/hordes', label: 'Hordes', page: 'hordes' },
    { href: '/bloodlines', label: 'Bloodlines', page: 'bloodlines' },
    { href: '/chronicles', label: 'Chronicles', page: 'chronicles' },
    { href: '/events', label: 'Events', page: 'events' },
    { href: '/gallery', label: 'Gallery', page: 'gallery' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.drop}></span>
        DAWNDREAM
      </div>

      <nav className={styles.nav}>
        {links.map(link => (
          <Link key={link.page} href={link.href} className={`${styles.navLink} ${!activePage && link.page === 'lore' || activePage === link.page ? styles.active : ''}`}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className={styles.right}>Second Life RPG System</div>

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
          <div className={styles.mobileFooter}>Second Life RPG System</div>
        </div>
      )}
    </header>
  );
}
