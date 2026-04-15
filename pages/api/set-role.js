import { createClient } from '@supabase/supabase-js';
import { getPlayerFromRequest } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await getPlayerFromRequest(req);
  if (!admin) return res.status(401).json({ error: 'Not logged in' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data: admins } = await supabase.from('players').select('role').eq('id', admin.id);
  if (!admins?.[0] || admins[0].role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const { playerId, role } = req.body;
  if (!playerId || !['player', 'reporter', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  await supabase.from('players').update({ role }).eq('id', playerId);
  res.status(200).json({ success: true });
}
