const NOTION_TOKEN = process.env.NOTION_TOKEN;
const EVENTS_DATABASE_ID = process.env.NOTION_EVENTS_DATABASE_ID;

export async function getEvents() {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${EVENTS_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [{ property: 'Date', direction: 'ascending' }],
      }),
    }
  );
  const data = await response.json();
  return data.results.map((page) => {
    const p = page.properties;
    return {
      id: page.id,
      name: getTitle(p.Name),
      date: getDate(p.Date),
      time: getText(p.Time),
      description: getText(p.Description),
      location: getText(p.Location),
      eventType: getText(p.EventType),
      bannerImage: getURL(p.BannerURL) || getImage(page.cover),
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
function getDate(prop) {
  if (!prop || prop.type !== 'date' || !prop.date) return null;
  return prop.date.start;
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
