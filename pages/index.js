import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import styles from '../styles/Landing.module.css';

const LOGO_URL = 'https://res.cloudinary.com/dsrincyog/image/upload/v1778809656/image_2026-05-15_024732856_pif7xh.png';
const SL_URL   = 'http://maps.secondlife.com/secondlife/Los%20Santoz/73/104/31';

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>DawnDream — Vampire & Lycan RPG · Second Life</title>
        <meta name="description" content="DawnDream — the gothic vampire and lycan RPG for Second Life. The eternal night does not sleep." />
      </Head>
      <Navbar activePage="home" />

      {/* ── Hero Cover ── */}
      <section className={styles.cover}>
        <div className={styles.coverGlow} />
        <div className={styles.coverRing} />
        <div className={styles.coverRing2} />

        <p className={styles.coverOrnament}>The Eternal Covenant</p>

        <img
          src={LOGO_URL}
          alt="DawnDream"
          className={styles.coverLogo}
        />

        <p className={styles.coverSubtitle}>Vampire &amp; Lycan RPG &nbsp;·&nbsp; Second Life</p>

        <div className={styles.coverDivider}>
          <div className={styles.coverDividerLine} />
          <div className={styles.coverDividerGem} />
          <div className={styles.coverDividerLine} />
        </div>

        <p className={styles.coverTagline}>
          The eternal night does not sleep.<br />
          The blood does not forget.<br />
          The moon does not forgive.
        </p>

        <div className={styles.coverBtns}>
          <Link href="/register" className={styles.btnPrimary}>
            Request Access →
          </Link>
          <a href={SL_URL} className={styles.btnSecondary} target="_blank" rel="noreferrer">
            Explore the World
          </a>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className={styles.strip}>
        <div className={styles.stripItem}>
          <div className={styles.stripSoon}>Coming Soon</div>
          <div className={styles.stripLabel}>Members</div>
        </div>
        <div className={styles.stripDiv} />
        <div className={styles.stripItem}>
          <div className={styles.stripNum}>2</div>
          <div className={styles.stripLabel}>Races</div>
        </div>
        <div className={styles.stripDiv} />
        <div className={styles.stripItem}>
          <div className={styles.stripNum}>18</div>
          <div className={styles.stripLabel}>Vampire Ages</div>
        </div>
        <div className={styles.stripDiv} />
        <div className={styles.stripItem}>
          <div className={styles.stripNum}>17</div>
          <div className={styles.stripLabel}>Lycan Ages</div>
        </div>
        <div className={styles.stripDiv} />
        <div className={styles.stripItem}>
          <div className={styles.stripNum}>∞</div>
          <div className={styles.stripLabel}>Always Night</div>
        </div>
      </div>

      {/* ── Section cards ── */}
      <div className={styles.sections}>
        <p className={styles.sectionsHead}>Explore DawnDream</p>
        <div className={styles.sectionGrid}>
          <Link href="/" className={styles.sc}>
            <p className={styles.scPre}>The Blood</p>
            <p className={styles.scTitle}>Vampire Lore</p>
            <p className={styles.scDesc}>Centuries of covenant, war and betrayal — the full history of the eternal kindred.</p>
            <span className={styles.scArrow}>Read the Chronicles →</span>
          </Link>
          <Link href="/" className={styles.sc}>
            <p className={styles.scPre}>The Moon</p>
            <p className={styles.scTitle}>Lycan Lore</p>
            <p className={styles.scDesc}>Before the throne was built, the moon chose its children — their story is older than blood.</p>
            <span className={styles.scArrow}>Read the Pack Scrolls →</span>
          </Link>
          <Link href="/clans" className={styles.sc}>
            <p className={styles.scPre}>The Factions</p>
            <p className={styles.scTitle}>Clans & Hordes</p>
            <p className={styles.scDesc}>The great factions of DawnDream — sworn to the throne or defiant against it.</p>
            <span className={styles.scArrow}>Meet the Factions →</span>
          </Link>
          <Link href="/gallery" className={styles.sc}>
            <p className={styles.scPre}>The Gallery</p>
            <p className={styles.scTitle}>Member Art</p>
            <p className={styles.scDesc}>Photographs and portraits from the eternal grounds — submitted by members of the coven.</p>
            <span className={styles.scArrow}>Enter the Gallery →</span>
          </Link>
          <Link href="/sim" className={styles.sc}>
            <p className={styles.scPre}>The Grounds</p>
            <p className={styles.scTitle}>The Sim</p>
            <p className={styles.scDesc}>Explore the eternal lands of DawnDream — fourteen locations, one endless night.</p>
            <span className={styles.scArrow}>Visit the Sim →</span>
          </Link>
          <Link href="/eternal-press" className={styles.sc}>
            <p className={styles.scPre}>The Press</p>
            <p className={styles.scTitle}>Eternal Press</p>
            <p className={styles.scDesc}>Stories, reports and chronicles written by the members of DawnDream themselves.</p>
            <span className={styles.scArrow}>Read the Press →</span>
          </Link>
        </div>
      </div>

      {/* ── Bottom quote ── */}
      <div className={styles.bottom}>
        <p className={styles.bottomPre}>The Sacred Texts of DawnDream</p>
        <p className={styles.bottomQuote}>"In the age before memory, the first blood was spilled beneath a moonless sky — and the world has never been the same since that night."</p>
        <p className={styles.bottomCite}>— House Crimsonveil, Year 0</p>
      </div>

      <footer className={styles.footer}>
        DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream
      </footer>
    </>
  );
}
