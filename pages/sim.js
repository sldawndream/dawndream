import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import styles from '../styles/Sim.module.css';

const locations = [
  {
    num: 'I',
    name: 'The Estate',
    desc: 'The manor itself — built on the cliff above the river, its red-lit windows watching over the mist-covered grounds below.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722456/ChatGPT_Image_May_3_2026_03_30_34_PM_uqveui.png',
  },
  {
    num: 'II',
    name: 'The Aerial View',
    desc: 'From above — paths, gardens, the river and the canopy revealed. The full shape of DawnDream under one moon.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722457/ChatGPT_Image_May_3_2026_03_31_38_PM_npoi8s.png',
  },
  {
    num: 'III',
    name: 'The Forest Path',
    desc: 'Ancient trees arch over the glowing cobblestone road — fireflies drift between the roots as the manor windows glow beyond.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722463/ChatGPT_Image_May_3_2026_03_32_43_PM_iopijp.png',
  },
  {
    num: 'IV',
    name: 'The Moonlit Terrace',
    desc: 'Under the full moon, lanterns flicker beside the lily pool — a place of quiet gathering where the night breathes.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722458/ChatGPT_Image_May_3_2026_03_33_47_PM_mhqk1e.png',
  },
  {
    num: 'V',
    name: 'The Lantern Avenue',
    desc: 'Ornate lampposts line the cobblestone path through the palms, leading toward the cathedral spire glowing red above.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722464/ChatGPT_Image_May_3_2026_03_34_44_PM_kpzpcw.png',
  },
  {
    num: 'VI',
    name: 'The Crimson Path',
    desc: 'Red lanterns mark the winding stone road through overgrown arches — the castle looms in the mist beyond.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722464/ChatGPT_Image_May_3_2026_03_37_21_PM_xrjnle.png',
  },
  {
    num: 'VII',
    name: "The Warden's Bridge",
    desc: 'Two stone guardians stand at the iron gate — hooded, silent, eternal. None pass without purpose.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722461/ChatGPT_Image_May_3_2026_03_58_23_PM_gwozwc.png',
  },
  {
    num: 'VIII',
    name: 'The Waterfall Pools',
    desc: 'Still water, lily pads and candlelight — a hidden sanctuary behind the rose arch at the edge of the grounds.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722461/ChatGPT_Image_May_3_2026_03_59_06_PM_q8kddi.png',
  },
  {
    num: 'IX',
    name: 'The Altar Garden',
    desc: 'Marble statues flank the altar beneath weeping willows. This is where oaths are spoken and blood is pledged.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722464/ChatGPT_Image_May_3_2026_04_00_12_PM_uzy7uc.png',
  },
  {
    num: 'X',
    name: 'The Garden Terrace',
    desc: 'Wrought iron chairs sit beneath the blossom trees beside the stone wall — a rare place of stillness in the eternal night.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722465/ChatGPT_Image_May_3_2026_04_01_18_PM_duvjcn.png',
  },
  {
    num: 'XI',
    name: 'The Cathedral',
    desc: 'The tallest structure in DawnDream — its crimson stained glass bleeds light into the mountains and the eternal dark below.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722466/ChatGPT_Image_May_3_2026_04_02_47_PM_wjfd31.png',
  },
  {
    num: 'XII',
    name: 'The Blossom Court',
    desc: 'Cherry trees in pale bloom surround the waterfall terrace — beauty and shadow in equal measure.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722468/ChatGPT_Image_May_3_2026_04_04_02_PM_bs04m1.png',
  },
  {
    num: 'XIII',
    name: 'The Blood Fountain Court',
    desc: 'At the centre of the grounds stands the blood fountain — a crimson beacon visible from every corner of the sim.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722468/ChatGPT_Image_May_3_2026_04_05_10_PM_vecbqu.png',
  },
  {
    num: 'XIV',
    name: 'The Crimson Falls',
    desc: 'Twin waterfalls cascade into a pool of dark water — red lanterns float on the surface among blood-red lotus blooms.',
    url: 'https://res.cloudinary.com/dsrincyog/image/upload/v1778722468/ChatGPT_Image_May_3_2026_04_06_17_PM_qkexyl.png',
  },
];

const SL_URL = 'http://maps.secondlife.com/secondlife/Los%20Santoz/73/104/31';

