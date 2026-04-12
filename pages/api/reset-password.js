import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Missing fields' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const playerRes = await fetch(
      `${SUPABASE_URL}/rest/v1/players?reset_token=eq.${token}&select=id,reset_expires`,
      { headers }
    );
    const players = await playerRes.json();
    if (!players.length) return res.status(400).json({ error: 'Invalid or expired reset link' });

    const player = players[0];
    if (new Date(player.reset_expires) < new Date()) return res.status(400).json({ error: 'Reset link has expired' });

    const passwordHash = hashPassword(password);
    await fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${player.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ password_hash: passwordHash, reset_token: null, reset_expires: null }),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Reset failed' });
  }
}
