const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { chronicleId, readerId } = req.body;
  if (!chronicleId || !readerId) return res.status(400).json({ error: 'Missing fields' });

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/chronicle_reads`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates',
      },
      body: JSON.stringify({ chronicle_id: chronicleId, reader_id: readerId }),
    });

    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/chronicle_reads?chronicle_id=eq.${chronicleId}&select=id`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'count=exact',
        },
      }
    );

    const count = parseInt(countRes.headers.get('content-range')?.split('/')[1] || '0');
    res.status(200).json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
}