export default function SimPage() {
  const router  = useRouter();
  const [player, setPlayer]   = useState(undefined); // undefined = loading
  const [current, setCurrent] = useState(0);
  const [fading, setFading]   = useState(false);

  useEffect(() => {
    fetch('/api/session')
      .then(r => r.json())
      .then(data => setPlayer(data.player || null))
      .catch(() => setPlayer(null));
  }, []);

  function select(i) {
    if (i === current) return;
    setFading(true);
    setTimeout(() => { setCurrent(i); setFading(false); }, 350);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') select((current + 1) % locations.length);
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  select((current - 1 + locations.length) % locations.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current]);

  // ── Loading state ──
  if (player === undefined) {
    return (
      <>
        <Head><title>The Sim — DawnDream</title></Head>
        <Navbar activePage="sim" />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: '#3a1418', letterSpacing: '0.2em' }}>
            LOADING...
          </p>
        </div>
      </>
    );
  }

  // ── Not logged in → redirect to login ──
  if (!player) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  const isAdmin = player.role === 'admin' || player.role === 'owner';

  // ── Logged in but not admin → Under Construction ──
  if (!isAdmin) {
    return (
      <>
        <Head><title>The Sim — DawnDream</title></Head>
        <Navbar activePage="sim" />
        <div className={styles.underConstruction}>
          <div className={styles.ucCard}>
            <div className={styles.ucDrop} />
            <p className={styles.ucPre}>The Lands of DawnDream</p>
            <h1 className={styles.ucTitle}>Under Construction</h1>
            <div className={styles.ucRule} />
            <p className={styles.ucDesc}>
              The council is still laying the stones of this place.<br />
              Return when the torches are lit — the grounds will open soon.
            </p>
            <Link href="/" className={styles.ucBtn}>Return to the Coven →</Link>
          </div>
        </div>
        <footer className={styles.footer}>
          DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream
        </footer>
      </>
    );
  }

  // ── Admin → full page ──
  const loc = locations[current];

  return (
    <>
      <Head>
        <title>The Sim — DawnDream</title>
        <meta name="description" content="Explore the eternal grounds of DawnDream — a gothic vampire sim in Second Life." />
      </Head>
      <Navbar activePage="sim" />

      {/* Admin-only banner */}
      <div className={styles.adminBanner}>
        ⚙ Admin preview — this page is under construction and not yet visible to players
      </div>

      {/* ── Title ── */}
      <div className={styles.pageTitle}>
        <p className={styles.heroPre}>Second Life · Gothic Vampire RPG</p>
        <h1 className={styles.heroTitle}>
          The Lands of <span className={styles.heroRed}>DawnDream</span>
        </h1>
        <p className={styles.heroSub}>Walk the eternal grounds — fourteen locations, one endless night.</p>
      </div>

      {/* ── Tour ── */}
      <div className={styles.tour}>
        <nav className={styles.sidebar}>
          <p className={styles.sidebarHead}>Locations</p>
          {locations.map((l, i) => (
            <button
              key={i}
              className={`${styles.navItem} ${i === current ? styles.navActive : ''}`}
              onClick={() => select(i)}
            >
              <span className={styles.navNum}>{l.num}</span>
              <span className={styles.navLabel}>{l.name}</span>
              <span className={styles.navDot} />
            </button>
          ))}
        </nav>

        <div className={styles.panel}>
          {locations.map((l, i) => (
            <img
              key={i}
              src={l.url}
              alt={l.name}
              className={`${styles.panelImg} ${i === current && !fading ? styles.panelVisible : ''}`}
            />
          ))}
          <div className={styles.panelOverlay} />
          <div className={`${styles.panelContent} ${fading ? styles.panelFade : ''}`}>
            <p className={styles.panelNum}>{loc.num}</p>
            <h2 className={styles.panelName}>{loc.name}</h2>
            <div className={styles.panelRule} />
            <p className={styles.panelDesc}>{loc.desc}</p>
          </div>
        </div>
      </div>

      {/* ── Visit bar ── */}
      <div className={styles.visitBar}>
        <div>
          <p className={styles.visitTitle}>Visit DawnDream in Second Life</p>
          <p className={styles.visitSub}>Open to all approved members — the gates are always open under the moon.</p>
        </div>
        <a href={SL_URL} className={styles.visitBtn}>Teleport to DawnDream →</a>
      </div>

      <footer className={styles.footer}>
        DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream
      </footer>
    </>
  );
}
