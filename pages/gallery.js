import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getGallery } from '../lib/gallery';
import styles from '../styles/Gallery.module.css';

export async function getServerSideProps() {
  try {
    const photos = await getGallery();
    return { props: { photos } };
  } catch (err) {
    console.error('Gallery fetch error:', err);
    return { props: { photos: [] } };
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GalleryPage({ photos }) {
  const [shuffled, setShuffled] = useState([]);
  const [current, setCurrent] = useState(0);
  const [form, setForm] = useState({ author: '', imageUrl: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const s = shuffle(photos);
    setShuffled(s);
    setCurrent(Math.floor(Math.random() * Math.max(photos.length, 1)));
  }, []);

  useEffect(() => {
    if (shuffled.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % shuffled.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [shuffled.length]);

  function goTo(n) {
    setCurrent((n + shuffled.length) % shuffled.length);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.author || !form.imageUrl) return;
    setSubmitting(true);
    try {
      await fetch('/api/submit-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
      setForm({ author: '', imageUrl: '' });
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  }

  return (
    <>
      <Head>
        <title>Gallery — DawnDream</title>
        <meta name="description" content="Community gallery — moments captured by the DawnDream community." />
      </Head>

      <Navbar activePage="gallery" />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>The DawnDream Community</p>
        <h1 className={styles.heroTitle}>Gallery</h1>
        <p className={styles.heroSub}>Moments captured by the eternal — our world through your eyes.</p>
        <div className={styles.heroDivider} />
        <p className={styles.heroIntro}>Every image here was taken by a member of the DawnDream community. These are your moments, your stories, your eternal night.</p>
      </section>

      {shuffled.length === 0 ? (
        <div className={styles.empty}>
          <p>No photos yet — be the first to submit!</p>
        </div>
      ) : (
        <>
          <div className={styles.slideshow}>
            {shuffled.map((photo, i) => (
              <div key={photo.id} className={`${styles.slide} ${i === current ? styles.active : ''}`}>
                {photo.image ? (
                  <img src={photo.image} alt={`Photo by ${photo.author}`} className={styles.slideImg} />
                ) : (
                  <div className={styles.slidePlaceholder}>No image uploaded</div>
                )}
                <div className={styles.slideOverlay}>
                  <div className={styles.slideAuthor}>
                    <span className={styles.authorDot}></span>
                    Captured by {photo.author}
                  </div>
                </div>
                <div className={styles.slideCounter}>{i + 1} / {shuffled.length}</div>
              </div>
            ))}
            <div className={styles.controls}>
              <button className={styles.ctrlBtn} onClick={() => goTo(current - 1)}>&#8249;</button>
              <button className={styles.ctrlBtn} onClick={() => goTo(current + 1)}>&#8250;</button>
            </div>
          </div>

          <div className={styles.dots}>
            {shuffled.map((_, i) => (
              <div key={i} className={`${styles.dot} ${i === current ? styles.dotActive : ''}`} onClick={() => goTo(i)} />
            ))}
          </div>

          <div className={styles.thumbnails}>
            {shuffled.map((photo, i) => (
              <div key={photo.id} className={`${styles.thumb} ${i === current ? styles.thumbActive : ''}`} onClick={() => goTo(i)}>
                {photo.image ? (
                  <img src={photo.image} alt={`Thumb ${i + 1}`} />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.submitSection}>
        <div className={styles.submitCard}>
          <p className={styles.submitTitle}>Submit Your Photo</p>
          <p className={styles.submitSub}>Share a moment from DawnDream. Upload your image to <a href="https://imgur.com" target="_blank" rel="noreferrer" className={styles.link}>imgur.com</a> and paste the direct link below. All submissions are reviewed before publishing.</p>
          {submitted ? (
            <div className={styles.successMsg}>Your photo has been submitted! The DawnDream team will review it shortly.</div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.submitForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Your Avatar Name</label>
                  <input className={styles.formInput} name="author" value={form.author} onChange={handleChange} placeholder="Your avatar name..." required />
                </div>
                <div className={styles.formGroup} style={{ flex: 2 }}>
                  <label className={styles.formLabel}>Direct Image URL</label>
                  <input className={styles.formInput} name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://i.imgur.com/yourimage.jpg" required />
                </div>
                <button className={styles.submitBtn} type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit →'}
                </button>
              </div>
              <p className={styles.submitNote}>Upload your image to imgur.com first, then copy the direct link (ending in .jpg or .png)</p>
            </form>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream
      </footer>
    </>
  );
}
