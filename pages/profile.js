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
  const { data: players } = await supabase
    .from('players')
    .select('id,avatar_name,display_name,email,profile_image,role,created_at,bio,lore')
    .eq('id', player.id);
  return { props: { player: players[0] } };
}

// TODO: Replace with real MySQL data once DB access is available
function getMockStats() {
  return null; // Returns null until DB connected — shows empty state
}

const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'First Blood', icon: '🩸', category: 'Mortal Kills', desc: 'Kill your first mortal' },
  { id: 'first_duel', name: 'First Duel', icon: '⚔️', category: 'PVP', desc: 'Slay your first player' },
  { id: 'first_turn', name: 'First Turn', icon: '🦇', category: 'Siring', desc: 'Sire your first fledgling' },
  { id: 'first_fall', name: 'First Fall', icon: '💀', category: 'Death', desc: 'Die for the first time' },
  { id: 'sworn', name: 'Sworn', icon: '👑', category: 'Loyalty', desc: 'Join a clan' },
  { id: 'house_bound', name: 'House Bound', icon: '🏰', category: 'Loyalty', desc: 'Join a house' },
  { id: 'voice_night', name: 'Voice of the Night', icon: '📜', category: 'Chronicles', desc: 'Submit your first chronicle' },
  { id: 'memory_keeper', name: 'Memory Keeper', icon: '📸', category: 'Community', desc: 'Submit your first gallery photo' },
];

