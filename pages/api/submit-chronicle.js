export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, author, category, story } = req.body;
  if (!title || !author || !story) return res.status(400).json({ error: 'Missing fields' });

  const preview = story.length > 300 ? story.substring(0, 300) + '...' : story;

  function chunkText(text, size = 1900) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
      chunks.push({ text: { content: text.slice(i, i + size) } });
      i += size;
    }
    return chunks;
  }

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_CHRONICLES_DATABASE_ID },
        properties: {
          Name: { title: [{ text: { content: title.slice(0, 2000) } }] },
          Author: { rich_text: [{ text: { content: author.slice(0, 2000) } }] },
          Category: { select: { name: category || 'Other' } },
          Preview: { rich_text: [{ text: { content: preview.slice(0, 2000) } }] },
          Story: { rich_text: chunkText(story) },
          Published: { checkbox: false },
          Order: { number: Date.now() },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Notion error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Notion submission failed', details: data });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Submission failed' });
  }
}
