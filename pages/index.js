import Head from 'next/head';
import Navbar from '../components/Navbar';
import { getLoreEntries, getEras } from '../lib/notion';
import styles from '../styles/Lore.module.css';

export async function getStaticProps() {
  try {
    const entries = await getLoreEntries();
    const eras = await getEras();
    return {
      props: { entries, eras },
      revalidate: 60,
    };
  } catch (err) {
    console.error('Notion fetch error:', err);
    return { props: { entries: [], eras: [] }, revalidate: 60 };
  }
}

export default function LorePage({ entries, eras }) {
  return (
    <>
      <Head>
        <title>Lore & History — DawnDream</title>
        <meta name="description" content="The chronicles of DawnDream — origins, wars, and bloodlines." />
      </Head>

      <Navbar />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>The Sacred Texts of DawnDream</p>
        <h1 className={styles.heroTitle}>Origins of the Bloodlines</h1>
        <p className={styles.heroSub}>From the first darkness, they were born — and the world has never been the same.</p>
        <div className={styles.heroDivider} />
        <p className={styles.heroIntro}>What follows are the recorded chronicles of DawnDream — the ancient covenant, the great wars, the betrayals, and the bloodlines that shape every soul who walks beneath the eternal night.</p>
      </section>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <p className={styles.sidebarTitle}>Eras of History</p>
          {eras.map((era) => (
            <a key={era.id} href={`#${era.id}`} className={styles.eraLink}>
              {era.label}
              <span className={styles.eraYear}>{era.year}</span>
            </a>
          ))}
        </aside>

        <main className={styles.content}>
          <p className={styles.sectionHead}>Timeline of the Bloodlines</p>
          {entries.length === 0 && (
            <p style={{ color: '#7a5a50', fontStyle: 'italic' }}>No lore entries yet — add them in your Notion database!</p>
          )}
          <div className={styles.timeline}>
            {entries.map((entry, i) => (
              <div key={entry.id}>
                <article id={entry.eraId} className={styles.entry}>
                  <div className={`${styles.dot} ${entry.major ? styles.dotMajor : ''}`}>
                    <div className={styles.dotInner} />
                  </div>
                  {entry.coverImage && (
                    <img src={entry.coverImage} alt={entry.title} className={styles.coverImage} />
                  )}
                  <p className={styles.entryEra}>{entry.era}</p>
                  <p className={styles.entryYear}>{entry.year}</p>
                  <div className={styles.tags}>
                    {entry.tag && <span className={`${styles.tag} ${styles[entry.tagStyle]}`}>{entry.tag}</span>}
                    {entry.tag2 && <span className={`${styles.tag} ${styles[entry.tag2Style]}`}>{entry.tag2}</span>}
                  </div>
                  <h2 className={styles.entryTitle}>{entry.title}</h2>
                  <div className={styles.entryBody}>
                    {entry.body.split('\n').filter(Boolean).map((para, j) => (
                      <p key={j}>{para}</p>
                    ))}
                  </div>
                  {entry.quote && (
                    <blockquote className={styles.quote}>
                      {entry.quote}
                      {entry.quoteAuthor && <cite>{entry.quoteAuthor}</cite>}
                    </blockquote>
                  )}
                </article>
                {i < entries.length - 1 && <div className={styles.separator} />}
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
