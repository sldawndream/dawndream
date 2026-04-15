import { createClient } from '@supabase/supabase-js';
import { getPlayerFromRequest } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getPlayerFromRequest(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data: players } = await supabase.from('players').select('role').eq('id', session.id);
  if (!players?.[0] || players[0].role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { status } = req.query;
  const validStatuses = ['pending', 'published', 'rejected'];
  const safeStatus = validStatuses.includes(status) ? status : 'pending';

  const { data: articles } = await supabase
    .from('eternal_press_articles')
    .select('id,title,category,excerpt,author_name,status,featured,created_at,published_at,issue_number')
    .eq('status', safeStatus)
    .order('created_at', { ascending: false });

  res.status(200).json({ articles: articles || [] });
}
