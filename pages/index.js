import Head from 'next/head';
import Navbar from '../components/Navbar';
import { loreData } from '../lib/lore';
import styles from '../styles/Lore.module.css';

export default function LorePage() {
  const { title, subtitle, intro, eras, entries } = loreData;

  return (
    <>
      <Head>
        <title>Lore & History — DawnDream</title>
        <meta name="description" content="The chronicles of DawnDream — origins, wars, and bloodlines." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>The Sacred Texts of DawnDream</p>
        <h1 className={styles.heroTitle}>{title}</h1>
        <p className={styles.heroSub}>{subtitle}</p>
        <div className={styles.heroDivider} />
        <p className={styles.heroIntro}>{intro}</p>
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
          <div className={styles.timeline}>
            {entries.map((entry, i) => (
              <div key={entry.id}>
                <article id={entry.eraId} className={styles.entry}>
                  <div className={`${styles.dot} ${entry.major ? styles.dotMajor : ''}`}>
                    <div className={styles.dotInner} />
                  </div>
                  <p className={styles.entryEra}>{entry.era}</p>
                  <p className={styles.entryYear}>{entry.year}</p>
                  <div className={styles.tags}>
                    <span className={`${styles.tag} ${styles[entry.tagStyle]}`}>{entry.tag}</span>
                    {entry.tag2 && <span className={`${styles.tag} ${styles[entry.tag2Style]}`}>{entry.tag2}</span>}
                  </div>
                  <h2 className={styles.entryTitle}>{entry.title}</h2>
                  <div className={styles.entryBody}>
                    {entry.body.map((para, j) => <p key={j}>{para}</p>)}
                  </div>
                  {entry.quote && (
                    <blockquote className={styles.quote}>
                      {entry.quote.text}
                      <cite>{entry.quote.author}</cite>
                    </blockquote>
                  )}
                  {entry.figures && (
                    <div className={styles.figureRow}>
                      {entry.figures.map((fig) => (
                        <div key={fig.name} className={styles.figureCard}>
                          <p className={styles.figureName}>{fig.name}</p>
                          <p className={styles.figureRole}>{fig.role}</p>
                          <p className={styles.figureDesc}>{fig.desc}</p>
                        </div>
                      ))}
                    </div>
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
