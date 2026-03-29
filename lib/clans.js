const NOTION_TOKEN = process.env.NOTION_TOKEN;
const CLANS_DATABASE_ID = process.env.NOTION_CLANS_DATABASE_ID;

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
    const props = page.properties;
    return {
      id: page.id,
      name: getTitle(props.Name),
      motto: getText(props.Motto),
      status: getText(props.Status),
      statusStyle: getText(props.StatusStyle) || 'ancient',
      founder: getText(props.Founder),
      generation: getText(props.Generation),
      leader: getText(props.Leader),
      clanStatus: getText(props.ClanStatus),
      history: getText(props.History),
      allies: getText(props.Allies),
      enemies: getText(props.Enemies),
      major: getCheckbox(props.Major),
      order: getNumber(props.Order),
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

function getCheckbox(prop) {
  if (!prop || prop.type !== 'checkbox') return false;
  return prop.checkbox;
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
