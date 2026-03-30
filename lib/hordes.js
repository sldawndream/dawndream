const NOTION_TOKEN = process.env.NOTION_TOKEN;
const HORDES_DATABASE_ID = process.env.NOTION_HORDES_DATABASE_ID;

export async function getHordes() {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${HORDES_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [{ property: 'Order', direction: 'ascending' }],
      }),
    }
  );
  const data = await response.json();
  return data.results.map((page) => {
    const p = page.properties;
    return {
      id: page.id,
      name: getTitle(p.Name),
      warLord: getText(p.WarLord),
      firebrand: getText(p.Firebrand),
      ravager: getText(p.Ravager),
      lore: getText(p.Lore),
      order: getNumber(p.Order),
      bannerImage: getImage(page.cover),
    };
  });
}

function getTitle(prop) {
  if (!prop || !prop.title) return '';
  return prop.title.map((t) => t.plain_text).join('');
}
function getText(prop) {
  if (!prop) return '';
  if (prop.type === 'rich_text') return prop.rich_text.map((t) => t.plain_text).join('');
  if (prop.type === 'select') return prop.select?.name || '';
  return '';
}
function getNumber(prop) {
  if (!prop || prop.type !== 'number') return 0;
  return prop.number || 0;
}
function getImage(cover) {
  if (!cover) return null;
  if (cover.type === 'external') return cover.external.url;
  if (cover.type === 'file') return cover.file.url;
  return null;
}
