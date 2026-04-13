import Head from 'next/head';
import { useState } from 'react';
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
  const [list, setList] = useState(players);
  const [loading, setLoading] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');

  async function handleAction(playerId, action) {
    setLoading(playerId + action);
    await fetch('/api/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, action }),
    });
    setList(prev => prev.map(p => p.id === playerId ? {
      ...p,
      status: action === 'approve' ? 'approved' : action === 'ban' ? 'banned' : 'rejected'
    } : p));
    setLoading(null);
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

  return (
    <>
      <Head><title>Admin Panel — DawnDream</title></Head>
      <Navbar activePage="admin" />
      <div className={styles.body}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.sub}>Logged in as {adminName} &nbsp;·&nbsp; {list.length} total players</p>
        </div>

        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by avatar name, SL UUID or email..."
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <div className={styles.filters}>
          {['pending', 'approved', 'rejected', 'banned', 'all'].map(f => (
            <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({list.filter(p => f === 'all' ? true : p.status === f).length})
            </button>
          ))}
        </div>

        <div className={styles.playerList}>
          {filtered.length === 0 && (
            <p className={styles.empty}>
              {search ? `No players found matching "${search}"` : 'No players in this category'}
            </p>
          )}
          {filtered.map(player => (
            <div key={player.id} className={styles.playerCard}>
              <div className={styles.playerInfo}>
                <div className={styles.playerTop}>
                  {player.status === 'approved' ? (
                    <Link href={`/player/${player.avatar_name}`} className={styles.playerNameLink}>
                      {player.avatar_name}
                    </Link>
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
                    <button className={styles.approveBtn} onClick={() => handleAction(player.id, 'approve')} disabled={loading === player.id + 'approve'}>
                      {loading === player.id + 'approve' ? '...' : 'Approve'}
                    </button>
                    <button className={styles.rejectBtn} onClick={() => handleAction(player.id, 'reject')} disabled={loading === player.id + 'reject'}>
                      {loading === player.id + 'reject' ? '...' : 'Reject'}
                    </button>
                  </>
                )}
                {player.status === 'approved' && player.role !== 'admin' && (
                  <button className={styles.banBtn} onClick={() => handleAction(player.id, 'ban')} disabled={loading === player.id + 'ban'}>
                    {loading === player.id + 'ban' ? '...' : 'Ban'}
                  </button>
                )}
                {player.status === 'banned' && (
                  <button className={styles.approveBtn} onClick={() => handleAction(player.id, 'approve')} disabled={loading === player.id + 'approve'}>
                    Unban
                  </button>
                )}
                {player.status === 'rejected' && (
                  <button className={styles.approveBtn} onClick={() => handleAction(player.id, 'approve')} disabled={loading === player.id + 'approve'}>
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <footer className={styles.footer}>DawnDream Vampire System &nbsp;·&nbsp; Admin Panel</footer>
    </>
  );
}
