import Head from 'next/head';
import { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { getPlayerFromRequest } from '../lib/auth';
import { createClient } from '@supabase/supabase-js';
import styles from '../styles/EternalPressEditor.module.css';

export async function getServerSideProps({ req }) {
  const session = await getPlayerFromRequest(req);
  if (!session) {
    return { redirect: { destination: '/login?next=/eternal-press-editor', permanent: false } };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: players } = await supabase
    .from('players')
    .select('id,avatar_name,display_name,role')
    .eq('id', session.id);

  const player = players?.[0];
  if (!player || (player.role !== 'reporter' && player.role !== 'admin')) {
    return { redirect: { destination: '/eternal-press', permanent: false } };
  }

  // Fetch this reporter's own articles
  const { data: articles } = await supabase
    .from('eternal_press_articles')
    .select('id,title,category,status,created_at,published_at')
    .eq('author_id', session.id)
    .order('created_at', { ascending: false });

  return { props: { player, articles: articles || [] } };
}

const CATEGORIES = ['Breaking', 'War', 'Politics', 'Society', 'Mystery', 'Announcement', 'General'];

export default function EternalPressEditorPage({ player, articles }) {
  const [form, setForm] = useState({
    title: '',
    category: 'General',
    body: '',
    excerpt: '',
    coverImage: '',
    issueNumber: '',
    issueDate: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileRef = useRef();

  const displayName = player.display_name || player.avatar_name;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(''); setSuccess('');
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(f);
  }

  async function uploadImage() {
    if (!imageFile) return form.coverImage;
    setImageUploading(true);
    try {
      const sigRes = await fetch('/api/cloudinary-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'dawndream-eternal-press' }),
      });
      const { signature, timestamp, cloudName, apiKey } = await sigRes.json();
      const fd = new FormData();
      fd.append('file', imageFile);
      fd.append('api_key', apiKey);
      fd.append('timestamp', timestamp);
      fd.append('signature', signature);
      fd.append('folder', 'dawndream-eternal-press');
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      const cloudData = await cloudRes.json();
      if (!cloudRes.ok || !cloudData.secure_url) throw new Error('Upload failed');
      return cloudData.secure_url;
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { setError('Title and body are required'); return; }
    setSubmitting(true);
    setError(''); setSuccess('');
    try {
      const coverImage = await uploadImage();
      const res = await fetch('/api/eternal-press-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, coverImage }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else {
        setSuccess('Your article has been published to The Eternal Press!');
        setForm({ title: '', category: 'General', body: '', excerpt: '', coverImage: '', issueNumber: '', issueDate: '' });
        setImageFile(null);
        setImagePreview(null);
      }
    } catch { setError('Submission failed — please try again'); }
    setSubmitting(false);
  }

  const statusColors = {
    pending: styles.statusPending,
    published: styles.statusPublished,
    rejected: styles.statusRejected,
  };

  return (
    <>
      <Head>
        <title>The Eternal Press Editor — DawnDream</title>
      </Head>
      <Navbar activePage="eternal-press" />

      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>The Eternal Press</p>
            <h1 className={styles.title}>Article Editor</h1>
            <p className={styles.sub}>Writing as <strong>{displayName}</strong> · Reporter</p>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Write form */}
          <div className={styles.formCol}>
            <div className={styles.card}>
              <p className={styles.cardTitle}>Write New Article</p>
              {success && <div className={styles.successMsg}>{success}</div>}
              {error && <div className={styles.errorMsg}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Headline *</label>
                  <input className={styles.formInput} name="title" value={form.title} onChange={handleChange} placeholder="Enter your article headline..." required />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Category *</label>
                    <select className={styles.formSelect} name="category" value={form.category} onChange={handleChange}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Issue Number</label>
                    <input className={styles.formInput} name="issueNumber" value={form.issueNumber} onChange={handleChange} placeholder="e.g. 12" type="number" min="1" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Issue Date</label>
                    <input className={styles.formInput} name="issueDate" value={form.issueDate} onChange={handleChange} placeholder="e.g. April 2026" />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Excerpt</label>
                  <textarea className={styles.formTextarea} name="excerpt" value={form.excerpt} onChange={handleChange} placeholder="A short summary shown on the newspaper front (optional — leave blank to auto-generate)..." rows={2} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Article Body *</label>
                  <textarea className={styles.formTextarea} name="body" value={form.body} onChange={handleChange} placeholder="Write your full article here. Use blank lines to separate paragraphs..." rows={16} required />
                  <p className={styles.formHint}>{form.body.length} characters · ~{Math.ceil(form.body.split(' ').filter(Boolean).length / 200)} min read</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cover Image</label>
                  <div className={styles.uploadArea} onClick={() => fileRef.current.click()}>
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className={styles.uploadPreview} />
                        <div className={styles.uploadOverlay}><span>Change Image</span></div>
                      </>
                    ) : (
                      <div className={styles.uploadPlaceholder}>
                        <span className={styles.uploadIcon}>+</span>
                        <span>Click to upload cover image</span>
                        <span className={styles.uploadHint}>JPG, PNG, GIF</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  {imageFile && !imageUploading && <p className={styles.formHint}>📎 {imageFile.name} — uploads when you submit</p>}
                  {imageUploading && <p className={styles.formHint} style={{ color: '#c0a030' }}>⏳ Uploading image…</p>}
                </div>

                <button className={styles.submitBtn} type="submit" disabled={submitting || imageUploading}>
                  {submitting ? 'Publishing…' : '✒ Publish Article →'}
                </button>
                <p className={styles.submitNote}>Articles publish immediately to The Eternal Press.</p>
              </form>
            </div>
          </div>

          {/* My articles sidebar */}
          <div className={styles.sideCol}>
            <div className={styles.card}>
              <p className={styles.cardTitle}>My Articles</p>
              {articles.length === 0 && (
                <p className={styles.emptyText}>No articles yet — write your first dispatch above.</p>
              )}
              <div className={styles.articleList}>
                {articles.map(a => (
                  <div key={a.id} className={styles.articleItem}>
                    <p className={styles.articleItemTitle}>{a.title}</p>
                    <div className={styles.articleItemMeta}>
                      <span className={`${styles.statusBadge} ${statusColors[a.status] || ''}`}>{a.status}</span>
                      <span className={styles.articleItemDate}>
                        {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <p className={styles.cardTitle}>Writing Guide</p>
              <ul className={styles.guideList}>
                <li><strong>Headline</strong> — Keep it dramatic and specific. "Lord Morbaine Claims the Northern Seat" beats "Big News from the North".</li>
                <li><strong>Excerpt</strong> — One or two sentences shown on the front page. Leave blank to auto-generate from your body text.</li>
                <li><strong>Body</strong> — Write in paragraphs separated by blank lines. Write from the perspective of a DawnDream reporter — in-world, gothic, immersive.</li>
                <li><strong>Category</strong> — Choose the most fitting one. Breaking = urgent news, Society = community events, Mystery = unexplained events.</li>
                <li><strong>Cover Image</strong> — Optional but recommended. Upload a Second Life screenshot or atmospheric image. Articles publish immediately once submitted.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        The Eternal Press &nbsp;·&nbsp; DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG
      </footer>
    </>
  );
}
