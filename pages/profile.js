import Head from 'next/head';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import { getPlayerFromRequest } from '../lib/auth';
import { createClient } from '@supabase/supabase-js';
import styles from '../styles/Profile.module.css';

export async function getServerSideProps({ req }) {
  const player = await getPlayerFromRequest(req);
  if (!player) return { redirect: { destination: '/login', permanent: false } };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: players } = await supabase.from('players').select('id,avatar_name,display_name,email,profile_image,role,created_at,bio,lore').eq('id', player.id);
  return { props: { player: players[0] } };
}

export default function ProfilePage({ player }) {
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm] = useState({ displayName: player.display_name || '', profileImage: player.profile_image || '', bio: player.bio || '', lore: player.lore || '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(player.profile_image || null);
  const [displayName, setDisplayName] = useState(player.display_name || player.avatar_name);
  const [bio, setBio] = useState(player.bio || '');
  const [lore, setLore] = useState(player.lore || '');

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); setSuccess(''); }

  async function handleSave(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.newPassword && form.newPassword !== form.confirmPassword) { setError('New passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: form.displayName, profileImage: form.profileImage, bio: form.bio, lore: form.lore, currentPassword: form.currentPassword || undefined, newPassword: form.newPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else {
        setSuccess('Profile updated successfully!');
        setPreviewImage(form.profileImage);
        setDisplayName(form.displayName || player.avatar_name);
        setBio(form.bio);
        setLore(form.lore);
        setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
      }
    } catch { setError('Update failed — please try again'); }
    setLoading(false);
  }

  return (
    <>
      <Head><title>{displayName} — DawnDream</title></Head>
      <Navbar activePage="profile" />
      <div className={styles.page}>

        <div className={styles.profileHero}>
          <div className={styles.heroBg} />
          <div className={styles.heroContent}>
            <div className={styles.avatarWrap}>
              {previewImage ? (
                <img src={previewImage} alt="Profile" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarPlaceholder}>{player.avatar_name.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div className={styles.heroInfo}>
              <h1 className={styles.heroName}>{displayName}</h1>
              <p className={styles.heroAvatar}>@{player.avatar_name}</p>
              <div className={styles.heroBadges}>
                <span className={`${styles.roleBadge} ${player.role === 'admin' ? styles.adminBadge : ''}`}>{player.role}</span>
                <span className={styles.memberBadge}>Member since {new Date(player.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            <button className={styles.settingsToggle} onClick={() => setShowSettings(!showSettings)}>
              {showSettings ? '← Back to Profile' : '⚙ Profile Settings'}
            </button>
          </div>
        </div>

        {!showSettings ? (
          <div className={styles.profileBody}>
            <div className={styles.profileSection}>
              <p className={styles.sectionEyebrow}>About</p>
              {bio ? (
                <p className={styles.bioText}>{bio}</p>
              ) : (
                <p className={styles.emptyText}>No description yet — click Profile Settings to add one.</p>
              )}
            </div>
            <div className={styles.profileSection}>
              <p className={styles.sectionEyebrow}>Personal Lore</p>
              {lore ? (
                <div className={styles.loreText}>
                  {lore.split('\n').filter(p => p.trim()).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyText}>No lore written yet — click Profile Settings to write your story.</p>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.settingsBody}>
            <form onSubmit={handleSave} className={styles.settingsForm}>
              <h2 className={styles.settingsTitle}>Profile Settings</h2>
              {success && <div className={styles.successMsg}>{success}</div>}
              {error && <div className={styles.errorMsg}>{error}</div>}

              <div className={styles.settingsGrid}>
                <div className={styles.settingsCol}>
                  <p className={styles.colTitle}>Identity</p>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Display Name</label>
                    <input className={styles.formInput} name="displayName" value={form.displayName} onChange={handleChange} placeholder="How your name appears..." />
                    <p className={styles.formHint}>Leave blank to use your avatar name</p>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Profile Image URL</label>
                    <input className={styles.formInput} name="profileImage" value={form.profileImage} onChange={e => { handleChange(e); setPreviewImage(e.target.value); }} placeholder="https://..." />
                    <p className={styles.formHint}>Upload to Cloudinary and paste the link</p>
                    {form.profileImage && <img src={form.profileImage} alt="Preview" className={styles.imagePreview} onError={e => e.target.style.display='none'} />}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>About Me</label>
                    <textarea className={styles.formTextarea} name="bio" value={form.bio} onChange={handleChange} placeholder="A short description about yourself..." rows={3} />
                  </div>
                </div>

                <div className={styles.settingsCol}>
                  <p className={styles.colTitle}>Personal Lore</p>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Your Story</label>
                    <textarea className={styles.formTextarea} name="lore" value={form.lore} onChange={handleChange} placeholder="Write your vampire's story, backstory, history..." rows={8} />
                    <p className={styles.formHint}>This will appear on your public profile</p>
                  </div>
                </div>
              </div>

              <div className={styles.passwordSection}>
                <p className={styles.colTitle}>Change Password</p>
                <div className={styles.passwordGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Current Password</label>
                    <input className={styles.formInput} name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} placeholder="Current password..." />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>New Password</label>
                    <input className={styles.formInput} name="newPassword" type="password" value={form.newPassword} onChange={handleChange} placeholder="New password..." />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Confirm New Password</label>
                    <input className={styles.formInput} name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm new password..." />
                  </div>
                </div>
              </div>

              <button className={styles.saveBtn} type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes →'}
              </button>
            </form>
          </div>
        )}
      </div>
      <footer className={styles.footer}>DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG</footer>
    </>
  );
}
