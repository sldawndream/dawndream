import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Missing fields' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    const { data: players } = await supabase.from('players').select('id, reset_expires').eq('reset_token', token);
    if (!players || !players.length) return res.status(400).json({ error: 'Invalid or expired reset link' });
    const player = players[0];
    if (new Date(player.reset_expires) < new Date()) return res.status(400).json({ error: 'Reset link has expired' });

    await supabase.from('players').update({ password_hash: hashPassword(password), reset_token: null, reset_expires: null }).eq('id', player.id);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Reset failed' });
  }
}
