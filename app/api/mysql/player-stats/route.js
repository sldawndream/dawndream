import { query, queryOne } from '../../../../lib/mysql';

/**
 * GET /api/mysql/player-stats?name=AvatarName
 * Returns full player stats, vampire data, clan/house/horde membership,
 * blood levels, amrita balance, and bloodline/lineage info.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return Response.json({ error: 'Missing name parameter' }, { status: 400 });
  }

  try {
    // Core vampire row (denormalised view with all the joins pre-done)
    const vampire = await queryOne(
      `SELECT v.*,
              b.name  AS bloodline_name,
              cr.role_name AS bloodline_role_name,
              c.name  AS clan_name, c.tag AS clan_tag,
              clr.name AS clan_role_name,
              h.name  AS house_name, h.tag AS house_tag,
              hr.name AS house_role_name,
              hd.name AS horde_name, hd.tag AS horde_tag,
              hdr.name AS horde_role_name,
              ag.name AS age_group_name, ag.code AS age_group_code,
              sp.name AS species_name,
              ls.name AS life_state_name,
              ps.title_id,
              ps.wedding_partner_id,
              ps.vamp_bless_until, ps.vamp_bless_bonus
       FROM   vampires v
       LEFT JOIN Bloodlines   b   ON b.id         = v.bloodline_id
       LEFT JOIN bloodline_roles cr ON cr.role_id  = v.bloodline_role_id  -- if column exists on vampires
       LEFT JOIN clans        c   ON c.id          = v.clan_id
       LEFT JOIN clan_roles   clr ON clr.id        = v.clan_role_id
       LEFT JOIN houses       h   ON h.id          = v.house_id
       LEFT JOIN house_roles  hr  ON hr.id         = v.house_role_id
       LEFT JOIN hordes       hd  ON hd.id         = (SELECT horde_id FROM player_state WHERE player_id = v.player_id LIMIT 1)
       LEFT JOIN horde_roles  hdr ON hdr.id        = (SELECT horde_role_id FROM player_state WHERE player_id = v.player_id LIMIT 1)
       LEFT JOIN age_groups   ag  ON ag.min_days  <= (DATEDIFF(NOW(), v.embrace_at) + IFNULL(v.age_bonus_days,0))
       LEFT JOIN species      sp  ON sp.id         = v.species_id
       LEFT JOIN life_states  ls  ON ls.id         = v.life_state_id
       LEFT JOIN player_state ps  ON ps.player_id  = v.player_id
       WHERE  v.avatar_name = ?
       ORDER BY ag.min_days DESC
       LIMIT 1`,
      [name]
    );

    if (!vampire) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    const pid = vampire.player_id;

    // Blood & currency balances
    const [blood, amrita, velarium] = await Promise.all([
      queryOne('SELECT current_blood_ml FROM vampire_blood WHERE player_id = ?', [pid]),
      queryOne('SELECT balance FROM vampire_amrita WHERE player_id = ?', [pid]),
      queryOne('SELECT velarium FROM vampire_velarium WHERE player_id = ?', [pid]),
    ]);

    // Sire info (one level up)
    const sire = vampire.sire_id
      ? await queryOne('SELECT player_id, avatar_name FROM vampires WHERE player_id = ?', [vampire.sire_id])
      : null;

    // Immediate childer count
    const [{ childer_count }] = await query(
      'SELECT COUNT(*) AS childer_count FROM vampires WHERE sire_id = ?',
      [pid]
    );

    // Kill / death counts
    const [kills, deaths] = await Promise.all([
      queryOne('SELECT COUNT(*) AS cnt FROM death_log WHERE killer_player_id = ?', [pid]),
      queryOne('SELECT COUNT(*) AS cnt FROM death_log WHERE dead_player_id   = ?', [pid]),
    ]);

    // Bite count
    const [bites] = await query(
      'SELECT COUNT(*) AS cnt FROM bite_log WHERE attacker_player_id = ?',
      [pid]
    );

    // Active dark gifts (via player_state.title_id — adapt if you have a player_dark_gifts table)
    // Titles owned
    const titles = await query(
      `SELECT tc.name, tc.rarity, tc.code
       FROM   titles_purchased tp
       JOIN   dd_titles_catalog tc ON tc.id = tp.title_id
       WHERE  tp.player_id = ?`,
      [pid]
    );

    return Response.json({
      vampire,
      blood: blood?.current_blood_ml ?? null,
      amrita: amrita?.balance ?? null,
      velarium: velarium?.velarium ?? null,
      sire,
      childer_count,
      kills: kills?.cnt ?? 0,
      deaths: deaths?.cnt ?? 0,
      bites: bites?.cnt ?? 0,
      titles,
    });
  } catch (err) {
    console.error('[player-stats]', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
