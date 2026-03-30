import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getGallery } from '../lib/gallery';
import styles from '../styles/Gallery.module.css';

export async function getStaticProps() {
  try {
    const photos = await getGallery();
    return { props: { photos }, revalidate: 60 };
  } catch (err) {
    console.error('Gallery fetch error:', err);
    return { props: { photos: [] }, revalidate: 60 };
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

  useEffect(() => {
    setShuffled(shuffle(photos));
    setCurrent(Math.floor(Math.random() * photos.length));
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

  if (shuffled.length === 0 && photos.length > 0) return null;

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
          <p>No photos yet — add them in your Notion database!</p>
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

      <footer className={styles.footer}>
        DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream
      </footer>
    </>
  );
}
