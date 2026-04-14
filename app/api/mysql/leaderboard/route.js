import { query } from '../../../../lib/mysql';

/**
 * GET /api/mysql/leaderboard?type=age|kills|bites|amrita|blood&limit=25
 * Returns ranked player lists for the website leaderboard page.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type  = searchParams.get('type')  || 'age';
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);

  try {
    let rows;

    switch (type) {
      case 'age':
        rows = await query(
          `SELECT v.avatar_name,
                  b.name  AS bloodline_name,
                  c.name  AS clan_name,
                  (DATEDIFF(NOW(), v.embrace_at) + IFNULL(v.age_bonus_days,0)) AS age_days,
                  v.generation
           FROM   vampires v
           LEFT JOIN Bloodlines b ON b.id = v.bloodline_id
           LEFT JOIN clans      c ON c.id = v.clan_id
           ORDER BY age_days DESC
           LIMIT ?`,
          [limit]
        );
        break;

      case 'kills':
        rows = await query(
          `SELECT v.avatar_name,
                  b.name  AS bloodline_name,
                  c.name  AS clan_name,
                  COUNT(dl.id) AS kill_count
           FROM   vampires v
           LEFT JOIN death_log  dl ON dl.killer_player_id = v.player_id
           LEFT JOIN Bloodlines b  ON b.id = v.bloodline_id
           LEFT JOIN clans      c  ON c.id = v.clan_id
           GROUP BY v.player_id
           ORDER BY kill_count DESC
           LIMIT ?`,
          [limit]
        );
        break;

      case 'bites':
        rows = await query(
          `SELECT v.avatar_name,
                  b.name  AS bloodline_name,
                  c.name  AS clan_name,
                  COUNT(bl.id) AS bite_count
           FROM   vampires v
           LEFT JOIN bite_log   bl ON bl.attacker_player_id = v.player_id
           LEFT JOIN Bloodlines b  ON b.id = v.bloodline_id
           LEFT JOIN clans      c  ON c.id = v.clan_id
           GROUP BY v.player_id
           ORDER BY bite_count DESC
           LIMIT ?`,
          [limit]
        );
        break;

      case 'amrita':
        rows = await query(
          `SELECT v.avatar_name,
                  b.name  AS bloodline_name,
                  c.name  AS clan_name,
                  va.balance AS amrita_balance
           FROM   vampire_amrita va
           JOIN   vampires    v  ON v.player_id  = va.player_id
           LEFT JOIN Bloodlines b ON b.id = v.bloodline_id
           LEFT JOIN clans      c ON c.id = v.clan_id
           ORDER BY va.balance DESC
           LIMIT ?`,
          [limit]
        );
        break;

      case 'blood':
        rows = await query(
          `SELECT v.avatar_name,
                  b.name  AS bloodline_name,
                  c.name  AS clan_name,
                  vb.current_blood_ml AS blood_ml
           FROM   vampire_blood vb
           JOIN   vampires    v  ON v.player_id  = vb.player_id
           LEFT JOIN Bloodlines b ON b.id = v.bloodline_id
           LEFT JOIN clans      c ON c.id = v.clan_id
           ORDER BY vb.current_blood_ml DESC
           LIMIT ?`,
          [limit]
        );
        break;

      default:
        return Response.json({ error: 'Invalid leaderboard type' }, { status: 400 });
    }

    return Response.json({ type, rows });
  } catch (err) {
    console.error('[leaderboard]', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
