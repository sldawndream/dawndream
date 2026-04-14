import { query } from '@/lib/mysql';

/**
 * GET /api/mysql/hordes
 * Live horde list with member counts from MySQL.
 */
export async function GET() {
  try {
    const hordes = await query(
      `SELECT hd.*,
              COUNT(ps.player_id) AS member_count
       FROM   hordes hd
       LEFT JOIN player_state ps ON ps.horde_id = hd.id
       WHERE  hd.is_active = 1
       GROUP BY hd.id
       ORDER BY member_count DESC`
    );

    for (const horde of hordes) {
      horde.top_members = await query(
        `SELECT v.avatar_name,
                hdr.name AS role_name, hdr.power_level,
                (DATEDIFF(NOW(), v.embrace_at) + IFNULL(v.age_bonus_days,0)) AS age_days
         FROM   player_state ps
         JOIN   vampires    v   ON v.player_id  = ps.player_id
         JOIN   horde_roles hdr ON hdr.id       = ps.horde_role_id
         WHERE  ps.horde_id = ?
         ORDER BY hdr.power_level DESC, age_days DESC
         LIMIT 5`,
        [horde.id]
      );
    }

    return Response.json({ hordes });
  } catch (err) {
    console.error('[hordes]', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
