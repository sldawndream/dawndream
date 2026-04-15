import { createClient } from '@supabase/supabase-js';
import { getPlayerFromRequest } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await getPlayerFromRequest(req);
  if (!admin) return res.status(401).json({ error: 'Not logged in' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data: admins } = await supabase.from('players').select('role,avatar_name').eq('id', admin.id);
  if (!admins?.[0] || admins[0].role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const { articleId, action } = req.body;
  if (!articleId || !['publish', 'reject', 'delete', 'feature', 'unfeature'].includes(action)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  if (action === 'delete') {
    await supabase.from('eternal-press_articles').delete().eq('id', articleId);
    return res.status(200).json({ success: true });
  }

  if (action === 'feature') {
    // Unfeature all others first, then feature this one
    await supabase.from('eternal-press_articles').update({ featured: false }).eq('featured', true);
    await supabase.from('eternal-press_articles').update({ featured: true }).eq('id', articleId);
    return res.status(200).json({ success: true });
  }

  if (action === 'unfeature') {
    await supabase.from('eternal-press_articles').update({ featured: false }).eq('id', articleId);
    return res.status(200).json({ success: true });
  }

  const updates = {
    publish: { status: 'published', published_at: new Date().toISOString(), approved_by: admins[0].avatar_name },
    reject: { status: 'rejected', approved_by: admins[0].avatar_name },
  };

  await supabase.from('eternal-press_articles').update(updates[action]).eq('id', articleId);
  res.status(200).json({ success: true });
}
