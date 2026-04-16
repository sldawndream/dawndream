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

  // Pending count for Eternal Press tab badge
  const { count: epPending } = await supabase
    .from('eternal_press_articles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    props: {
      players: players || [],
      adminName: player.avatar_name,
      initialEpPending: epPending || 0,
    }
  };
}

export default function AdminPage({ players, adminName, initialEpPending }) {
  const [section, setSection] = useState('players');
  const [list, setList] = useState(players);
  const [loadingAction, setLoadingAction] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');

  const [chroniclesPendingCount, setChroniclesPendingCount] = useState(0);
  const [galleryPendingCount, setGalleryPendingCount] = useState(0);
  const [epPendingCount, setEpPendingCount] = useState(initialEpPending || 0);

  const [chroniclesTab, setChroniclesTab] = useState('pending');
  const [chronicles, setChronicles] = useState([]);
  const [chroniclesLoading, setChroniclesLoading] = useState(false);

  const [galleryTab, setGalleryTab] = useState('pending');
  const [gallery, setGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const [eternalPressTab, setEternalPressTab] = useState('pending');
  const [eternalPress, setEternalPress] = useState([]);
  const [eternalPressLoading, setEternalPressLoading] = useState(false);
  const [roleLoadingId, setRoleLoadingId] = useState(null);

  async function loadContent(type, status) {
    if (type === 'chronicles') setChroniclesLoading(true);
    if (type === 'gallery') setGalleryLoading(true);
    const res = await fetch(`/api/admin-notion?type=${type}&status=${status}`);
    const data = await res.json();
    if (type === 'chronicles') {
      setChronicles(data.items || []);
      setChroniclesLoading(false);
      if (status === 'pending') setChroniclesPendingCount((data.items || []).length);
    }
    if (type === 'gallery') {
      setGallery(data.items || []);
      setGalleryLoading(false);
      if (status === 'pending') setGalleryPendingCount((data.items || []).length);
    }
  }

  // Load pending counts on mount for badge display
  useEffect(() => {
    fetch('/api/admin-notion?type=chronicles&status=pending')
      .then(r => r.json()).then(d => setChroniclesPendingCount((d.items || []).length)).catch(() => {});
    fetch('/api/admin-notion?type=gallery&status=pending')
      .then(r => r.json()).then(d => setGalleryPendingCount((d.items || []).length)).catch(() => {});
  }, []);

  useEffect(() => {
    if (section === 'chronicles') loadContent('chronicles', chroniclesTab);
  }, [section, chroniclesTab]);

  useEffect(() => {
    if (section === 'gallery') loadContent('gallery', galleryTab);
  }, [section, galleryTab]);

  useEffect(() => {
    if (section === 'eternal-press') loadEternalPress(eternalPressTab);
  }, [section, eternalPressTab]);

  async function loadEternalPress(status) {
    setEternalPressLoading(true);
    const res = await fetch(`/api/eternal-press-articles?status=${status}`);
    const data = await res.json();
    setEternalPress(data.articles || []);
    setEternalPressLoading(false);
    if (status === 'pending') setEpPendingCount((data.articles || []).length);
  }

  async function handleEternalPressAction(articleId, action) {
    setLoadingAction(articleId + action);
    await fetch('/api/eternal-press-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, action }),
    });
    await loadEternalPress(eternalPressTab);
    setLoadingAction(null);
  }

  async function handleSetRole(playerId, role) {
    setRoleLoadingId(playerId);
    await fetch('/api/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, role }),
    });
    setList(prev => prev.map(p => p.id === playerId ? { ...p, role } : p));
    setRoleLoadingId(null);
  }

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
            Players {pendingCount > 0 && <span className={styles.notifBadge}>{pendingCount}</span>}
          </button>
          <button className={`${styles.sectionBtn} ${section === 'chronicles' ? styles.sectionActive : ''}`} onClick={() => setSection('chronicles')}>
            Chronicles {chroniclesPendingCount > 0 && <span className={styles.notifBadge}>{chroniclesPendingCount}</span>}
          </button>
          <button className={`${styles.sectionBtn} ${section === 'gallery' ? styles.sectionActive : ''}`} onClick={() => setSection('gallery')}>
            Gallery {galleryPendingCount > 0 && <span className={styles.notifBadge}>{galleryPendingCount}</span>}
          </button>
          <button className={`${styles.sectionBtn} ${section === 'eternal-press' ? styles.sectionActive : ''}`} onClick={() => setSection('eternal-press')}>
            Eternal Press {epPendingCount > 0 && <span className={styles.notifBadge}>{epPendingCount}</span>}
          </button>
          <button className={`${styles.sectionBtn} ${section === 'roles' ? styles.sectionActive : ''}`} onClick={() => setSection('roles')}>
            Roles
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
          <>
            <div className={styles.subTabs}>
              <button className={`${styles.subTab} ${chroniclesTab === 'pending' ? styles.subTabActive : ''}`} onClick={() => setChroniclesTab('pending')}>
                Pending Review
              </button>
              <button className={`${styles.subTab} ${chroniclesTab === 'published' ? styles.subTabActive : ''}`} onClick={() => setChroniclesTab('published')}>
                Published
              </button>
            </div>
            <div className={styles.contentSection}>
              {chroniclesTab === 'pending' && <p className={styles.sectionDesc}>Chronicles submitted by players — review and publish or reject.</p>}
              {chroniclesTab === 'published' && <p className={styles.sectionDesc}>Currently live chronicles — unpublish to hide or delete to remove permanently.</p>}
              {chroniclesLoading && <p className={styles.empty}>Loading...</p>}
              {!chroniclesLoading && chronicles.length === 0 && (
                <p className={styles.empty}>{chroniclesTab === 'pending' ? 'No chronicles pending review!' : 'No published chronicles yet.'}</p>
              )}
              {!chroniclesLoading && chronicles.map(item => (
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
                      {chroniclesTab === 'pending' && (
                        <>
                          <button className={styles.approveBtn} onClick={() => handleNotionAction(item.id, 'approve', 'chronicles')} disabled={loadingAction === item.id + 'approve'}>{loadingAction === item.id + 'approve' ? '...' : 'Publish'}</button>
                          <button className={styles.rejectBtn} onClick={() => handleNotionAction(item.id, 'reject', 'chronicles')} disabled={loadingAction === item.id + 'reject'}>{loadingAction === item.id + 'reject' ? '...' : 'Reject'}</button>
                        </>
                      )}
                      {chroniclesTab === 'published' && (
                        <>
                          <button className={styles.warnBtn} onClick={() => handleNotionAction(item.id, 'unpublish', 'chronicles')} disabled={loadingAction === item.id + 'unpublish'}>{loadingAction === item.id + 'unpublish' ? '...' : 'Unpublish'}</button>
                          <button className={styles.deleteBtn} onClick={() => { if(confirm('Delete this chronicle permanently?')) handleNotionAction(item.id, 'delete', 'chronicles'); }} disabled={loadingAction === item.id + 'delete'}>{loadingAction === item.id + 'delete' ? '...' : 'Delete'}</button>
                        </>
                      )}
                    </div>
                  </div>
                  {item.preview && <p className={styles.contentPreview}>{item.preview}</p>}
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
          </>
        )}

        {section === 'gallery' && (
          <>
            <div className={styles.subTabs}>
              <button className={`${styles.subTab} ${galleryTab === 'pending' ? styles.subTabActive : ''}`} onClick={() => setGalleryTab('pending')}>
                Pending Review
              </button>
              <button className={`${styles.subTab} ${galleryTab === 'published' ? styles.subTabActive : ''}`} onClick={() => setGalleryTab('published')}>
                Published
              </button>
            </div>
            <div className={styles.contentSection}>
              {galleryTab === 'pending' && <p className={styles.sectionDesc}>Photos submitted by players — approve to add to the gallery or reject to remove.</p>}
              {galleryTab === 'published' && <p className={styles.sectionDesc}>Currently live gallery photos — unpublish to hide or delete to remove permanently.</p>}
              {galleryLoading && <p className={styles.empty}>Loading...</p>}
              {!galleryLoading && gallery.length === 0 && (
                <p className={styles.empty}>{galleryTab === 'pending' ? 'No photos pending review!' : 'No published photos yet.'}</p>
              )}
              <div className={styles.galleryGrid}>
                {!galleryLoading && gallery.map(item => (
                  <div key={item.id} className={styles.galleryCard}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={`By ${item.author}`} className={styles.galleryImg} />
                    ) : (
                      <div className={styles.galleryPlaceholder}>No image</div>
                    )}
                    <div className={styles.galleryFooter}>
                      <span className={styles.galleryAuthor}>By {item.author}</span>
                      <div className={styles.actions}>
                        {galleryTab === 'pending' && (
                          <>
                            <button className={styles.approveBtn} onClick={() => handleNotionAction(item.id, 'approve', 'gallery')} disabled={loadingAction === item.id + 'approve'}>{loadingAction === item.id + 'approve' ? '...' : 'Publish'}</button>
                            <button className={styles.rejectBtn} onClick={() => handleNotionAction(item.id, 'reject', 'gallery')} disabled={loadingAction === item.id + 'reject'}>{loadingAction === item.id + 'reject' ? '...' : 'Reject'}</button>
                          </>
                        )}
                        {galleryTab === 'published' && (
                          <>
                            <button className={styles.warnBtn} onClick={() => handleNotionAction(item.id, 'unpublish', 'gallery')} disabled={loadingAction === item.id + 'unpublish'}>{loadingAction === item.id + 'unpublish' ? '...' : 'Unpublish'}</button>
                            <button className={styles.deleteBtn} onClick={() => { if(confirm('Delete this photo permanently?')) handleNotionAction(item.id, 'delete', 'gallery'); }} disabled={loadingAction === item.id + 'delete'}>{loadingAction === item.id + 'delete' ? '...' : 'Delete'}</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {section === 'eternal-press' && (
          <>
            <div className={styles.subTabs}>
              <button className={`${styles.subTab} ${eternalPressTab === 'pending' ? styles.subTabActive : ''}`} onClick={() => setEternalPressTab('pending')}>
                Pending Review
              </button>
              <button className={`${styles.subTab} ${eternalPressTab === 'published' ? styles.subTabActive : ''}`} onClick={() => setEternalPressTab('published')}>
                Published
              </button>
              <button className={`${styles.subTab} ${eternalPressTab === 'rejected' ? styles.subTabActive : ''}`} onClick={() => setEternalPressTab('rejected')}>
                Rejected
              </button>
            </div>
            <div className={styles.contentSection}>
              {eternalPressTab === 'pending' && <p className={styles.sectionDesc}>Articles submitted by reporters — publish to make live or reject to send back.</p>}
              {eternalPressTab === 'published' && <p className={styles.sectionDesc}>Live articles — feature to pin as the top story, or delete to remove permanently.</p>}
              {eternalPressTab === 'rejected' && <p className={styles.sectionDesc}>Rejected articles — can be re-published or deleted.</p>}
              {eternalPressLoading && <p className={styles.empty}>Loading...</p>}
              {!eternalPressLoading && eternalPress.length === 0 && (
                <p className={styles.empty}>No articles in this tab.</p>
              )}
              {!eternalPressLoading && eternalPress.map(item => (
                <div key={item.id} className={styles.contentCard}>
                  <div className={styles.contentHeader}>
                    <div className={styles.contentMeta}>
                      <span className={styles.contentTitle}>{item.title}</span>
                      <div className={styles.contentSub}>
                        <span className={styles.contentAuthor}>By {item.author_name}</span>
                        <span className={styles.contentCat}>{item.category}</span>
                        <span className={styles.contentAuthor}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {item.featured && <span className={styles.contentCat} style={{ background: '#1a1200', color: '#c0a030', borderColor: '#5a4010' }}>★ Featured</span>}
                      </div>
                    </div>
                    <div className={styles.actions}>
                      {eternalPressTab === 'pending' && (
                        <>
                          <button className={styles.approveBtn} onClick={() => handleEternalPressAction(item.id, 'publish')} disabled={loadingAction === item.id + 'publish'}>{loadingAction === item.id + 'publish' ? '...' : 'Publish'}</button>
                          <button className={styles.rejectBtn} onClick={() => handleEternalPressAction(item.id, 'reject')} disabled={loadingAction === item.id + 'reject'}>{loadingAction === item.id + 'reject' ? '...' : 'Reject'}</button>
                        </>
                      )}
                      {eternalPressTab === 'published' && (
                        <>
                          {!item.featured
                            ? <button className={styles.approveBtn} onClick={() => handleEternalPressAction(item.id, 'feature')} disabled={loadingAction === item.id + 'feature'}>{loadingAction === item.id + 'feature' ? '...' : '★ Feature'}</button>
                            : <button className={styles.warnBtn} onClick={() => handleEternalPressAction(item.id, 'unfeature')} disabled={loadingAction === item.id + 'unfeature'}>{loadingAction === item.id + 'unfeature' ? '...' : 'Unfeature'}</button>
                          }
                          <button className={styles.deleteBtn} onClick={() => { if (confirm('Delete this article permanently?')) handleEternalPressAction(item.id, 'delete'); }} disabled={loadingAction === item.id + 'delete'}>{loadingAction === item.id + 'delete' ? '...' : 'Delete'}</button>
                        </>
                      )}
                      {eternalPressTab === 'rejected' && (
                        <>
                          <button className={styles.approveBtn} onClick={() => handleEternalPressAction(item.id, 'publish')} disabled={loadingAction === item.id + 'publish'}>{loadingAction === item.id + 'publish' ? '...' : 'Publish'}</button>
                          <button className={styles.deleteBtn} onClick={() => { if (confirm('Delete permanently?')) handleEternalPressAction(item.id, 'delete'); }} disabled={loadingAction === item.id + 'delete'}>{loadingAction === item.id + 'delete' ? '...' : 'Delete'}</button>
                        </>
                      )}
                    </div>
                  </div>
                  {item.excerpt && <p className={styles.contentPreview}>{item.excerpt}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {section === 'roles' && (
          <>
            <p className={styles.sectionDesc} style={{ marginBottom: '16px' }}>
              Assign roles to approved players. <strong>Reporter</strong> — can write and submit EternalPress articles. <strong>Admin</strong> — full access to the admin panel.
            </p>
            <div className={styles.playerList}>
              {list.filter(p => p.status === 'approved').map(p => (
                <div key={p.id} className={styles.playerCard}>
                  <div className={styles.playerInfo}>
                    <div className={styles.playerTop}>
                      <span className={styles.playerName}>{p.avatar_name}</span>
                      <span className={`${styles.statusBadge} ${p.role === 'admin' ? styles.adminBadge : p.role === 'reporter' ? styles.reporterBadge : styles.approved}`}>
                        {p.role}
                      </span>
                    </div>
                    <div className={styles.playerMeta}>
                      <span className={styles.playerEmail}>{p.email}</span>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    {p.role !== 'reporter' && (
                      <button
                        className={styles.approveBtn}
                        onClick={() => handleSetRole(p.id, 'reporter')}
                        disabled={roleLoadingId === p.id}
                        title="Assign Reporter role — can write EternalPress articles"
                      >
                        {roleLoadingId === p.id ? '...' : '✒ Make Reporter'}
                      </button>
                    )}
                    {p.role === 'reporter' && (
                      <button
                        className={styles.rejectBtn}
                        onClick={() => handleSetRole(p.id, 'player')}
                        disabled={roleLoadingId === p.id}
                      >
                        {roleLoadingId === p.id ? '...' : 'Remove Reporter'}
                      </button>
                    )}
                    {p.role !== 'admin' && (
                      <button
                        className={styles.banBtn}
                        onClick={() => { if (confirm(`Make ${p.avatar_name} an admin? They will have full admin panel access.`)) handleSetRole(p.id, 'admin'); }}
                        disabled={roleLoadingId === p.id}
                      >
                        {roleLoadingId === p.id ? '...' : 'Make Admin'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <footer className={styles.footer}>DawnDream Vampire System &nbsp;·&nbsp; Admin Panel</footer>
    </>
  );
}
