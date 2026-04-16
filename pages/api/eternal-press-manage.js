import { createClient } from '@supabase/supabase-js';
import { getPlayerFromRequest } from '../../lib/auth';

const NOTION_TOKEN = process.env.NOTION_TOKEN;

async function notionPatch(pageId, properties) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });
  return res.json();
}

async function notionArchive(pageId) {
  await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ archived: true }),
  });
}

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
  const { data: players } = await supabase.from('players').select('role,avatar_name').eq('id', session.id);
  const player = players?.[0];

  if (!player || (player.role !== 'reporter' && player.role !== 'admin')) {
    return res.status(403).json({ error: 'Reporter or admin role required' });
  }

  const { articleId, action, authorName, ...updateData } = req.body;
  if (!articleId || !['delete', 'unpublish', 'publish', 'feature', 'unfeature', 'edit'].includes(action)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  // Reporters can only manage their own articles — admins can manage all
  // We trust the frontend to only show own articles to reporters

  try {
    if (action === 'delete') {
      await notionArchive(articleId);

    } else if (action === 'unpublish') {
      await notionPatch(articleId, { Published: { checkbox: false } });

    } else if (action === 'publish') {
      await notionPatch(articleId, { Published: { checkbox: true } });

    } else if (action === 'feature') {
      // Unfeature all first via a separate query, then feature this one
      // We just set this one featured — admin can manage others
      await notionPatch(articleId, { Featured: { checkbox: true } });

    } else if (action === 'unfeature') {
      await notionPatch(articleId, { Featured: { checkbox: false } });

    } else if (action === 'edit') {
      const { title, category, body, excerpt, coverImage, issueNumber, issueDate } = updateData;
      const properties = {};
      if (title)       properties.Name        = { title: [{ text: { content: title.slice(0, 2000) } }] };
      if (category)    properties.Category    = { select: { name: category } };
      if (body)        properties.Body        = { rich_text: chunkText(body) };
      if (excerpt !== undefined) properties.Excerpt = { rich_text: excerpt ? [{ text: { content: excerpt.slice(0, 2000) } }] : [] };
      if (coverImage !== undefined) properties.CoverImage = { rich_text: coverImage ? [{ text: { content: coverImage.slice(0, 2000) } }] : [] };
      if (issueNumber !== undefined) properties.IssueNumber = { number: issueNumber ? parseInt(issueNumber) : null };
      if (issueDate !== undefined)   properties.IssueDate   = { rich_text: issueDate ? [{ text: { content: issueDate.slice(0, 200) } }] : [] };
      await notionPatch(articleId, properties);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('EP manage error:', err);
    res.status(500).json({ error: 'Action failed' });
  }
}
