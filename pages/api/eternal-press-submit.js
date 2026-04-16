import { createClient } from '@supabase/supabase-js';
import { getPlayerFromRequest } from '../../lib/auth';

function chunkText(text, size = 1900) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push({ text: { content: text.slice(i, i + size) } });
    i += size;
  }
  return chunks;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getPlayerFromRequest(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: players } = await supabase
    .from('players')
    .select('role,avatar_name,display_name')
    .eq('id', session.id);

  const player = players?.[0];
  if (!player || (player.role !== 'reporter' && player.role !== 'admin')) {
    return res.status(403).json({ error: 'Reporter or admin role required' });
  }

  const { title, category, body, excerpt, coverImage, issueNumber, issueDate } = req.body;
  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  const authorName = player.display_name || player.avatar_name;
  const autoExcerpt = excerpt?.trim() || (body.length > 300 ? body.substring(0, 300) + '...' : body);

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_ETERNAL_PRESS_DATABASE_ID },
        properties: {
          Name:        { title: [{ text: { content: title.trim().slice(0, 2000) } }] },
          Author:      { rich_text: [{ text: { content: authorName.slice(0, 2000) } }] },
          Category:    { select: { name: category || 'General' } },
          Excerpt:     { rich_text: [{ text: { content: autoExcerpt.slice(0, 2000) } }] },
          Body:        { rich_text: chunkText(body.trim()) },
          CoverImage:  { rich_text: coverImage ? [{ text: { content: coverImage.slice(0, 2000) } }] : [] },
          IssueNumber: { number: issueNumber ? parseInt(issueNumber) : null },
          IssueDate:   { rich_text: issueDate ? [{ text: { content: issueDate.slice(0, 200) } }] : [] },
          Featured:    { checkbox: false },
          Published:   { checkbox: true },
          Order:       { number: Date.now() },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Notion error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Publication failed' });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Submission failed' });
  }
}