export default function ProfilePage({ player }) {
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm] = useState({
    displayName: player.display_name || '',
    profileImage: player.profile_image || '',
    bio: player.bio || '',
    lore: player.lore || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(player.profile_image || null);
  const [displayName, setDisplayName] = useState(player.display_name || player.avatar_name);
  const [bio, setBio] = useState(player.bio || '');
  const [lore, setLore] = useState(player.lore || '');

  const stats = getMockStats();
  const unlockedAchievements = []; // TODO: fetch from DB

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(''); setSuccess('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.newPassword && form.newPassword !== form.confirmPassword) { setError('New passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName,
          profileImage: form.profileImage,
          bio: form.bio,
          lore: form.lore,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else {
        setSuccess('Profile updated!');
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
        <div className={styles.profileHeader}>
          <div className={styles.avatarRing}>
            {previewImage ? (
              <img src={previewImage} alt={displayName} className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarPlaceholder}>{player.avatar_name.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <div className={styles.nameBlock}>
            <h1 className={styles.profileName}>{displayName}</h1>
            <p className={styles.profileHandle}>@{player.avatar_name}</p>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${player.role === 'admin' ? styles.badgeAdmin : styles.badgePlayer}`}>{player.role}</span>
              <span className={styles.badgeMember}>Member since {new Date(player.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <button className={styles.settingsBtn} onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? '← Back to Profile' : '⚙ Profile Settings'}
          </button>
        </div>

        {!showSettings ? (
          <div className={styles.mainGrid}>
            <div className={styles.leftCol}>

              <div className={styles.card}>
                <p className={styles.cardTitle}>Combat Record</p>
                {stats ? (
                  <>
                    <div className={styles.statRow}><span className={styles.statLabel}>Mortals Killed</span><span className={`${styles.statVal} ${styles.red}`}>{stats.mortalsKilled.toLocaleString()}</span></div>
                    <div className={styles.statRow}><span className={styles.statLabel}>Players Slayed</span><span className={`${styles.statVal} ${styles.red}`}>{stats.playersSlayed}</span></div>
                    <div className={styles.statRow}><span className={styles.statLabel}>Deaths Suffered</span><span className={styles.statVal}>{stats.deaths}</span></div>
                    <div className={styles.statRow}><span className={styles.statLabel}>Nights Survived</span><span className={`${styles.statVal} ${styles.gold}`}>{stats.nightsSurvived}</span></div>
                  </>
                ) : (
                  <div className={styles.dbPending}>
                    <span className={styles.dbIcon}>⚔</span>
                    <p>Combat stats will appear here once the game database is connected.</p>
                  </div>
                )}
              </div>

              <div className={styles.card}>
                <p className={styles.cardTitle}>Lineage Stats</p>
                {stats ? (
                  <>
                    <div className={styles.statRow}><span className={styles.statLabel}>Players Sired</span><span className={styles.statVal}>{stats.sired}</span></div>
                    <div className={styles.statRow}><span className={styles.statLabel}>Total Descendants</span><span className={`${styles.statVal} ${styles.gold}`}>{stats.descendants}</span></div>
                    <div className={styles.statRow}><span className={styles.statLabel}>Generations Below</span><span className={styles.statVal}>{stats.generationsBelow}</span></div>
                    <div className={styles.statRow}><span className={styles.statLabel}>Generation</span><span className={`${styles.statVal} ${styles.gold}`}>{stats.generation}</span></div>
                  </>
                ) : (
                  <div className={styles.dbPending}>
                    <span className={styles.dbIcon}>🦇</span>
                    <p>Lineage stats will appear here once the game database is connected.</p>
                  </div>
                )}
              </div>

              <div className={styles.card}>
                <p className={styles.cardTitle}>Bloodline & Clan</p>
                {stats ? (
                  <>
                    <p className={styles.blName}>{stats.bloodline}</p>
                    <p className={styles.blArch}>Arch Vampire: {stats.archVampire}</p>
                    <div className={styles.blDivider} />
                    <div className={styles.blRow}><span className={styles.blKey}>Sire</span><span className={styles.blVal}>{stats.sire}</span></div>
                    <div className={styles.blRow}><span className={styles.blKey}>Clan</span><span className={styles.blVal}>{stats.clan}</span></div>
                    <div className={styles.blRow}><span className={styles.blKey}>House</span><span className={styles.blVal}>{stats.house}</span></div>
                  </>
                ) : (
                  <div className={styles.dbPending}>
                    <span className={styles.dbIcon}>🩸</span>
                    <p>Bloodline & clan data will appear here once the game database is connected.</p>
                  </div>
                )}
              </div>

            </div>

            <div className={styles.rightCol}>

              <div className={styles.card}>
                <p className={styles.cardTitle}>About</p>
                {bio ? (
                  <p className={styles.bioText}>{bio}</p>
                ) : (
                  <p className={styles.emptyText}>No description yet — click Profile Settings to add one.</p>
                )}
              </div>

              {lore && (
                <div className={styles.card}>
                  <p className={styles.cardTitle}>Personal Lore</p>
                  <div className={styles.loreText}>
                    {lore.split('\n').filter(p => p.trim()).map((para, i) => <p key={i}>{para}</p>)}
                  </div>
                </div>
              )}

              <div className={styles.card}>
                <p className={styles.cardTitle}>
                  Achievements
                  <span className={styles.achCount}>{unlockedAchievements.length} / 120+</span>
                </p>
                {unlockedAchievements.length > 0 ? (
                  <div className={styles.achGrid}>
                    {ACHIEVEMENTS.map(ach => {
                      const unlocked = unlockedAchievements.includes(ach.id);
                      return (
                        <div key={ach.id} className={`${styles.achItem} ${unlocked ? styles.achUnlocked : styles.achLocked}`} title={ach.desc}>
                          <div className={styles.achIcon}>{unlocked ? ach.icon : '?'}</div>
                          <div className={styles.achName}>{unlocked ? ach.name : 'Locked'}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.dbPending}>
                    <span className={styles.dbIcon}>🏆</span>
                    <p>Achievements will unlock automatically once the game database is connected and your stats are imported.</p>
                  </div>
                )}
              </div>

              <div className={styles.card}>
                <p className={styles.cardTitle}>Lineage Tree</p>
                {stats && stats.ancestors ? (
                  <div className={styles.lineageTree}>
                    <p className={styles.linLabel}>Ancestors</p>
                    {stats.ancestors.map((anc, i) => (
                      <div key={i}>
                        <div className={styles.linNode}>{anc}</div>
                        <div className={styles.linLine} />
                      </div>
                    ))}
                    <div className={`${styles.linNode} ${styles.linCurrent}`}>{displayName} ← You</div>
                    {stats.descendants_list && stats.descendants_list.length > 0 && (
                      <>
                        <div className={styles.linLine} />
                        <p className={styles.linLabel}>Sired</p>
                        <div className={styles.linChildren}>
                          {stats.descendants_list.map((d, i) => (
                            <div key={i} className={styles.linBranch}>
                              <div className={styles.linNode}>{d}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className={styles.dbPending}>
                    <span className={styles.dbIcon}>🌳</span>
                    <p>Your full lineage tree — ancestors above, descendants below — will appear here once the game database is connected.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          <div className={styles.settingsWrap}>
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
                    <p className={styles.formHint}>Upload to Cloudinary and paste the direct link</p>
                    {form.profileImage && <img src={form.profileImage} alt="Preview" className={styles.imgPreview} onError={e => e.target.style.display='none'} />}
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
                    <textarea className={styles.formTextarea} name="lore" value={form.lore} onChange={handleChange} placeholder="Write your vampire's story, backstory, history..." rows={10} />
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

      <footer className={styles.footer}>DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream</footer>
    </>
  );
}
