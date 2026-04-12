import { serialize } from 'cookie';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  const token = req.cookies?.dd_session;
  if (token) {
    await fetch(`${SUPABASE_URL}/rest/v1/player_sessions?token=eq.${token}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
  }
  res.setHeader('Set-Cookie', serialize('dd_session', '', { maxAge: 0, path: '/' }));
  res.status(200).json({ success: true });
}
