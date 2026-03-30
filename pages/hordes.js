import Head from 'next/head';
import Navbar from '../components/Navbar';
import { getHordes } from '../lib/hordes';
import styles from '../styles/Hordes.module.css';

export async function getStaticProps() {
  try {
    const hordes = await getHordes();
    return { props: { hordes }, revalidate: 60 };
  } catch (err) {
    console.error('Hordes fetch error:', err);
    return { props: { hordes: [] }, revalidate: 60 };
  }
}

export default function HordesPage({ hordes }) {
  return (
    <>
      <Head>
        <title>Hordes — DawnDream</title>
        <meta name="description" content="Rebel hordes outside the Eternal Throne — DawnDream." />
      </Head>

      <Navbar activePage="hordes" />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Outside the Eternal Throne</p>
        <h1 className={styles.heroTitle}>Hordes</h1>
        <p className={styles.heroSub}>They bow to no crown. They answer to no law. They are the eternal rebellion.</p>
        <div className={styles.heroDivider} />
        <p className={styles.heroIntro}>Hordes do not swear allegiance to the Eternal Throne — they are rebels against it, living an anarchist existence and defying the great laws of the throne. They are feared, hunted, and impossible to destroy.</p>
      </section>

      <div className={styles.warningBar}>
        ⚠ These factions operate outside the law of the Eternal Throne — they are not recognised, not protected, and not forgiven.
      </div>

      <div className={styles.body}>
        <p className={styles.sectionHead}>Known Hordes</p>

        {hordes.length === 0 && (
          <p style={{ color: '#7a5a50', fontStyle: 'italic' }}>No hordes yet — add them in your Notion database!</p>
        )}

        <div className={styles.hordesGrid}>
          {hordes.map((horde) => (
            <div key={horde.id} className={styles.hordeCard}>
              <div className={styles.hordeHeader}>
                {horde.bannerImage ? (
                  <img src={horde.bannerImage} alt={horde.name} className={styles.hordeBanner} />
                ) : (
                  <div className={styles.hordeBannerPlaceholder}>Banner</div>
                )}
                <div className={styles.hordeInfo}>
                  <div className={styles.hordeTop}>
                    <span className={styles.hordeName}>{horde.name}</span>
                    <span className={styles.rebelTag}>Rebel Horde</span>
                  </div>
                  <div className={styles.hordeRanks}>
                    <span className={`${styles.rankPill} ${styles.rankWl} ${!horde.warLord ? styles.rankEmpty : ''}`}>
                      ⚔ WarLord: {horde.warLord || 'None'}
                    </span>
                    <span className={`${styles.rankPill} ${styles.rankFb} ${!horde.firebrand ? styles.rankEmpty : ''}`}>
                      Firebrand: {horde.firebrand || 'None'}
                    </span>
                    <span className={`${styles.rankPill} ${styles.rankRv} ${!horde.ravager ? styles.rankEmpty : ''}`}>
                      Ravager: {horde.ravager || 'None'}
                    </span>
                  </div>
                  {horde.lore && <p className={styles.hordeLore}>{horde.lore}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className={styles.footer}>
        DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream
      </footer>
    </>
  );
}
