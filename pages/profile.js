import Head from 'next/head';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import { getPlayerFromRequest } from '../lib/auth';
import styles from '../styles/Profile.module.css';

export async function getServerSideProps({ req }) {
  const player = await getPlayerFromRequest(req);
  if (!player) return { redirect: { destination: '/login', permanent: false } };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/players?id=eq.${player.id}&select=id,avatar_name,display_name,email,profile_image,role,created_at`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const players = await res.json();
  return { props: { player: players[0] } };
}

export default function ProfilePage({ player }) {
  const [form, setForm] = useState({ displayName: player.display_name || '', profileImage: player.profile_image || '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(player.profile_image || null);

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
        body: JSON.stringify({ displayName: form.displayName, profileImage: form.profileImage, currentPassword: form.currentPassword || undefined, newPassword: form.newPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error);
      else { setSuccess('Profile updated successfully!'); setPreviewImage(form.profileImage); setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' })); }
    } catch { setError('Update failed — please try again'); }
    setLoading(false);
  }

  return (
    <>
      <Head><title>My Profile — DawnDream</title></Head>
      <Navbar activePage="profile" />
      <div className={styles.page}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarWrap}>
              {previewImage ? (
                <img src={previewImage} alt="Profile" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarPlaceholder}>{player.avatar_name.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div className={styles.profileInfo}>
              <h1 className={styles.profileName}>{player.display_name || player.avatar_name}</h1>
              <p className={styles.profileAvatar}>@{player.avatar_name}</p>
              <span className={`${styles.roleBadge} ${player.role === 'admin' ? styles.adminBadge : ''}`}>{player.role}</span>
              <p className={styles.memberSince}>Member since {new Date(player.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className={styles.settingsForm}>
            <h2 className={styles.sectionTitle}>Profile Settings</h2>

            {success && <div className={styles.successMsg}>{success}</div>}
            {error && <div className={styles.errorMsg}>{error}</div>}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Display Name</label>
              <input className={styles.formInput} name="displayName" value={form.displayName} onChange={handleChange} placeholder="How your name appears on the site..." />
              <p className={styles.formHint}>Leave blank to use your avatar name</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Profile Image URL</label>
              <input className={styles.formInput} name="profileImage" value={form.profileImage} onChange={e => { handleChange(e); setPreviewImage(e.target.value); }} placeholder="https://... (use postimages.org)" />
              <p className={styles.formHint}>Upload to postimages.org and paste the direct link here</p>
            </div>

            <h2 className={styles.sectionTitle} style={{ marginTop: '28px' }}>Change Password</h2>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Current Password</label>
              <input className={styles.formInput} name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} placeholder="Your current password..." />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>New Password</label>
              <input className={styles.formInput} name="newPassword" type="password" value={form.newPassword} onChange={handleChange} placeholder="New password..." />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Confirm New Password</label>
              <input className={styles.formInput} name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm new password..." />
            </div>

            <button className={styles.saveBtn} type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes →'}
            </button>
          </form>
        </div>
      </div>
      <footer className={styles.footer}>DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG</footer>
    </>
  );
}
