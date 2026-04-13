import { createClient } from '@supabase/supabase-js';
import { getPlayerFromRequest } from '../../lib/auth';

const NOTION_TOKEN = process.env.NOTION_TOKEN;

async function notionQuery(databaseId, filter) {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter,
      sorts: [{ property: 'Order', direction: 'descending' }],
    }),
  });
  return res.json();
}

async function notionPatch(pageId, published) {
  await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { Published: { checkbox: published } },
    }),
  });
}

function getText(prop) {
  if (!prop) return '';
  if (prop.type === 'rich_text') return prop.rich_text.map(t => t.plain_text).join('');
  if (prop.type === 'select') return prop.select?.name || '';
  return '';
}
function getTitle(prop) {
  if (!prop || !prop.title) return '';
  return prop.title.map(t => t.plain_text).join('');
}
function getURL(prop) {
  if (!prop || prop.type !== 'url') return null;
  return prop.url || null;
}
function getImage(cover) {
  if (!cover) return null;
  if (cover.type === 'external') return cover.external.url;
  if (cover.type === 'file') return cover.file.url;
  return null;
}

export default async function handler(req, res) {
  const player = await getPlayerFromRequest(req);
  if (!player || player.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { type } = req.query;

    if (type === 'chronicles') {
      const data = await notionQuery(process.env.NOTION_CHRONICLES_DATABASE_ID, {
        property: 'Published', checkbox: { equals: false }
      });
      const items = data.results.map(p => ({
        id: p.id,
        title: getTitle(p.properties.Name),
        author: getText(p.properties.Author),
        category: getText(p.properties.Category),
        preview: getText(p.properties.Preview),
        story: getText(p.properties.Story),
      }));
      return res.status(200).json({ items });
    }

    if (type === 'gallery') {
      const data = await notionQuery(process.env.NOTION_GALLERY_DATABASE_ID, {
        property: 'Published', checkbox: { equals: false }
      });
      const items = data.results.map(p => ({
        id: p.id,
        author: getTitle(p.properties.Name),
        imageUrl: getURL(p.properties.ImageURL) || getImage(p.cover),
      }));
      return res.status(200).json({ items });
    }

    return res.status(400).json({ error: 'Invalid type' });
  }

  if (req.method === 'POST') {
    const { pageId, action } = req.body;
    if (!pageId || !['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid request' });

    if (action === 'approve') {
      await notionPatch(pageId, true);
    } else {
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

    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
