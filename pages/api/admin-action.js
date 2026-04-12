import { getPlayerFromRequest } from '../../lib/auth';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await getPlayerFromRequest(req);
  if (!admin || admin.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

  const { playerId, action } = req.body;
  if (!playerId || !['approve', 'reject', 'ban'].includes(action)) return res.status(400).json({ error: 'Invalid request' });

  const statusMap = { approve: 'approved', reject: 'rejected', ban: 'banned' };
  const status = statusMap[action];

  await fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${playerId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status, approved_by: admin.avatar_name, approved_at: new Date().toISOString() }),
  });

  res.status(200).json({ success: true });
}
