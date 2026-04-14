import { query, queryOne } from '../../../../lib/mysql';

/**
 * GET /api/mysql/lineage?name=AvatarName&depth=5
 *
 * Returns:
 *  - ancestors[] going up to the Arch Vampire
 *  - childer[] immediate children
 *  - grandchilder[] (optional, depth >= 2)
 *
 * We walk the sire_id chain upward for ancestors and fan out
 * one/two levels for descendants.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name  = searchParams.get('name');
  const depth = Math.min(parseInt(searchParams.get('depth') || '2'), 4);

  if (!name) {
    return Response.json({ error: 'Missing name parameter' }, { status: 400 });
  }

  try {
    const root = await queryOne(
      `SELECT v.player_id, v.avatar_name, v.sire_id, v.arch_id,
              v.generation, v.embrace_at, v.is_arch,
              b.name AS bloodline_name
       FROM   vampires v
       LEFT JOIN Bloodlines b ON b.id = v.bloodline_id
       WHERE  v.avatar_name = ?`,
      [name]
    );

    if (!root) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    // ── Ancestors (walk sire_id chain upward) ──────────────────────────────
    const ancestors = [];
    let current = root;
    for (let i = 0; i < 20; i++) { // safety cap
      if (!current.sire_id) break;
      const sire = await queryOne(
        `SELECT v.player_id, v.avatar_name, v.sire_id, v.generation,
                v.embrace_at, v.is_arch, b.name AS bloodline_name
         FROM   vampires v
         LEFT JOIN Bloodlines b ON b.id = v.bloodline_id
         WHERE  v.player_id = ?`,
        [current.sire_id]
      );
      if (!sire) break;
      ancestors.push(sire);
      current = sire;
      if (sire.is_arch) break; // stop at Arch Vampire
    }

    // ── Descendants (fan-out BFS to `depth` levels) ────────────────────────
    async function getChildren(pid, remainingDepth) {
      if (remainingDepth <= 0) return [];
      const kids = await query(
        `SELECT v.player_id, v.avatar_name, v.generation,
                v.embrace_at, v.is_arch, b.name AS bloodline_name,
                (SELECT COUNT(*) FROM vampires WHERE sire_id = v.player_id) AS childer_count
         FROM   vampires v
         LEFT JOIN Bloodlines b ON b.id = v.bloodline_id
         WHERE  v.sire_id = ?
         ORDER BY v.embrace_at ASC`,
        [pid]
      );
      if (remainingDepth > 1) {
        for (const kid of kids) {
          kid.children = await getChildren(kid.player_id, remainingDepth - 1);
        }
      }
      return kids;
    }

    const descendants = await getChildren(root.player_id, depth);

    return Response.json({
      root,
      ancestors,   // oldest first
      descendants, // nested tree
    });
  } catch (err) {
    console.error('[lineage]', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
