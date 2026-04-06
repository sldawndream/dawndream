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
  const [author, setAuthor] = useState('');
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
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
    const timer = setInterval(() => setCurrent((c) => (c + 1) % shuffled.length), 10000);
    return () => clearInterval(timer);
  }, [shuffled.length]);

  function goTo(n) { setCurrent((n + shuffled.length) % shuffled.length); }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setError('');
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!author || !file) { setError('Please fill in your name and select an image'); return; }
    setSubmitting(true);
    setError('');

    try {
      const sigRes = await fetch('/api/cloudinary-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'dawndream-gallery' }),
      });
      const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', 'dawndream-gallery');

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const cloudData = await cloudRes.json();

      if (!cloudRes.ok || !cloudData.secure_url) throw new Error('Upload failed');

      await fetch('/api/submit-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, imageUrl: cloudData.secure_url }),
      });

      setSubmitted(true);
      setAuthor('');
      setPreview(null);
      setFile(null);
    } catch (err) {
      console.error(err);
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
          <p className={styles.submitSub}>Share a moment from DawnDream. Upload directly from your device — no size limit. All submissions are reviewed before publishing.</p>
          {submitted ? (
            <div className={styles.successMsg}>Your photo has been submitted! The DawnDream team will review it shortly.</div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.submitForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Your Avatar Name</label>
                <input className={styles.formInput} value={author} onChange={e => setAuthor(e.target.value)} placeholder="Your avatar name..." required />
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
                      <span className={styles.uploadHint}>JPG, PNG, GIF — no size limit</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>
              {error && <p className={styles.errorMsg}>{error}</p>}
              <button className={styles.submitBtn} type="submit" disabled={submitting}>
                {submitting ? 'Uploading... please wait' : 'Submit Photo →'}
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
