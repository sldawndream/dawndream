import { createClient } from '@supabase/supabase-js';
import { getPlayerFromRequest } from '../../lib/auth';

const NOTION_TOKEN = process.env.NOTION_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getPlayerFromRequest(req);
  if (!session) return res.status(401).json({ error: 'Not logged in' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: players } = await supabase.from('players').select('role,avatar_name,display_name').eq('id', session.id);
  const player = players?.[0];

  if (!player || (player.role !== 'reporter' && player.role !== 'admin')) {
    return res.status(403).json({ error: 'Reporter or admin role required' });
  }

  const authorName = player.display_name || player.avatar_name;
  const isAdmin = player.role === 'admin';
  const { scope } = req.query; // 'mine' or 'all'

  try {
    // Query Notion for all articles
    const notionRes = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_ETERNAL_PRESS_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sorts: [{ property: 'Order', direction: 'descending' }],
        }),
      }
    );

    const data = await notionRes.json();
    if (!data.results) return res.status(200).json({ articles: [] });

    let articles = data.results.map(page => {
      const p = page.properties;
      const getText = prop => {
        if (!prop) return '';
        if (prop.type === 'rich_text') return prop.rich_text.map(t => t.plain_text).join('');
        if (prop.type === 'select') return prop.select?.name || '';
        return '';
      };
      const getTitle = prop => prop?.title?.map(t => t.plain_text).join('') || '';
      const getCheckbox = prop => prop?.checkbox || false;
      const getNumber = prop => prop?.number || null;

      return {
        id: page.id,
        title: getTitle(p.Name),
        author: getText(p.Author),
        category: getText(p.Category),
        excerpt: getText(p.Excerpt),
        body: getText(p.Body),
        coverImage: getText(p.CoverImage),
        issueNumber: getNumber(p.IssueNumber),
        issueDate: getText(p.IssueDate),
        featured: getCheckbox(p.Featured),
        published: getCheckbox(p.Published),
      };
    });

    // Admins see all articles on both tabs, reporters only see their own
    if (!isAdmin) {
      articles = articles.filter(a => a.author === authorName);
    }

    res.status(200).json({ articles });
  } catch (err) {
    console.error('EP list error:', err);
    res.status(500).json({ error: 'Failed to load articles' });
  }
}
