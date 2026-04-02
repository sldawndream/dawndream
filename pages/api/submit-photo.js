export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { author, imageUrl } = req.body;
  if (!author || !imageUrl) return res.status(400).json({ error: 'Missing fields' });

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_GALLERY_DATABASE_ID },
        properties: {
          Name: { title: [{ text: { content: author } }] },
          ImageURL: { url: imageUrl },
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
