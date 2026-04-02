const NOTION_TOKEN = process.env.NOTION_TOKEN;
const CHRONICLES_DATABASE_ID = process.env.NOTION_CHRONICLES_DATABASE_ID;

export async function getChronicles() {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${CHRONICLES_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [{ property: 'Order', direction: 'descending' }],
        filter: { property: 'Published', checkbox: { equals: true } },
      }),
    }
  );
  const data = await response.json();
  return data.results.map((page) => {
    const p = page.properties;
    return {
      id: page.id,
      title: getTitle(p.Name),
      author: getText(p.Author),
      category: getText(p.Category),
      preview: getText(p.Preview),
      story: getText(p.Story),
      order: getNumber(p.Order),
      published: getCheckbox(p.Published),
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
function getCheckbox(prop) {
  if (!prop || prop.type !== 'checkbox') return false;
  return prop.checkbox;
}
