import Head from 'next/head';
import Navbar from '../components/Navbar';
import { getBloodlines } from '../lib/bloodlines';
import styles from '../styles/Bloodlines.module.css';

export async function getStaticProps() {
  try {
    const bloodlines = await getBloodlines();
    return { props: { bloodlines }, revalidate: 60 };
  } catch (err) {
    console.error('Bloodlines fetch error:', err);
    return { props: { bloodlines: [] }, revalidate: 60 };
  }
}

export default function BloodlinesPage({ bloodlines }) {
  return (
    <>
      <Head>
        <title>Bloodlines — DawnDream</title>
        <meta name="description" content="The ancient bloodlines of DawnDream." />
      </Head>

      <Navbar activePage="bloodlines" />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>The Ancient Bloodlines</p>
        <h1 className={styles.heroTitle}>Bloodlines</h1>
        <p className={styles.heroSub}>From the first turning, the blood remembers — each lineage a story written in eternity.</p>
        <div className={styles.heroDivider} />
        <p className={styles.heroIntro}>The bloodlines of DawnDream trace their origins to the oldest vampires in existence. Each carries unique power, history, and purpose — passed down through every turning since the beginning.</p>
      </section>

      <div className={styles.body}>
        <p className={styles.sectionHead}>Active Bloodlines of DawnDream</p>

        {bloodlines.length === 0 && (
          <p style={{ color: '#7a5a50', fontStyle: 'italic' }}>No bloodlines yet — add them in your Notion database!</p>
        )}

        <div className={styles.grid}>
          {bloodlines.map((bl) => (
            <div key={bl.id} className={styles.card}>
              {bl.bannerImage ? (
                <img src={bl.bannerImage} alt={bl.name} className={styles.banner} />
              ) : (
                <div className={styles.bannerPlaceholder}>Bloodline Banner</div>
              )}
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <span className={styles.blName}>{bl.name}</span>
                  {bl.founded && <span className={styles.blFounded}>Founded {bl.founded}</span>}
                </div>
                {bl.archVampire && (
                  <div className={styles.archRow}>
                    <div className={styles.archIcon}><div className={styles.archInner} /></div>
                    <div className={styles.archInfo}>
                      <p className={styles.archLabel}>Arch Vampire</p>
                      <p className={styles.archName}>{bl.archVampire}</p>
                    </div>
                  </div>
                )}
                {bl.lore && <p className={styles.blLore}>{bl.lore}</p>}
              </div>
              <div className={styles.cardFooter}>
                {bl.founded && <span className={styles.foundedPill}>Est. {bl.founded}</span>}
                <span className={styles.statusWrap}>
                  <span className={styles.statusDot}></span>
                  <span className={styles.statusLabel}>Active</span>
                </span>
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
