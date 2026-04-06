export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { author, imageData } = req.body;
  if (!author || !imageData) return res.status(400).json({ error: 'Missing fields' });

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const timestamp = Math.round(Date.now() / 1000);

    const crypto = await import('crypto');
    const signature = crypto.default
      .createHash('sha1')
      .update(`folder=dawndream-gallery&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const formData = new URLSearchParams();
    formData.append('file', imageData);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', 'dawndream-gallery');

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    const cloudData = await cloudRes.json();

    if (!cloudRes.ok || !cloudData.secure_url) {
      console.error('Cloudinary error:', cloudData);
      return res.status(500).json({ error: 'Image upload failed' });
    }

    const imageUrl = cloudData.secure_url;

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
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

    const notionData = await notionRes.json();
    if (!notionRes.ok) {
      console.error('Notion error:', notionData);
      return res.status(500).json({ error: 'Notion submission failed' });
    }

    res.status(200).json({ success: true, imageUrl });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Submission failed' });
  }
}
