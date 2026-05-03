import { getPlayerFromRequest } from '../../lib/auth';

const NOTION_TOKEN = process.env.NOTION_TOKEN;

async function notionPatch(pageId, properties) {
  await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const player = await getPlayerFromRequest(req);
  if (!player || (player.role !== 'admin' && player.role !== 'owner')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { pageIds, action } = req.body;

  if (!Array.isArray(pageIds) || pageIds.length === 0) {
    return res.status(400).json({ error: 'No items selected' });
  }
  if (!['approve', 'reject', 'unpublish', 'delete'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  if (pageIds.length > 100) {
    return res.status(400).json({ error: 'Too many items — max 100 at once' });
  }

  const results = await Promise.allSettled(
    pageIds.map(async (pageId) => {
      if (action === 'approve') {
        await notionPatch(pageId, { Published: { checkbox: true } });
      } else if (action === 'unpublish') {
        await notionPatch(pageId, { Published: { checkbox: false } });
      } else if (action === 'reject' || action === 'delete') {
        await notionArchive(pageId);
      }
    })
  );

  const failed = results.filter(r => r.status === 'rejected').length;
  const succeeded = results.length - failed;

  return res.status(200).json({ success: true, succeeded, failed });
}
