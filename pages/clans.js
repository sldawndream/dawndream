import Head from 'next/head';
import Navbar from '../components/Navbar';
import AuthGuard from '../components/AuthGuard';
import { getClans } from '../lib/clans';
import styles from '../styles/Clans.module.css';

export async function getServerSideProps() {
  try {
    const clans = await getClans();
    return { props: { clans } };
  } catch (err) {
    return { props: { clans: [] } };
  }
}

export default function ClansPage({ clans }) {
  return (
    <>
      <Head>
        <title>Clans — DawnDream</title>
        <meta name="description" content="The great clans of DawnDream." />
      </Head>
      <Navbar activePage="clans" />
      <AuthGuard>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Sworn to the Eternal Throne</p>
          <h1 className={styles.heroTitle}>Clans</h1>
          <p className={styles.heroSub}>Bound by ancient oath, united beneath a singular and eternal will.</p>
          <div className={styles.heroDivider} />
          <p className={styles.heroIntro}>The Clans stand bound by ancient oath to the Eternal Throne, their loyalty etched in blood and time itself. Unlike the scattered Horde, they do not wander in defiance, but rise in unity beneath a singular will. Each Clan upholds a sacred order, living not in chaos, but in discipline forged through centuries of dominion. The great laws of the Throne are not questioned — they are revered, enforced, and carried through generations like an unbroken covenant. Where others rebel and fade, the Clans endure, eternal in purpose, guardians of a legacy that neither fear nor rebellion can unravel.</p>
        </section>

        <div className={styles.throneBar}>
          ✦ These factions stand in absolute allegiance to the Eternal Throne — recognised, protected, and bound by the ancient covenant.
        </div>

        <div className={styles.body}>
          <p className={styles.sectionHead}>Active Clans of DawnDream</p>
          {clans.length === 0 && <p style={{ color: '#7a5a50', fontStyle: 'italic' }}>No clans yet.</p>}
          <div className={styles.clansGrid}>
            {clans.map((clan) => (
              <div key={clan.id} className={styles.clanCard}>
                {clan.bannerImage ? (
                  <img src={clan.bannerImage} alt={clan.name} className={styles.clanBanner} />
                ) : (
                  <div className={styles.clanBannerPlaceholder}>Banner</div>
                )}
                <div className={styles.clanInfo}>
                  <div className={styles.clanTop}>
                    <span className={styles.clanName}>{clan.name}</span>
                    {clan.founded && <span className={styles.clanFounded}>Founded {clan.founded}</span>}
                  </div>
                  <div className={styles.clanRanks}>
                    <span className={`${styles.rankPill} ${styles.rankHc} ${!clan.highCommander ? styles.rankEmpty : ''}`}>⚔ High Commander: {clan.highCommander || 'None'}</span>
                    <span className={`${styles.rankPill} ${styles.rankBg} ${!clan.bloodGeneral ? styles.rankEmpty : ''}`}>Blood General: {clan.bloodGeneral || 'None'}</span>
                    <span className={`${styles.rankPill} ${styles.rankWc} ${!clan.warCaptain ? styles.rankEmpty : ''}`}>War Captain: {clan.warCaptain || 'None'}</span>
                  </div>
                  {clan.lore && <p className={styles.clanLore}>{clan.lore}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className={styles.footer}>
          DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream
        </footer>
      </AuthGuard>
    </>
  );
}
