import { getPlayerFromRequest } from '../../lib/auth';

const NOTION_TOKEN = process.env.NOTION_TOKEN;

// Notion allows ~3 req/sec — process in batches of 3 with 400ms delay between
const BATCH_SIZE  = 3;
const BATCH_DELAY = 400; // ms

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  if (!res.ok) throw new Error(`Notion patch failed for ${pageId}: ${res.status}`);
}

async function notionArchive(pageId) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ archived: true }),
  });
  if (!res.ok) throw new Error(`Notion archive failed for ${pageId}: ${res.status}`);
}

async function processOne(pageId, action) {
  if (action === 'approve') {
    await notionPatch(pageId, { Published: { checkbox: true } });
  } else if (action === 'unpublish') {
    await notionPatch(pageId, { Published: { checkbox: false } });
  } else if (action === 'reject' || action === 'delete') {
    await notionArchive(pageId);
  }
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
  if (pageIds.length > 200) {
    return res.status(400).json({ error: 'Too many items — max 200 at once' });
  }

  let succeeded = 0;
  let failed    = 0;

  // Process in batches to respect Notion rate limit (~3 req/sec)
  for (let i = 0; i < pageIds.length; i += BATCH_SIZE) {
    const batch = pageIds.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(pageId => processOne(pageId, action))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') succeeded++;
      else {
        failed++;
        console.error('[admin-notion-bulk] Item failed:', result.reason?.message);
      }
    }

    // Delay between batches — skip after last one
    if (i + BATCH_SIZE < pageIds.length) {
      await sleep(BATCH_DELAY);
    }
  }

  return res.status(200).json({ success: true, succeeded, failed, total: pageIds.length });
}

// Extend Vercel function timeout to 60s for large batches
export const config = {
  maxDuration: 60,
};
