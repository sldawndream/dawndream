import Head from 'next/head';
import Navbar from '../../components/Navbar';
import AuthGuard from '../../components/AuthGuard';
import { createClient } from '@supabase/supabase-js';
import styles from '../../styles/PlayerProfile.module.css';

export async function getServerSideProps({ params }) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: players } = await supabase
    .from('players')
    .select('id,avatar_name,display_name,profile_image,role,created_at,bio,lore')
    .eq('avatar_name', params.name)
    .eq('status', 'approved');
  if (!players || !players.length) return { notFound: true };
  return { props: { player: players[0] } };
}

// TODO: Replace with real MySQL data once DB access is available
function getPlayerStats(avatarName) {
  return null;
}

export default function PlayerProfilePage({ player }) {
  const displayName = player.display_name || player.avatar_name;
  const stats = getPlayerStats(player.avatar_name);

  return (
    <>
      <Head>
        <title>{displayName} — DawnDream</title>
        <meta name="description" content={`${displayName}'s DawnDream profile`} />
      </Head>
      <Navbar />
      <AuthGuard>
        <div className={styles.page}>
          <div className={styles.banner}>
            <div className={styles.bannerPattern} />
            <div className={styles.bannerGlow} />
          </div>

          <div className={styles.profileHeader}>
            <div className={styles.avatarRing}>
              {player.profile_image ? (
                <img src={player.profile_image} alt={displayName} className={styles.avatarImg} />
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
          </div>

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
                    <p>Combat stats coming soon.</p>
                  </div>
                )}
              </div>

              <div className={styles.card}>
                <p className={styles.cardTitle}>Lineage Stats</p>
                {stats ? (
                  <>
                    <div className={styles.statRow}><span className={styles.statLabel}>Players Sired</span><span className={styles.statVal}>{stats.sired}</span></div>
                    <div className={styles.statRow}><span className={styles.statLabel}>Total Descendants</span><span className={`${styles.statVal} ${styles.gold}`}>{stats.descendants}</span></div>
                    <div className={styles.statRow}><span className={styles.statLabel}>Generation</span><span className={`${styles.statVal} ${styles.gold}`}>{stats.generation}</span></div>
                  </>
                ) : (
                  <div className={styles.dbPending}>
                    <span className={styles.dbIcon}>🦇</span>
                    <p>Lineage stats coming soon.</p>
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
                    <p>Bloodline & clan data coming soon.</p>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.rightCol}>
              {player.bio && (
                <div className={styles.card}>
                  <p className={styles.cardTitle}>About</p>
                  <p className={styles.bioText}>{player.bio}</p>
                </div>
              )}
              {player.lore && (
                <div className={styles.card}>
                  <p className={styles.cardTitle}>Personal Lore</p>
                  <div className={styles.loreText}>
                    {player.lore.split('\n').filter(p => p.trim()).map((para, i) => <p key={i}>{para}</p>)}
                  </div>
                </div>
              )}
              {!player.bio && !player.lore && (
                <div className={styles.card}>
                  <p className={styles.emptyText}>This vampire has not yet written their story...</p>
                </div>
              )}

              <div className={styles.card}>
                <p className={styles.cardTitle}>Achievements</p>
                <div className={styles.dbPending}>
                  <span className={styles.dbIcon}>🏆</span>
                  <p>Achievements coming soon.</p>
                </div>
              </div>

              <div className={styles.card}>
                <p className={styles.cardTitle}>Lineage Tree</p>
                <div className={styles.dbPending}>
                  <span className={styles.dbIcon}>🌳</span>
                  <p>Lineage tree coming soon.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <footer className={styles.footer}>DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG</footer>
      </AuthGuard>
    </>
  );
}
