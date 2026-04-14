import { query, queryOne } from '@/lib/mysql';

/**
 * GET /api/mysql/achievements?name=AvatarName
 *
 * Computes achievements dynamically from MySQL data.
 * No separate achievements table needed — derived from activity logs.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return Response.json({ error: 'Missing name parameter' }, { status: 400 });
  }

  try {
    const vampire = await queryOne(
      'SELECT player_id, embrace_at, age_bonus_days, generation, is_arch FROM vampires WHERE avatar_name = ?',
      [name]
    );

    if (!vampire) {
      return Response.json({ error: 'Player not found' }, { status: 404 });
    }

    const pid     = vampire.player_id;
    const ageDays = (
      (Date.now() - new Date(vampire.embrace_at).getTime()) / 86_400_000
    ) + (vampire.age_bonus_days || 0);

    const [kills, bites, deaths, childerCount, titlesCount] = await Promise.all([
      queryOne('SELECT COUNT(*) AS n FROM death_log  WHERE killer_player_id = ?', [pid]),
      queryOne('SELECT COUNT(*) AS n FROM bite_log   WHERE attacker_player_id = ?', [pid]),
      queryOne('SELECT COUNT(*) AS n FROM death_log  WHERE dead_player_id = ?', [pid]),
      queryOne('SELECT COUNT(*) AS n FROM vampires   WHERE sire_id = ?', [pid]),
      queryOne('SELECT COUNT(*) AS n FROM titles_purchased WHERE player_id = ?', [pid]),
    ]);

    const k  = kills?.n  ?? 0;
    const b  = bites?.n  ?? 0;
    const d  = deaths?.n ?? 0;
    const ch = childerCount?.n ?? 0;
    const t  = titlesCount?.n  ?? 0;

    const achievements = [
      // ── Age ──────────────────────────────────────────────────────────────
      { id: 'newborn',     name: 'Newborn',         desc: 'Survive your first night',        icon: '🌑', earned: ageDays >= 1   },
      { id: 'fledgling',   name: 'Fledgling',        desc: 'Reach 30 days old',               icon: '🦇', earned: ageDays >= 30  },
      { id: 'ancilla',     name: 'Ancilla',          desc: 'Reach 180 days old',              icon: '🩸', earned: ageDays >= 180 },
      { id: 'elder',       name: 'Elder',            desc: 'Reach 365 days old',              icon: '⚰️', earned: ageDays >= 365 },
      { id: 'ancient',     name: 'Ancient',          desc: 'Reach 730 days old',              icon: '👁️', earned: ageDays >= 730 },
      { id: 'methuselah',  name: 'Methuselah',       desc: 'Reach 1825 days old',             icon: '♾️', earned: ageDays >= 1825},
      // ── Combat ───────────────────────────────────────────────────────────
      { id: 'first_blood', name: 'First Blood',      desc: 'Score your first kill',           icon: '⚔️', earned: k >= 1   },
      { id: 'predator',    name: 'Predator',          desc: 'Reach 10 kills',                  icon: '🗡️', earned: k >= 10  },
      { id: 'reaper',      name: 'Reaper',            desc: 'Reach 50 kills',                  icon: '💀', earned: k >= 50  },
      { id: 'warlord',     name: 'Warlord',           desc: 'Reach 100 kills',                 icon: '🔱', earned: k >= 100 },
      // ── Hunting ──────────────────────────────────────────────────────────
      { id: 'hungry',      name: 'Hungry',           desc: 'Bite your first victim',          icon: '🦷', earned: b >= 1   },
      { id: 'hunter',      name: 'Hunter',            desc: 'Bite 25 victims',                 icon: '🩸', earned: b >= 25  },
      { id: 'apex',        name: 'Apex Predator',    desc: 'Bite 100 victims',                icon: '🌹', earned: b >= 100 },
      // ── Lineage ───────────────────────────────────────────────────────────
      { id: 'sire',        name: 'The Sire',         desc: 'Embrace your first childe',       icon: '🧛', earned: ch >= 1  },
      { id: 'patriarch',   name: 'Patriarch',         desc: 'Have 5 or more childer',          icon: '👑', earned: ch >= 5  },
      { id: 'progenitor',  name: 'Progenitor',       desc: 'Have 15 or more childer',         icon: '🌑', earned: ch >= 15 },
      // ── Survival ─────────────────────────────────────────────────────────
      { id: 'undying',     name: 'Undying',          desc: 'Come back from 10 true deaths',  icon: '♻️', earned: d >= 10  },
      // ── Social ───────────────────────────────────────────────────────────
      { id: 'titled',      name: 'Titled',           desc: 'Own your first title',            icon: '📜', earned: t >= 1  },
      { id: 'collector',   name: 'Collector',        desc: 'Own 5 or more titles',            icon: '🏆', earned: t >= 5  },
      // ── Bloodline ─────────────────────────────────────────────────────────
      { id: 'arch',        name: 'Arch Vampire',     desc: 'Ascend to Arch status',           icon: '🌑', earned: !!vampire.is_arch },
    ];

    return Response.json({
      player: name,
      total:  achievements.length,
      earned: achievements.filter(a => a.earned).length,
      achievements,
    });
  } catch (err) {
    console.error('[achievements]', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
