import { createClient } from '@supabase/supabase-js';
import { getPlayerFromRequest } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getPlayerFromRequest(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: callers } = await supabase.from('players').select('role').eq('id', session.id);
  const callerRole = callers?.[0]?.role;

  const { playerId, role } = req.body;

  // Owner can assign admin, reporter, player
  // Admin can only assign reporter or player — NOT admin or owner
  const ownerAllowed  = ['player', 'reporter', 'admin'];
  const adminAllowed  = ['player', 'reporter'];

  if (callerRole === 'owner') {
    if (!playerId || !ownerAllowed.includes(role)) {
      return res.status(400).json({ error: 'Invalid request' });
    }
  } else if (callerRole === 'admin') {
    if (!playerId || !adminAllowed.includes(role)) {
      return res.status(403).json({ error: 'Only the owner can assign admin roles' });
    }
  } else {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { data, error } = await supabase
    .from('players')
    .update({ role })
    .eq('id', playerId)
    .select('id, avatar_name, role');

  if (error) {
    console.error('set-role error:', error);
    return res.status(500).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Player not found' });
  }

  res.status(200).json({ success: true, player: data[0] });
}
