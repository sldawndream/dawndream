import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { getPlayerFromRequest } from '../lib/auth';
import { createClient } from '@supabase/supabase-js';
import styles from '../styles/Admin.module.css';

export async function getServerSideProps({ req }) {
  const player = await getPlayerFromRequest(req);
  if (!player || player.role !== 'admin') {
    return { redirect: { destination: '/login', permanent: false } };
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: players } = await supabase
    .from('players')
    .select('id,avatar_name,status,role,created_at,approved_at,sl_uuid,email')
    .order('created_at', { ascending: false });
  return { props: { players: players || [], adminName: player.avatar_name } };
}

export default function AdminPage({ players, adminName }) {
  const [section, setSection] = useState('players');
  const [list, setList] = useState(players);
  const [loadingAction, setLoadingAction] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [chronicles, setChronicles] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);

  async function loadContent(type) {
    setContentLoading(true);
    const res = await fetch(`/api/admin-notion?type=${type}`);
    const data = await res.json();
    if (type === 'chronicles') setChronicles(data.items || []);
    if (type === 'gallery') setGallery(data.items || []);
    setContentLoading(false);
  }

  useEffect(() => {
    if (section === 'chronicles') loadContent('chronicles');
    if (section === 'gallery') loadContent('gallery');
  }, [section]);

  async function handlePlayerAction(playerId, action) {
    setLoadingAction(playerId + action);
    await fetch('/api/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, action }),
    });
    setList(prev => prev.map(p => p.id === playerId ? {
      ...p, status: action === 'approve' ? 'approved' : action === 'ban' ? 'banned' : 'rejected'
    } : p));
    setLoadingAction(null);
  }

  async function handleNotionAction(pageId, action, type) {
    setLoadingAction(pageId + action);
    await fetch('/api/admin-notion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId, action }),
    });
    if (type === 'chronicles') setChronicles(prev => prev.filter(c => c.id !== pageId));
    if (type === 'gallery') setGallery(prev => prev.filter(g => g.id !== pageId));
    setLoadingAction(null);
  }

  const filtered = list.filter(p => {
    const matchesFilter = filter === 'all' ? true : p.status === filter;
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
      p.avatar_name?.toLowerCase().includes(q) ||
      p.sl_uuid?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = list.filter(p => p.status === 'pending').length;
  const pendingChronicles = chronicles.length;
  const pendingGallery = gallery.length;

  return (
    <>
      <Head><title>Admin Panel — DawnDream</title></Head>
      <Navbar activePage="admin" />
      <div className={styles.body}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.sub}>Logged in as {adminName} &nbsp;·&nbsp; {list.length} total players</p>
        </div>

        <div className={styles.sections}>
          <button className={`${styles.sectionBtn} ${section === 'players' ? styles.sectionActive : ''}`} onClick={() => setSection('players')}>
            Players
            {pendingCount > 0 && <span className={styles.badge}>{pendingCount}</span>}
          </button>
          <button className={`${styles.sectionBtn} ${section === 'chronicles' ? styles.sectionActive : ''}`} onClick={() => setSection('chronicles')}>
            Chronicles
            {pendingChronicles > 0 && <span className={styles.badge}>{pendingChronicles}</span>}
          </button>
          <button className={`${styles.sectionBtn} ${section === 'gallery' ? styles.sectionActive : ''}`} onClick={() => setSection('gallery')}>
            Gallery
            {pendingGallery > 0 && <span className={styles.badge}>{pendingGallery}</span>}
          </button>
        </div>

        {section === 'players' && (
          <>
            <div className={styles.searchBar}>
              <input className={styles.searchInput} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by avatar name, SL UUID or email..." />
              {search && <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>}
            </div>
            <div className={styles.filters}>
              {['pending', 'approved', 'rejected', 'banned', 'all'].map(f => (
                <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({list.filter(p => f === 'all' ? true : p.status === f).length})
                </button>
              ))}
            </div>
            <div className={styles.playerList}>
              {filtered.length === 0 && <p className={styles.empty}>{search ? `No players found matching "${search}"` : 'No players in this category'}</p>}
              {filtered.map(player => (
                <div key={player.id} className={styles.playerCard}>
                  <div className={styles.playerInfo}>
                    <div className={styles.playerTop}>
                      {player.status === 'approved' ? (
                        <Link href={`/player/${player.avatar_name}`} className={styles.playerNameLink}>{player.avatar_name}</Link>
                      ) : (
                        <span className={styles.playerName}>{player.avatar_name}</span>
                      )}
                      <span className={`${styles.statusBadge} ${styles[player.status]}`}>{player.status}</span>
                      {player.role === 'admin' && <span className={styles.adminBadge}>Admin</span>}
                    </div>
                    <div className={styles.playerMeta}>
                      <span className={styles.playerDate}>Registered {new Date(player.created_at).toLocaleDateString('en-GB')}</span>
                      {player.email && <span className={styles.playerEmail}>{player.email}</span>}
                      {player.sl_uuid && <span className={styles.playerUuid}>{player.sl_uuid}</span>}
                    </div>
                  </div>
                  <div className={styles.actions}>
                    {player.status === 'pending' && (
                      <>
                        <button className={styles.approveBtn} onClick={() => handlePlayerAction(player.id, 'approve')} disabled={loadingAction === player.id + 'approve'}>{loadingAction === player.id + 'approve' ? '...' : 'Approve'}</button>
                        <button className={styles.rejectBtn} onClick={() => handlePlayerAction(player.id, 'reject')} disabled={loadingAction === player.id + 'reject'}>{loadingAction === player.id + 'reject' ? '...' : 'Reject'}</button>
                      </>
                    )}
                    {player.status === 'approved' && player.role !== 'admin' && (
                      <button className={styles.banBtn} onClick={() => handlePlayerAction(player.id, 'ban')} disabled={loadingAction === player.id + 'ban'}>{loadingAction === player.id + 'ban' ? '...' : 'Ban'}</button>
                    )}
                    {(player.status === 'banned' || player.status === 'rejected') && (
                      <button className={styles.approveBtn} onClick={() => handlePlayerAction(player.id, 'approve')} disabled={loadingAction === player.id + 'approve'}>{player.status === 'banned' ? 'Unban' : 'Approve'}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {section === 'chronicles' && (
          <div className={styles.contentSection}>
            <p className={styles.sectionDesc}>Chronicles submitted by players — approve to publish on the site or reject to archive.</p>
            {contentLoading && <p className={styles.empty}>Loading...</p>}
            {!contentLoading && chronicles.length === 0 && <p className={styles.empty}>No chronicles pending review!</p>}
            {!contentLoading && chronicles.map(item => (
              <div key={item.id} className={styles.contentCard}>
                <div className={styles.contentHeader}>
                  <div className={styles.contentMeta}>
                    <span className={styles.contentTitle}>{item.title}</span>
                    <div className={styles.contentSub}>
                      <span className={styles.contentAuthor}>By {item.author}</span>
                      {item.category && <span className={styles.contentCat}>{item.category}</span>}
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.approveBtn} onClick={() => handleNotionAction(item.id, 'approve', 'chronicles')} disabled={loadingAction === item.id + 'approve'}>{loadingAction === item.id + 'approve' ? '...' : 'Publish'}</button>
                    <button className={styles.rejectBtn} onClick={() => handleNotionAction(item.id, 'reject', 'chronicles')} disabled={loadingAction === item.id + 'reject'}>{loadingAction === item.id + 'reject' ? '...' : 'Reject'}</button>
                  </div>
                </div>
                {item.preview && (
                  <p className={styles.contentPreview}>{item.preview}</p>
                )}
                {item.story && (
                  <details className={styles.storyDetails}>
                    <summary className={styles.storySummary}>Read full story</summary>
                    <div className={styles.storyText}>
                      {item.story.split('\n').filter(p => p.trim()).map((para, i) => <p key={i}>{para}</p>)}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {section === 'gallery' && (
          <div className={styles.contentSection}>
            <p className={styles.sectionDesc}>Photos submitted by players — approve to add to the gallery or reject to remove.</p>
            {contentLoading && <p className={styles.empty}>Loading...</p>}
            {!contentLoading && gallery.length === 0 && <p className={styles.empty}>No photos pending review!</p>}
            <div className={styles.galleryGrid}>
              {!contentLoading && gallery.map(item => (
                <div key={item.id} className={styles.galleryCard}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={`By ${item.author}`} className={styles.galleryImg} />
                  ) : (
                    <div className={styles.galleryPlaceholder}>No image</div>
                  )}
                  <div className={styles.galleryFooter}>
                    <span className={styles.galleryAuthor}>By {item.author}</span>
                    <div className={styles.actions}>
                      <button className={styles.approveBtn} onClick={() => handleNotionAction(item.id, 'approve', 'gallery')} disabled={loadingAction === item.id + 'approve'}>{loadingAction === item.id + 'approve' ? '...' : 'Publish'}</button>
                      <button className={styles.rejectBtn} onClick={() => handleNotionAction(item.id, 'reject', 'gallery')} disabled={loadingAction === item.id + 'reject'}>{loadingAction === item.id + 'reject' ? '...' : 'Reject'}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <footer className={styles.footer}>DawnDream Vampire System &nbsp;·&nbsp; Admin Panel</footer>
    </>
  );
}
