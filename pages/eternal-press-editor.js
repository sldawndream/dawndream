import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { getPlayerFromRequest } from '../lib/auth';
import { createClient } from '@supabase/supabase-js';
import styles from '../styles/EternalPressEditor.module.css';

export async function getServerSideProps({ req }) {
  const session = await getPlayerFromRequest(req);
  if (!session) return { redirect: { destination: '/login?next=/eternal-press-editor', permanent: false } };

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: players } = await supabase.from('players').select('id,avatar_name,display_name,role').eq('id', session.id);
  const player = players?.[0];

  if (!player || (player.role !== 'reporter' && player.role !== 'admin')) {
    return { redirect: { destination: '/eternal-press', permanent: false } };
  }

  return { props: { player } };
}

const CATEGORIES = ['Breaking', 'War', 'Politics', 'Society', 'Mystery', 'Announcement', 'General'];

const emptyForm = { title: '', category: 'General', body: '', excerpt: '', coverImage: '', issueNumber: '', issueDate: '' };

export default function EternalPressEditorPage({ player }) {
  const isAdmin = player.role === 'admin';
  const displayName = player.display_name || player.avatar_name;

  const [tab, setTab] = useState('write');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileRef = useRef();

  const [myArticles, setMyArticles] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (tab === 'mine') loadArticles('mine');
    if (tab === 'all' && isAdmin) loadArticles('all');
  }, [tab]);

  async function loadArticles(scope) {
    setArticlesLoading(true);
    try {
      const res = await fetch(`/api/eternal-press-list?scope=${scope}`);
      const data = await res.json();
      if (scope === 'mine') setMyArticles(data.articles || []);
      else setAllArticles(data.articles || []);
    } catch {}
    setArticlesLoading(false);
  }

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
      fd.append('file', imageFile); fd.append('api_key', apiKey);
      fd.append('timestamp', timestamp); fd.append('signature', signature);
      fd.append('folder', 'dawndream-eternal-press');
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      const cloudData = await cloudRes.json();
      if (!cloudRes.ok || !cloudData.secure_url) throw new Error('Upload failed');
      return cloudData.secure_url;
    } finally { setImageUploading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { setError('Title and body are required'); return; }
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const coverImage = await uploadImage();
      if (editingId) {
        // Edit existing article
        const res = await fetch('/api/eternal-press-manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: editingId, action: 'edit', ...form, coverImage }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); }
        else {
          setSuccess('Article updated successfully!');
          setEditingId(null);
          setForm(emptyForm);
          setImageFile(null); setImagePreview(null);
          loadArticles('mine');
        }
      } else {
        // New article
        const res = await fetch('/api/eternal-press-submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, coverImage }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); }
        else {
          setSuccess('Your article has been published to The Eternal Press!');
          setForm(emptyForm);
          setImageFile(null); setImagePreview(null);
        }
      }
    } catch { setError('Action failed — please try again'); }
    setSubmitting(false);
  }

  function startEdit(article) {
    setForm({
      title: article.title || '',
      category: article.category || 'General',
      body: article.body || '',
      excerpt: article.excerpt || '',
      coverImage: article.coverImage || '',
      issueNumber: article.issueNumber || '',
      issueDate: article.issueDate || '',
    });
    setEditingId(article.id);
    setImagePreview(article.coverImage || null);
    setImageFile(null);
    setTab('write');
    window.scrollTo(0, 0);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null); setImagePreview(null);
    setError(''); setSuccess('');
  }

  async function handleAction(articleId, action, scope) {
    if (action === 'delete' && !confirm('Delete this article permanently? This cannot be undone.')) return;
    setActionLoading(articleId + action);
    try {
      const res = await fetch('/api/eternal-press-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, action }),
      });
      if (res.ok) loadArticles(scope);
    } catch {}
    setActionLoading(null);
  }

  function ArticleCard({ article, scope }) {
    return (
      <div className={styles.manageCard}>
        <div className={styles.manageCardTop}>
          <div className={styles.manageCardInfo}>
            <p className={styles.manageCardTitle}>{article.title}</p>
            <div className={styles.manageCardMeta}>
              <span className={styles.manageCardAuthor}>By {article.author}</span>
              <span className={styles.manageMetaDot} />
              <span className={`${styles.managePill} ${article.category === 'Breaking' ? styles.catBreaking : styles.catGeneral}`}>{article.category}</span>
              <span className={styles.manageMetaDot} />
              <span className={`${styles.manageStatus} ${article.published ? styles.managePublished : styles.manageUnpublished}`}>
                {article.published ? 'Published' : 'Unpublished'}
              </span>
              {article.featured && <span className={styles.manageFeatured}>★ Featured</span>}
            </div>
            {article.excerpt && <p className={styles.manageCardExcerpt}>{article.excerpt.slice(0, 100)}…</p>}
          </div>
        </div>
        <div className={styles.manageActions}>
          <button className={styles.editBtn} onClick={() => startEdit(article)}
            disabled={actionLoading === article.id + 'edit'}>✒ Edit</button>
          {article.published ? (
            <button className={styles.unpublishBtn} onClick={() => handleAction(article.id, 'unpublish', scope)}
              disabled={actionLoading === article.id + 'unpublish'}>
              {actionLoading === article.id + 'unpublish' ? '...' : '◌ Unpublish'}
            </button>
          ) : (
            <button className={styles.publishBtn} onClick={() => handleAction(article.id, 'publish', scope)}
              disabled={actionLoading === article.id + 'publish'}>
              {actionLoading === article.id + 'publish' ? '...' : '● Publish'}
            </button>
          )}
          {isAdmin && (
            article.featured ? (
              <button className={styles.unfeatureBtn} onClick={() => handleAction(article.id, 'unfeature', scope)}
                disabled={actionLoading === article.id + 'unfeature'}>
                {actionLoading === article.id + 'unfeature' ? '...' : '★ Unfeature'}
              </button>
            ) : (
              <button className={styles.featureBtn} onClick={() => handleAction(article.id, 'feature', scope)}
                disabled={actionLoading === article.id + 'feature'}>
                {actionLoading === article.id + 'feature' ? '...' : '☆ Feature'}
              </button>
            )
          )}
          <button className={styles.deleteBtn} onClick={() => handleAction(article.id, 'delete', scope)}
            disabled={actionLoading === article.id + 'delete'}>
            {actionLoading === article.id + 'delete' ? '...' : '✕ Delete'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>The Eternal Press Editor — DawnDream</title></Head>
      <Navbar activePage="eternal-press" />

      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>The Eternal Press</p>
            <h1 className={styles.title}>Article Editor</h1>
            <p className={styles.sub}>Writing as <strong>{displayName}</strong> · {isAdmin ? 'Admin' : 'Reporter'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tabBtn} ${tab === 'write' ? styles.tabActive : ''}`} onClick={() => { setTab('write'); cancelEdit(); }}>
            ✒ {editingId ? 'Editing Article' : 'Write New'}
          </button>
          <button className={`${styles.tabBtn} ${tab === 'mine' ? styles.tabActive : ''}`} onClick={() => setTab('mine')}>
            {isAdmin ? 'Manage Articles' : 'My Articles'}
          </button>
          {isAdmin && (
            <button className={`${styles.tabBtn} ${tab === 'all' ? styles.tabActive : ''}`} onClick={() => setTab('all')}>
              All Articles
            </button>
          )}
        </div>

        {/* Write / Edit tab */}
        {tab === 'write' && (
          <div className={styles.layout}>
            <div className={styles.formCol}>
              <div className={styles.card}>
                <p className={styles.cardTitle}>
                  {editingId ? 'Edit Article' : 'Write New Article'}
                  {editingId && (
                    <button className={styles.cancelEditBtn} onClick={cancelEdit}>✕ Cancel edit</button>
                  )}
                </p>
                {success && <div className={styles.successMsg}>{success}</div>}
                {error && <div className={styles.errorMsg}>{error}</div>}
                {editingId && (
                  <div className={styles.editingBanner}>
                    ✒ You are editing an existing article. Save changes to update it on The Eternal Press.
                  </div>
                )}
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
                    <textarea className={styles.formTextarea} name="excerpt" value={form.excerpt} onChange={handleChange} placeholder="A short summary shown on the front page (optional)..." rows={2} />
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
                        <><img src={imagePreview} alt="Preview" className={styles.uploadPreview} /><div className={styles.uploadOverlay}><span>Change Image</span></div></>
                      ) : (
                        <div className={styles.uploadPlaceholder}>
                          <span className={styles.uploadIcon}>+</span>
                          <span>Click to upload cover image</span>
                          <span className={styles.uploadHint}>JPG, PNG, GIF</span>
                        </div>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    {imageFile && !imageUploading && <p className={styles.formHint}>📎 {imageFile.name} — uploads when you save</p>}
                    {imageUploading && <p className={styles.formHint} style={{ color: '#c0a030' }}>⏳ Uploading image…</p>}
                  </div>
                  <button className={styles.submitBtn} type="submit" disabled={submitting || imageUploading}>
                    {submitting ? (editingId ? 'Saving…' : 'Publishing…') : (editingId ? '✒ Save Changes →' : '✒ Publish Article →')}
                  </button>
                  <p className={styles.submitNote}>{editingId ? 'Changes will update immediately on The Eternal Press.' : 'Articles publish immediately to The Eternal Press.'}</p>
                </form>
              </div>
            </div>

            <div className={styles.sideCol}>
              <div className={styles.card}>
                <p className={styles.cardTitle}>Writing Guide</p>
                <ul className={styles.guideList}>
                  <li><strong>Headline</strong> — Keep it dramatic and specific.</li>
                  <li><strong>Excerpt</strong> — One or two sentences for the front page. Leave blank to auto-generate.</li>
                  <li><strong>Body</strong> — Paragraphs separated by blank lines. Write in-world, gothic, immersive.</li>
                  <li><strong>Category</strong> — Breaking = urgent news, Society = community events, Mystery = unexplained events.</li>
                  <li><strong>Cover Image</strong> — Optional. Upload a Second Life screenshot or atmospheric image.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* My Articles tab */}
        {tab === 'mine' && (
          <div className={styles.manageSection}>
            <p className={styles.manageSectionDesc}>
              {isAdmin ? 'All Eternal Press articles — edit, unpublish or delete any of them.' : 'Your published and unpublished articles. Edit, unpublish or delete any of them.'}
            </p>
            {articlesLoading && <p className={styles.manageEmpty}>Loading your articles…</p>}
            {!articlesLoading && myArticles.length === 0 && (
              <p className={styles.manageEmpty}>You haven't written any articles yet. Switch to Write New to get started.</p>
            )}
            {!articlesLoading && myArticles.map(a => <ArticleCard key={a.id} article={a} scope="mine" />)}
          </div>
        )}

        {/* All Articles tab — admin only */}
        {tab === 'all' && isAdmin && (
          <div className={styles.manageSection}>
            <p className={styles.manageSectionDesc}>All articles across all reporters. Feature, unpublish or delete any article.</p>
            {articlesLoading && <p className={styles.manageEmpty}>Loading all articles…</p>}
            {!articlesLoading && allArticles.length === 0 && (
              <p className={styles.manageEmpty}>No articles found.</p>
            )}
            {!articlesLoading && allArticles.map(a => <ArticleCard key={a.id} article={a} scope="all" />)}
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        The Eternal Press &nbsp;·&nbsp; DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG
      </footer>
    </>
  );
}
