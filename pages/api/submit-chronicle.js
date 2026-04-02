export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, author, category, story } = req.body;
  if (!title || !author || !story) return res.status(400).json({ error: 'Missing fields' });

  const preview = story.length > 300 ? story.substring(0, 300) + '...' : story;

  try {
    await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_CHRONICLES_DATABASE_ID },
        properties: {
          Name: { title: [{ text: { content: title } }] },
          Author: { rich_text: [{ text: { content: author } }] },
          Category: { select: { name: category || 'Horror' } },
          Preview: { rich_text: [{ text: { content: preview } }] },
          Story: { rich_text: [{ text: { content: story } }] },
          Published: { checkbox: false },
          Order: { number: Date.now() },
        },
      }),
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Submission failed' });
  }
}
