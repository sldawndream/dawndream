import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import { getPlayerFromRequest } from '../lib/auth';
import { createClient } from '@supabase/supabase-js';
import styles from '../styles/EternalPress.module.css';

export async function getServerSideProps({ req }) {
  const session = await getPlayerFromRequest(req);
  if (!session) {
    return { redirect: { destination: '/login?next=/eternal-press', permanent: false } };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: articles } = await supabase
    .from('eternal-press_articles')
    .select('id,title,category,excerpt,body,cover_image,author_name,featured,issue_number,issue_date,published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  // Get current player role
  const { data: players } = await supabase
    .from('players')
    .select('role')
    .eq('id', session.id);

  const role = players?.[0]?.role || 'player';

  return { props: { articles: articles || [], role } };
}

const CATEGORIES = ['All', 'Breaking', 'War', 'Politics', 'Society', 'Mystery', 'Announcement', 'General'];

const categoryStyles = {
  Breaking: styles.catBreaking,
  War: styles.catWar,
  Politics: styles.catPolitics,
  Society: styles.catSociety,
  Mystery: styles.catMystery,
  Announcement: styles.catAnnouncement,
  General: styles.catGeneral,
};

export default function EternalPressPage({ articles, role }) {
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState(null);

  const featured = articles.find(a => a.featured) || articles[0];
  const rest = articles.filter(a => a.id !== featured?.id);

  const filtered = filter === 'All' ? rest : rest.filter(a => a.category === filter);

  const latestIssue = articles[0]?.issue_number
    ? `Issue ${articles[0].issue_number} · ${articles[0].issue_date}`
    : null;

  const canWrite = role === 'reporter' || role === 'admin';

  return (
    <>
      <Head>
        <title>The Eternal Press — DawnDream</title>
        <meta name="description" content="News, rumours and declarations from within the DawnDream covenant." />
      </Head>

      <Navbar activePage="eternal-press" />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Dispatches from the Eternal Dark</p>
        <h1 className={styles.heroTitle}>The Eternal Press</h1>
        <p className={styles.heroSub}>News, rumours and declarations from within the DawnDream covenant.</p>
        <div className={styles.heroDivider} />
        <p className={styles.heroIntro}>
          Every shadow has a story. Every blood pact leaves a trace. The Eternal Press records it all — from the fall of houses to the rise of new bloodlines.
        </p>
        {latestIssue && (
          <div className={styles.issueBadge}>
            <span className={styles.issueLabel}>Issue</span>
            <span className={styles.issueNum}>{latestIssue}</span>
          </div>
        )}
        {canWrite && (
          <Link href="/eternal-press-editor" className={styles.writeBtn}>
            ✒ Write an Article
          </Link>
        )}
      </section>

      <div className={styles.body}>

        {/* Featured article */}
        {featured && (
          <>
            <p className={styles.sectionHead}>Featured</p>
            <div className={styles.featuredCard}>
              {featured.cover_image && (
                <img src={featured.cover_image} alt={featured.title} className={styles.featuredImg} />
              )}
              {!featured.cover_image && (
                <div className={styles.featuredImgPlaceholder}>The Eternal Press</div>
              )}
              <div className={styles.featuredBody}>
                <span className={`${styles.catPill} ${categoryStyles[featured.category] || styles.catGeneral}`}>
                  {featured.category}
                </span>
                <h2 className={styles.featuredTitle}>{featured.title}</h2>
                <div className={styles.articleMeta}>
                  <span>By {featured.author_name}</span>
                  <span className={styles.metaDot} />
                  <span>{featured.published_at ? new Date(featured.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
                </div>
                <p className={styles.articleExcerpt}>{featured.excerpt || featured.body.slice(0, 200) + '…'}</p>
                {expanded === featured.id ? (
                  <div className={styles.articleBody}>
                    {featured.body.split('\n').filter(p => p.trim()).map((p, i) => <p key={i}>{p}</p>)}
                    <button className={styles.readMore} onClick={() => setExpanded(null)}>Close ↑</button>
                  </div>
                ) : (
                  <button className={styles.readMore} onClick={() => setExpanded(featured.id)}>
                    Read Full Article →
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Category filter */}
        {rest.length > 0 && (
          <>
            <div className={styles.filterRow}>
              <p className={styles.sectionHead} style={{ margin: 0 }}>More Articles</p>
              <div className={styles.filters}>
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    className={`${styles.filterBtn} ${filter === c ? styles.filterActive : ''}`}
                    onClick={() => setFilter(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.grid}>
              {filtered.map(article => (
                <div key={article.id} className={styles.articleCard}>
                  {article.cover_image && (
                    <img src={article.cover_image} alt={article.title} className={styles.cardImg} />
                  )}
                  <div className={styles.cardBody}>
                    <span className={`${styles.catPill} ${categoryStyles[article.category] || styles.catGeneral}`}>
                      {article.category}
                    </span>
                    <h3 className={styles.cardTitle}>{article.title}</h3>
                    <div className={styles.articleMeta}>
                      <span>By {article.author_name}</span>
                      <span className={styles.metaDot} />
                      <span>{article.published_at ? new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : ''}</span>
                    </div>
                    <p className={styles.cardExcerpt}>{article.excerpt || article.body.slice(0, 120) + '…'}</p>

                    {expanded === article.id ? (
                      <div className={styles.articleBody}>
                        {article.body.split('\n').filter(p => p.trim()).map((p, i) => <p key={i}>{p}</p>)}
                        <button className={styles.readMore} onClick={() => setExpanded(null)}>Close ↑</button>
                      </div>
                    ) : (
                      <button className={styles.readMore} onClick={() => setExpanded(article.id)}>
                        Read Full Article →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className={styles.empty}>
                <p>No articles in this category yet.</p>
              </div>
            )}
          </>
        )}

        {articles.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📜</span>
            <p className={styles.emptyTitle}>The presses are silent</p>
            <p className={styles.emptySub}>No dispatches have been published yet. The first edition is being prepared.</p>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        The Eternal Press &nbsp;·&nbsp; DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG
      </footer>
    </>
  );
}
