import Head from 'next/head';
import Navbar from '../components/Navbar';
import { getClans, getHouses } from '../lib/clans';
import styles from '../styles/Clans.module.css';

export async function getStaticProps() {
  try {
    const [clans, houses] = await Promise.all([getClans(), getHouses()]);
    return { props: { clans, houses }, revalidate: 60 };
  } catch (err) {
    console.error('Clans fetch error:', err);
    return { props: { clans: [], houses: [] }, revalidate: 60 };
  }
}

export default function ClansPage({ clans, houses }) {
  function getHousesForClan(clanName) {
    return houses.filter(h => h.clan.toLowerCase().trim() === clanName.toLowerCase().trim());
  }

  return (
    <>
      <Head>
        <title>Clans & Houses — DawnDream</title>
        <meta name="description" content="The great clans and houses of DawnDream." />
      </Head>

      <Navbar activePage="clans" />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>The Houses of DawnDream</p>
        <h1 className={styles.heroTitle}>Clans & Houses</h1>
        <p className={styles.heroSub}>Bound by blood, divided by pride — the great houses of the eternal night.</p>
        <div className={styles.heroDivider} />
        <p className={styles.heroIntro}>Each clan carries its own history, its own wounds, and its own ambitions. To know the houses is to understand the war that never truly ended.</p>
      </section>

      <div className={styles.body}>
        <p className={styles.sectionHead}>Active Clans of DawnDream</p>

        {clans.length === 0 && (
          <p style={{ color: '#7a5a50', fontStyle: 'italic' }}>No clans yet — add them in your Notion database!</p>
        )}

        <div className={styles.clansGrid}>
          {clans.map((clan) => {
            const clanHouses = getHousesForClan(clan.name);
            return (
              <div key={clan.id} className={styles.clanCard}>
                <details>
                  <summary className={styles.clanHeader}>
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
                        <span className={`${styles.rankPill} ${styles.rankHc} ${!clan.highCommander ? styles.rankEmpty : ''}`}>
                          ⚔ High Commander: {clan.highCommander || 'None'}
                        </span>
                        <span className={`${styles.rankPill} ${styles.rankBg} ${!clan.bloodGeneral ? styles.rankEmpty : ''}`}>
                          Blood General: {clan.bloodGeneral || 'None'}
                        </span>
                        <span className={`${styles.rankPill} ${styles.rankWc} ${!clan.warCaptain ? styles.rankEmpty : ''}`}>
                          War Captain: {clan.warCaptain || 'None'}
                        </span>
                      </div>
                      {clan.lore && <p className={styles.clanLore}>{clan.lore}</p>}
                    </div>
                    <div className={styles.expandBtn}>
                      <div className={styles.expandIcon}>▾</div>
                      <span className={styles.houseCount}>{clanHouses.length} {clanHouses.length === 1 ? 'House' : 'Houses'}</span>
                    </div>
                  </summary>

                  <div className={styles.housesPanel}>
                    <p className={styles.housesTitle}>Clan Houses</p>
                    {clanHouses.length === 0 ? (
                      <p style={{ color: '#5a3028', fontStyle: 'italic', fontSize: '13px' }}>No houses yet — add them in Notion!</p>
                    ) : (
                      <div className={styles.housesGrid}>
                        {clanHouses.map((house) => (
                          <div key={house.id} className={styles.houseCard}>
                            <p className={styles.houseName}>{house.name}</p>
                            <div className={styles.houseRankRow}>
                              <span className={styles.rankLabel}>High Regent</span>
                              <span className={`${styles.rankName} ${!house.highRegent ? styles.rankNone : ''}`}>{house.highRegent || 'None'}</span>
                            </div>
                            <div className={styles.houseRankRow}>
                              <span className={styles.rankLabel}>Grand Consul</span>
                              <span className={`${styles.rankName} ${!house.grandConsul ? styles.rankNone : ''}`}>{house.grandConsul || 'None'}</span>
                            </div>
                            <div className={styles.houseRankRow}>
                              <span className={styles.rankLabel}>Centurion</span>
                              <span className={`${styles.rankName} ${!house.centurion ? styles.rankNone : ''}`}>{house.centurion || 'None'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      </div>

      <footer className={styles.footer}>
        DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream
      </footer>
    </>
  );
}
