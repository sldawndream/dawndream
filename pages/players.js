import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { getPlayerFromRequest } from '../lib/auth';
import { createClient } from '@supabase/supabase-js';
import styles from '../styles/Players.module.css';

export async function getServerSideProps({ req }) {
  // Server-side auth — unauthenticated users are redirected before any data is fetched or sent
  const session = await getPlayerFromRequest(req);
  if (!session) {
    return { redirect: { destination: '/login?next=/players', permanent: false } };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: players } = await supabase
    .from('players')
    .select('id, avatar_name, display_name, profile_image, role, created_at, bio')
    .eq('status', 'approved')
    .order('avatar_name', { ascending: true });
  return { props: { players: players || [] } };
}

const ROLES = ['All', 'admin', 'player'];
const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

export default function PlayersPage({ players }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sort, setSort] = useState('name_asc');

  const filtered = useMemo(() => {
    let list = [...players];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        (p.avatar_name || '').toLowerCase().includes(q) ||
        (p.display_name || '').toLowerCase().includes(q) ||
        (p.bio || '').toLowerCase().includes(q)
      );
    }

    if (roleFilter !== 'All') {
      list = list.filter(p => p.role === roleFilter);
    }

    list.sort((a, b) => {
      const nameA = (a.display_name || a.avatar_name).toLowerCase();
      const nameB = (b.display_name || b.avatar_name).toLowerCase();
      if (sort === 'name_asc') return nameA.localeCompare(nameB);
      if (sort === 'name_desc') return nameB.localeCompare(nameA);
      if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      return 0;
    });

    return list;
  }, [players, search, roleFilter, sort]);

  const admins = players.filter(p => p.role === 'admin');
  const totalApproved = players.length;

  return (
    <>
      <Head>
        <title>The Coven — DawnDream Player Directory</title>
        <meta name="description" content="Browse all approved DawnDream vampires. Search by name, filter by role." />
      </Head>

      <Navbar activePage="players" />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Souls of the Eternal Night</p>
        <h1 className={styles.heroTitle}>The Coven</h1>
        <p className={styles.heroSub}>
          {totalApproved} {totalApproved === 1 ? 'vampire walks' : 'vampires walk'} beneath the eternal darkness.
        </p>
        <div className={styles.heroDivider} />
        <p className={styles.heroIntro}>
          Each soul here has sworn allegiance to the DawnDream — bound by blood, shadow, and the ancient covenant.
          Seek out your kin, or learn who stands against you.
        </p>
      </section>

        <div className={styles.body}>

          {/* Controls */}
          <div className={styles.controls}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search by name or bio…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoComplete="off"
              />
              {search && (
                <button className={styles.clearBtn} onClick={() => setSearch('')} aria-label="Clear">✕</button>
              )}
            </div>

            <div className={styles.filters}>
              <div className={styles.roleFilters}>
                {ROLES.map(r => (
                  <button
                    key={r}
                    className={`${styles.roleBtn} ${roleFilter === r ? styles.roleBtnActive : ''}`}
                    onClick={() => setRoleFilter(r)}
                  >
                    {r === 'All' ? 'All Souls' : r === 'admin' ? '👑 Admin' : '🦇 Player'}
                  </button>
                ))}
              </div>
              <select
                className={styles.sortSelect}
                value={sort}
                onChange={e => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <p className={styles.resultCount}>
            {filtered.length === 0
              ? 'No vampires found matching your search.'
              : `${filtered.length} ${filtered.length === 1 ? 'vampire' : 'vampires'} found`}
            {search && <span className={styles.searchTerm}> for "{search}"</span>}
          </p>

          {/* Grid */}
          {filtered.length > 0 && (
            <div className={styles.grid}>
              {filtered.map(player => {
                const displayName = player.display_name || player.avatar_name;
                const initial = player.avatar_name.charAt(0).toUpperCase();
                const joinYear = new Date(player.created_at).getFullYear();
                return (
                  <Link key={player.id} href={`/player/${player.avatar_name}`} className={styles.card}>
                    <div className={styles.cardGlow} />
                    <div className={styles.avatarWrap}>
                      {player.profile_image ? (
                        <img
                          src={player.profile_image}
                          alt={displayName}
                          className={styles.avatar}
                        />
                      ) : (
                        <div className={styles.avatarPlaceholder}>{initial}</div>
                      )}
                      {player.role === 'admin' && (
                        <span className={styles.adminCrown} title="Admin">👑</span>
                      )}
                    </div>

                    <div className={styles.cardBody}>
                      <p className={styles.cardName}>{displayName}</p>
                      <p className={styles.cardHandle}>@{player.avatar_name}</p>

                      <div className={styles.cardMeta}>
                        <span className={`${styles.rolePill} ${player.role === 'admin' ? styles.rolePillAdmin : styles.rolePillPlayer}`}>
                          {player.role}
                        </span>
                        <span className={styles.joinYear}>Since {joinYear}</span>
                      </div>

                      {player.bio && (
                        <p className={styles.cardBio}>
                          {player.bio.length > 90 ? player.bio.slice(0, 90).trim() + '…' : player.bio}
                        </p>
                      )}
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.viewProfile}>View Profile →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🦇</span>
              <p className={styles.emptyTitle}>No souls found</p>
              <p className={styles.emptySub}>
                {search
                  ? `No vampire matches "${search}". Try a different name.`
                  : 'No approved players yet. The night awaits its first children.'}
              </p>
              {search && (
                <button className={styles.emptyReset} onClick={() => { setSearch(''); setRoleFilter('All'); }}>
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      <footer className={styles.footer}>
        DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All souls © DawnDream
      </footer>
    </>
  );
}
