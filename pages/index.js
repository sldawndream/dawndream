import Head from 'next/head';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import { getLoreEntries, getEras, getLycanLoreEntries, getLycanEras } from '../lib/notion';
import styles from '../styles/Lore.module.css';

export async function getServerSideProps() {
  try {
    const [entries, eras, lycanEntries, lycanEras] = await Promise.all([
      getLoreEntries(),
      getEras(),
      getLycanLoreEntries(),
      getLycanEras(),
    ]);
    return { props: { entries, eras, lycanEntries, lycanEras } };
  } catch (err) {
    console.error('Notion fetch error:', err);
    return { props: { entries: [], eras: [], lycanEntries: [], lycanEras: [] } };
  }
}

function TimelineContent({ entries, eras, isLycan }) {
  return (
    <>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <p className={styles.sidebarTitle}>{isLycan ? 'Eras of the Pack' : 'Eras of History'}</p>
          {eras.map((era) => (
            <a key={era.id} href={`#${era.id}`} className={`${styles.eraLink} ${isLycan ? styles.eraLinkLycan : ''}`}>
              {era.label}
              <span className={styles.eraYear}>{era.year}</span>
            </a>
          ))}
        </aside>

        <main className={styles.content}>
          <p className={styles.sectionHead}>{isLycan ? 'Timeline of the Pack' : 'Timeline of the Bloodlines'}</p>
          {entries.length === 0 && (
            <p style={{ color: isLycan ? '#1a4a6a' : '#7a5a50', fontStyle: 'italic' }}>
              No lore entries yet — add them in your Notion database!
            </p>
          )}
          <div className={`${styles.timeline} ${isLycan ? styles.timelineLycan : ''}`}>
            {entries.map((entry, i) => (
              <div key={entry.id}>
                <article id={entry.eraId} className={styles.entry}>
                  <div className={`${styles.dot} ${entry.major ? (isLycan ? styles.dotMajorLycan : styles.dotMajor) : ''} ${isLycan ? styles.dotLycan : ''}`}>
                    <div className={styles.dotInner} />
                  </div>
                  {entry.coverImage && (
                    <img src={entry.coverImage} alt={entry.title} className={styles.coverImage} />
                  )}
                  <p className={styles.entryEra}>{entry.era}</p>
                  <p className={`${styles.entryYear} ${isLycan ? styles.entryYearLycan : ''}`}>{entry.year}</p>
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
                    <blockquote className={`${styles.quote} ${isLycan ? styles.quoteLycan : ''}`}>
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
    </>
  );
}

export default function LorePage({ entries, eras, lycanEntries, lycanEras }) {
  const [race, setRace] = useState('vampire');
  const isLycan = race === 'lycan';

  return (
    <>
      <Head>
        <title>Lore & History — DawnDream</title>
        <meta name="description" content="The chronicles of DawnDream — origins, wars, and bloodlines." />
      </Head>

      <Navbar activePage="lore" />

      {/* ── Race switcher ── */}
      <div className={styles.raceBar}>
        <button
          className={`${styles.raceBtn} ${!isLycan ? styles.raceBtnVampActive : ''}`}
          onClick={() => setRace('vampire')}
        >
          <span className={styles.raceBtnLabel}>Vampire</span>
          <span className={styles.raceBtnSub}>Children of the Night</span>
        </button>
        <button
          className={`${styles.raceBtn} ${isLycan ? styles.raceBtnLycanActive : ''}`}
          onClick={() => setRace('lycan')}
        >
          <span className={`${styles.raceBtnLabel} ${styles.raceBtnLabelLycan}`}>Lycan</span>
          <span className={`${styles.raceBtnSub} ${styles.raceBtnSubLycan}`}>Children of the Moon</span>
        </button>
      </div>

      {/* ── Hero ── */}
      <section className={`${styles.hero} ${isLycan ? styles.heroLycan : ''}`}>
        <p className={styles.eyebrow}>{isLycan ? 'The Ancient Pack Scrolls' : 'The Sacred Texts of DawnDream'}</p>
        <h1 className={styles.heroTitle}>{isLycan ? 'Origins of the Wolf-Blooded' : 'Origins of the DawnDream'}</h1>
        <p className={styles.heroSub}>{isLycan ? 'Before the first howl — the moon chose its children long before the vampires built their throne.' : 'From the first darkness, they were born — and the world has never been the same.'}</p>
        <div className={`${styles.heroDivider} ${isLycan ? styles.heroDividerLycan : ''}`} />
        <p className={styles.heroIntro}>{isLycan ? 'What follows are the recorded chronicles of the wolf-blooded — the first change, the pack laws, the great hunts, and the bloodlines that shape every lycan who walks beneath the eternal moon.' : 'What follows are the recorded chronicles of DawnDream — the ancient covenant, the great wars, the betrayals, and the bloodlines that shape every soul who walks beneath the eternal night.'}</p>
      </section>

      <TimelineContent
        entries={isLycan ? lycanEntries : entries}
        eras={isLycan ? lycanEras : eras}
        isLycan={isLycan}
      />

      <footer className={styles.footer}>
        DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All lore © DawnDream
      </footer>
    </>
  );
}
