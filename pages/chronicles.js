import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getChronicles } from '../lib/chronicles';
import styles from '../styles/Chronicles.module.css';

export async function getServerSideProps() {
  try {
    const chronicles = await getChronicles();
    return { props: { chronicles } };
  } catch (err) {
    console.error('Chronicles fetch error:', err);
    return { props: { chronicles: [] } };
  }
}

const categoryStyles = {
  Horror: styles.catHorror,
  War: styles.catWar,
  Romance: styles.catRomance,
  Mystery: styles.catMystery,
  Adventure: styles.catAdventure,
  Backstory: styles.catBackstory,
  Other: styles.catOther,
};

function getReaderId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('dd_reader_id');
  if (!id) {
    id = 'reader_' + Math.random().toString(36).substr(2, 16) + Date.now();
    localStorage.setItem('dd_reader_id', id);
  }
  return id;
}

export default function ChroniclesPage({ chronicles }) {
  const [expanded, setExpanded] = useState(null);
  const [readCounts, setReadCounts] = useState({});
  const [form, setForm] = useState({ title: '', author: '', category: '', story: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/get-reads')
      .then(r => r.json())
      .then(data => setReadCounts(data.counts || {}))
      .catch(() => {});
  }, []);

  async function handleExpand(storyId) {
    if (expanded === storyId) {
      setExpanded(null);
      return;
    }
    setExpanded(storyId);
    const readerId = getReaderId();
    if (!readerId) return;
    try {
      const res = await fetch('/api/track-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chronicleId: storyId, readerId }),
      });
      const data = await res.json();
      if (data.count !== undefined) {
        setReadCounts(prev => ({ ...prev, [storyId]: data.count }));
      }
    } catch {}
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.author || !form.story) return;
    setSubmitting(true);
    try {
      await fetch('/api/submit-chronicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
      setForm({ title: '', author: '', category: '', story: '' });
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  }

  return (
    <>
      <Head>
        <title>Chronicles — DawnDream</title>
        <meta name="description" content="Community stories from the DawnDream vampire RPG." />
      </Head>

      <Navbar activePage="chronicles" />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Written in Blood & Shadow</p>
        <h1 className={styles.heroTitle}>Chronicles</h1>
        <p className={styles.heroSub}>Stories told by those who live the eternal night — your words, your darkness.</p>
        <div className={styles.heroDivider} />
        <p className={styles.heroIntro}>The Chronicles are the community's own stories — tales of betrayal, war, romance and survival written by the vampires of DawnDream. Submit your story and let it live forever in the archives.</p>
      </section>

      <div className={styles.body}>
        <div className={styles.storiesCol}>
          <p className={styles.sectionHead}>Published Chronicles</p>
          {chronicles.length === 0 && (
            <p style={{ color: '#7a5a50', fontStyle: 'italic' }}>No chronicles published yet — be the first to submit!</p>
          )}
          <div className={styles.storiesList}>
            {chronicles.map((story) => (
              <div key={story.id} className={styles.storyCard}>
                <div className={styles.storyTop}>
                  <span className={styles.storyTitle}>{story.title}</span>
                  {story.category && (
                    <span className={`${styles.catPill} ${categoryStyles[story.category] || styles.catOther}`}>{story.category}</span>
                  )}
                </div>
                <div className={styles.storyMeta}>
                  <span className={styles.storyAuthor}>By {story.author}</span>
                  <span className={styles.metaDot}></span>
                  <span className={styles.readCount}>
                    👁 {readCounts[story.id] || 0} {readCounts[story.id] === 1 ? 'read' : 'reads'}
                  </span>
                </div>
                <div className={styles.storyPreview}>
                  {expanded === story.id
                    ? story.story.split('\n').filter(p => p.trim()).map((para, i) => (
                        <p key={i} style={{ marginBottom: '1em' }}>{para}</p>
                      ))
                    : <p>{story.preview}</p>
                  }
                </div>
                {expanded === story.id && (
                  <div className={styles.expandedReads}>
                    👁 {readCounts[story.id] || 0} {readCounts[story.id] === 1 ? 'unique read' : 'unique reads'}
                  </div>
                )}
                <button className={styles.readMore} onClick={() => handleExpand(story.id)}>
                  {expanded === story.id ? 'Close Story ↑' : 'Read Full Story →'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.submitCard}>
            <p className={styles.submitTitle}>Submit Your Chronicle</p>
            <p className={styles.submitSub}>Share your story with the DawnDream community. All submissions are reviewed before publishing.</p>
            {submitted ? (
              <div className={styles.successMsg}>
                <p>Your chronicle has been submitted! The DawnDream team will review it shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Story Title</label>
                  <input className={styles.formInput} name="title" value={form.title} onChange={handleChange} placeholder="Enter your story title..." required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Your Name</label>
                  <input className={styles.formInput} name="author" value={form.author} onChange={handleChange} placeholder="Your avatar name..." required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select className={styles.formSelect} name="category" value={form.category} onChange={handleChange}>
                    <option value="">Select a category...</option>
                    <option>Horror</option>
                    <option>War</option>
                    <option>Romance</option>
                    <option>Mystery</option>
                    <option>Adventure</option>
                    <option>Backstory</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Your Story</label>
                  <textarea className={styles.formTextarea} name="story" value={form.story} onChange={handleChange} placeholder="Write your story here..." required />
                </div>
                <button className={styles.submitBtn} type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Chronicle →'}
                </button>
                <p className={styles.submitNote}>Submissions are reviewed by the DawnDream team before appearing on the site.</p>
              </form>
            )}
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream
      </footer>
    </>
  );
}
