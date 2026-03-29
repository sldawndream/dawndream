import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { getClans } from '../lib/clans';
import styles from '../styles/Clans.module.css';

export async function getStaticProps() {
  try {
    const clans = await getClans();
    return { props: { clans }, revalidate: 60 };
  } catch (err) {
    console.error('Clans fetch error:', err);
    return { props: { clans: [] }, revalidate: 60 };
  }
}

export default function ClansPage({ clans }) {
  return (
    <>
      <Head>
        <title>Clans & Houses — DawnDream</title>
        <meta name="description" content="The great houses of DawnDream — bound by blood, divided by pride." />
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
        <aside className={styles.sidebar}>
          <p className={styles.sidebarTitle}>The Houses</p>
          {clans.map((clan) => (
            <a key={clan.id} href={`#${clan.id}`} className={styles.clanLink}>
              {clan.name}
              <span className={styles.clanLinkSub}>{clan.status} · {clan.generation}</span>
            </a>
          ))}
          {clans.length === 0 && (
            <p style={{ color: '#5a3028', fontSize: '12px', fontStyle: 'italic', padding: '8px 12px' }}>No clans yet</p>
          )}
        </aside>

        <main className={styles.content}>
          <p className={styles.sectionHead}>Chronicle of the Houses</p>
          {clans.length === 0 && (
            <p style={{ color: '#7a5a50', fontStyle: 'italic' }}>No clan entries yet — add them in your Notion database!</p>
          )}
          <div className={styles.timeline}>
            {clans.map((clan, i) => (
              <div key={clan.id}>
                <article id={clan.id} className={styles.clanEntry}>
                  <div className={`${styles.dot} ${clan.major ? styles.dotMajor : ''}`}>
                    <div className={styles.dotInner} />
                  </div>
                  {clan.bannerImage ? (
                    <img src={clan.bannerImage} alt={clan.name} className={styles.banner} />
                  ) : (
                    <div className={styles.bannerPlaceholder}>Clan Banner</div>
                  )}
                  <div className={styles.tags}>
                    <span className={`${styles.tag} ${styles[clan.statusStyle]}`}>{clan.status}</span>
                  </div>
                  <h2 className={styles.clanName}>{clan.name}</h2>
                  {clan.motto && <p className={styles.motto}>{clan.motto}</p>}
                  <div className={styles.history}>
                    {clan.history.split('\n').filter(Boolean).map((para, j) => (
                      <p key={j}>{para}</p>
                    ))}
                  </div>
                  <div className={styles.metaGrid}>
                    {clan.founder && <div className={styles.metaCard}><p className={styles.metaLabel}>Founder</p><p className={styles.metaValue}>{clan.founder}</p></div>}
                    {clan.generation && <div className={styles.metaCard}><p className={styles.metaLabel}>Generation</p><p className={styles.metaValue}>{clan.generation}</p></div>}
                    {clan.houses && (
                      <div className={styles.metaCard}>
                        <p className={styles.metaLabel}>Houses</p>
                        <div className={styles.housesList}>
                          {clan.houses.split(',').map((house) => (
                            <span key={house} className={styles.housePill}>{house.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {clan.clanStatus && (
                      <div className={styles.metaCard}>
                        <p className={styles.metaLabel}>Status</p>
                        <p className={styles.metaValue} style={{ color: clan.clanStatus === 'Active' ? '#60a880' : clan.clanStatus === 'Fallen' ? '#9090c0' : '#c07030' }}>{clan.clanStatus}</p>
                      </div>
                    )}
                  </div>
                  {(clan.allies || clan.enemies) && (
                    <div className={styles.relations}>
                      {clan.allies && (
                        <>
                          <span className={styles.relLabel}>Allies</span>
                          {clan.allies.split(',').map((a) => (
                            <span key={a} className={`${styles.relPill} ${styles.ally}`}>{a.trim()}</span>
                          ))}
                        </>
                      )}
                      {clan.enemies && (
                        <>
                          <span className={styles.relLabel} style={{ marginLeft: clan.allies ? '8px' : '0' }}>Enemies</span>
                          {clan.enemies.split(',').map((e) => (
                            <span key={e} className={`${styles.relPill} ${styles.enemy}`}>{e.trim()}</span>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </article>
                {i < clans.length - 1 && <div className={styles.separator} />}
              </div>
            ))}
          </div>
        </main>
      </div>

      <footer className={styles.footer}>
        DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All lore © DawnDream
      </footer>
    </>
  );
}
