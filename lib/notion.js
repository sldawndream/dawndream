const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export async function getLoreEntries() {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
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
      title: getTitle(props.Name),
      era: getText(props.Era),
      eraId: getSlug(getText(props.Era)),
      year: getText(props.Year),
      tag: getText(props.Tag),
      tagStyle: getText(props.TagStyle) || 'origin',
      tag2: getText(props.Tag2),
      tag2Style: getText(props.Tag2Style) || 'origin',
      major: getCheckbox(props.Major),
      body: getText(props.Body),
      quote: getText(props.Quote),
      quoteAuthor: getText(props.QuoteAuthor),
      coverImage: getImage(page.cover),
    };
  });
}

export async function getEras() {
  const entries = await getLoreEntries();
  const seen = new Set();
  const eras = [];
  for (const entry of entries) {
    if (!seen.has(entry.eraId)) {
      seen.add(entry.eraId);
      eras.push({ id: entry.eraId, label: entry.era, year: entry.year });
    }
  }
  return eras;
}

function getTitle(prop) {
  if (!prop || !prop.title) return '';
  return prop.title.map((t) => t.plain_text).join('');
}

function getText(prop) {
  if (!prop) return '';
  if (prop.type === 'rich_text') return prop.rich_text.map((t) => t.plain_text).join('');
  if (prop.type === 'select') return prop.select?.name || '';
  if (prop.type === 'number') return prop.number?.toString() || '';
  return '';
}

function getCheckbox(prop) {
  if (!prop || prop.type !== 'checkbox') return false;
  return prop.checkbox;
}

function getImage(cover) {
  if (!cover) return null;
  if (cover.type === 'external') return cover.external.url;
  if (cover.type === 'file') return cover.file.url;
  return null;
}

function getSlug(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
