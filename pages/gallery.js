import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
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
  const [form, setForm] = useState({ author: '' });
  const [preview, setPreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    const s = shuffle(photos);
    setShuffled(s);
    if (s.length > 0) setCurrent(Math.floor(Math.random() * s.length));
  }, []);

  useEffect(() => {
    if (shuffled.length === 0) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % shuffled.length), 5000);
    return () => clearInterval(timer);
  }, [shuffled.length]);

  function goTo(n) { setCurrent((n + shuffled.length) % shuffled.length); }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10MB'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setImageData(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.author || !imageData) { setError('Please fill in your name and select an image'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/submit-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: form.author, imageData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSubmitted(true);
      setForm({ author: '' });
      setPreview(null);
      setImageData(null);
    } catch (err) {
      setError('Submission failed — please try again.');
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
        <div className={styles.empty}><p>No photos yet — be the first to submit!</p></div>
      ) : (
        <>
          <div className={styles.slideshow}>
            {shuffled.map((photo, i) => (
              <div key={photo.id} className={`${styles.slide} ${i === current ? styles.active : ''}`}>
                {photo.image ? (
                  <img src={photo.image} alt={`Photo by ${photo.author}`} className={styles.slideImg} />
                ) : (
                  <div className={styles.slidePlaceholder}>No image</div>
                )}
                <div className={styles.slideOverlay}>
                  <div className={styles.slideAuthor}><span className={styles.authorDot}></span>Captured by {photo.author}</div>
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
                {photo.image ? <img src={photo.image} alt={`Thumb ${i + 1}`} /> : <span>{i + 1}</span>}
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.submitSection}>
        <div className={styles.submitCard}>
          <p className={styles.submitTitle}>Submit Your Photo</p>
          <p className={styles.submitSub}>Share a moment from DawnDream. Upload directly from your device — no external links needed. All submissions are reviewed before publishing.</p>
          {submitted ? (
            <div className={styles.successMsg}>Your photo has been submitted! The DawnDream team will review it shortly.</div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.submitForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Your Avatar Name</label>
                  <input className={styles.formInput} value={form.author} onChange={e => setForm({ author: e.target.value })} placeholder="Your avatar name..." required />
                </div>
              </div>
              <div className={styles.formGroup} style={{ marginTop: '12px' }}>
                <label className={styles.formLabel}>Your Photo</label>
                <div className={styles.uploadArea} onClick={() => fileRef.current.click()}>
                  {preview ? (
                    <img src={preview} alt="Preview" className={styles.uploadPreview} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <span className={styles.uploadIcon}>+</span>
                      <span>Click to select your image</span>
                      <span className={styles.uploadHint}>JPG, PNG — max 10MB</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>
              {error && <p className={styles.errorMsg}>{error}</p>}
              <button className={styles.submitBtn} type="submit" disabled={submitting}>
                {submitting ? 'Uploading...' : 'Submit Photo →'}
              </button>
              <p className={styles.submitNote}>Submissions are reviewed by the DawnDream team before appearing in the gallery.</p>
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
