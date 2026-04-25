import crypto from 'crypto';
import { serialize } from 'cookie';
import { createClient } from '@supabase/supabase-js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: 'Missing fields' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    const passwordHash = hashPassword(password);
    const normalised = identifier.trim().toLowerCase();

    // Try matching by avatar name OR email — both case-insensitive
    const { data: players } = await supabase
      .from('players')
      .select('id, avatar_name, status, role')
      .or(`avatar_name.ilike.${normalised},email.ilike.${normalised}`)
      .eq('password_hash', passwordHash);

    if (!players || !players.length) return res.status(401).json({ error: 'Invalid username, email or password' });

    const player = players[0];
    if (player.status === 'pending')  return res.status(403).json({ error: 'Your account is pending approval.' });
    if (player.status === 'rejected') return res.status(403).json({ error: 'Your registration was not approved.' });
    if (player.status === 'banned')   return res.status(403).json({ error: 'Your account has been banned.' });

    const token = crypto.randomBytes(32).toString('hex');
    await supabase.from('player_sessions').insert({ player_id: player.id, token });

    // Update last login IP
    const loginIp =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      null;
    if (loginIp) {
      await supabase.from('players').update({ last_login_ip: loginIp, last_login_at: new Date().toISOString() }).eq('id', player.id);
    }

    res.setHeader('Set-Cookie', serialize('dd_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    }));

    res.status(200).json({ success: true, player: { id: player.id, avatarName: player.avatar_name, role: player.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}
