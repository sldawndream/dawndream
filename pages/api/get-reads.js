const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/chronicle_reads?select=chronicle_id`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const data = await response.json();
    const counts = {};
    data.forEach(row => {
      counts[row.chronicle_id] = (counts[row.chronicle_id] || 0) + 1;
    });

    res.status(200).json({ counts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
}
