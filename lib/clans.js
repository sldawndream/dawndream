const NOTION_TOKEN = process.env.NOTION_TOKEN;
const CLANS_DATABASE_ID = process.env.NOTION_CLANS_DATABASE_ID;
const HOUSES_DATABASE_ID = process.env.NOTION_HOUSES_DATABASE_ID;

export async function getClans() {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${CLANS_DATABASE_ID}/query`,
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
      founded: getText(p.Founded),
      highCommander: getText(p.HighCommander),
      bloodGeneral: getText(p.BloodGeneral),
      warCaptain: getText(p.WarCaptain),
      lore: getText(p.Lore),
      order: getNumber(p.Order),
      bannerImage: getImage(page.cover),
    };
  });
}

export async function getHouses() {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${HOUSES_DATABASE_ID}/query`,
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
      clan: getText(p.Clan),
      highRegent: getText(p.HighRegent),
      grandConsul: getText(p.GrandConsul),
      centurion: getText(p.Centurion),
      order: getNumber(p.Order),
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
