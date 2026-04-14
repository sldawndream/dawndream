import { query } from '@/lib/mysql';

/**
 * GET /api/mysql/clans
 * Live clan list with member counts, houses, and oath status.
 * Used to sync the Clans page dynamically from MySQL.
 */
export async function GET() {
  try {
    const clans = await query(
      `SELECT c.*,
              b.name AS oath_bloodline_name,
              COUNT(DISTINCT v.player_id) AS member_count,
              COUNT(DISTINCT h.id)         AS house_count
       FROM   clans c
       LEFT JOIN Bloodlines b ON b.id  = c.oath_bloodline_id
       LEFT JOIN vampires   v ON v.clan_id = c.id
       LEFT JOIN houses     h ON h.clan_id = c.id AND h.is_active = 1
       WHERE  c.is_active = 1
       GROUP BY c.id
       ORDER BY member_count DESC`
    );

    // Fetch top members (by age) for each clan
    for (const clan of clans) {
      clan.top_members = await query(
        `SELECT v.avatar_name, v.generation,
                (DATEDIFF(NOW(), v.embrace_at) + IFNULL(v.age_bonus_days,0)) AS age_days,
                clr.name AS role_name, clr.power_level
         FROM   vampires   v
         JOIN   clan_roles clr ON clr.id = v.clan_role_id
         WHERE  v.clan_id = ?
         ORDER BY clr.power_level DESC, age_days DESC
         LIMIT 5`,
        [clan.id]
      );

      clan.houses = await query(
        `SELECT h.id, h.name, h.tag, h.description,
                COUNT(v.player_id) AS member_count
         FROM   houses  h
         LEFT JOIN vampires v ON v.house_id = h.id
         WHERE  h.clan_id = ? AND h.is_active = 1
         GROUP BY h.id
         ORDER BY member_count DESC`,
        [clan.id]
      );
    }

    return Response.json({ clans });
  } catch (err) {
    console.error('[clans]', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
