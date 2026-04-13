import { serialize } from 'cookie';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const token = req.cookies?.dd_session;
  if (token) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    await supabase.from('player_sessions').delete().eq('token', token);
  }
  res.setHeader('Set-Cookie', serialize('dd_session', '', { maxAge: 0, path: '/' }));
  res.status(200).json({ success: true });
}
