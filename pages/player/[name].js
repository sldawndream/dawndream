import Head from 'next/head';
import Navbar from '../../components/Navbar';
import AuthGuard from '../../components/AuthGuard';
import { createClient } from '@supabase/supabase-js';
import styles from '../../styles/PlayerProfile.module.css';

export async function getServerSideProps({ params }) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: players } = await supabase
    .from('players')
    .select('id, avatar_name, display_name, profile_image, role, created_at, bio, lore')
    .eq('avatar_name', params.name)
    .eq('status', 'approved');

  if (!players || !players.length) return { notFound: true };
  return { props: { player: players[0] } };
}

export default function PlayerProfilePage({ player }) {
  const displayName = player.display_name || player.avatar_name;

  return (
    <>
      <Head>
        <title>{displayName} — DawnDream</title>
        <meta name="description" content={`${displayName}'s DawnDream profile`} />
      </Head>
      <Navbar />
      <AuthGuard>
        <div className={styles.page}>
          <div className={styles.profileHero}>
            <div className={styles.heroBg} />
            <div className={styles.heroContent}>
              <div className={styles.avatarWrap}>
                {player.profile_image ? (
                  <img src={player.profile_image} alt={displayName} className={styles.avatarImg} />
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
            </div>
          </div>

          <div className={styles.profileBody}>
            {player.bio && (
              <div className={styles.profileSection}>
                <p className={styles.sectionEyebrow}>About</p>
                <p className={styles.bioText}>{player.bio}</p>
              </div>
            )}
            {player.lore && (
              <div className={styles.profileSection}>
                <p className={styles.sectionEyebrow}>Personal Lore</p>
                <div className={styles.loreText}>
                  {player.lore.split('\n').filter(p => p.trim()).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            )}
            {!player.bio && !player.lore && (
              <div className={styles.profileSection}>
                <p className={styles.emptyText}>This vampire has not yet written their story...</p>
              </div>
            )}
          </div>
        </div>
        <footer className={styles.footer}>DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG</footer>
      </AuthGuard>
    </>
  );
}
