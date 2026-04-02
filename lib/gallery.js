const NOTION_TOKEN = process.env.NOTION_TOKEN;
const GALLERY_DATABASE_ID = process.env.NOTION_GALLERY_DATABASE_ID;

export async function getGallery() {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${GALLERY_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [{ property: 'Order', direction: 'ascending' }],
        filter: { property: 'Published', checkbox: { equals: true } },
      }),
    }
  );
  const data = await response.json();
  return data.results.map((page) => {
    const p = page.properties;
    return {
      id: page.id,
      author: getTitle(p.Name),
      order: getNumber(p.Order),
      image: getURL(p.ImageURL) || getImage(page.cover),
    };
  });
}

function getTitle(prop) {
  if (!prop || !prop.title) return '';
  return prop.title.map((t) => t.plain_text).join('');
}
function getNumber(prop) {
  if (!prop || prop.type !== 'number') return 0;
  return prop.number || 0;
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
