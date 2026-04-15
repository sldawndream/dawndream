import { createClient } from '@supabase/supabase-js';
import { getPlayerFromRequest } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getPlayerFromRequest(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Check reporter or admin role
  const { data: players } = await supabase.from('players').select('role,avatar_name,display_name').eq('id', session.id);
  const player = players?.[0];
  if (!player || (player.role !== 'reporter' && player.role !== 'admin')) {
    return res.status(403).json({ error: 'Reporter or admin role required' });
  }

  const { title, category, body, excerpt, coverImage, issueNumber, issueDate } = req.body;
  if (!title?.trim() || !body?.trim()) return res.status(400).json({ error: 'Title and body are required' });

  const authorName = player.display_name || player.avatar_name;

  const { error } = await supabase.from('eternal-press_articles').insert({
    title: title.trim().slice(0, 200),
    category: category || 'General',
    body: body.trim().slice(0, 20000),
    excerpt: excerpt?.trim().slice(0, 500) || null,
    cover_image: coverImage || null,
    author_id: session.id,
    author_name: authorName,
    status: 'pending',
    issue_number: issueNumber ? parseInt(issueNumber) : null,
    issue_date: issueDate?.trim() || null,
  });

  if (error) {
    console.error('Article submit error:', error);
    return res.status(500).json({ error: 'Submission failed' });
  }

  res.status(200).json({ success: true });
}
