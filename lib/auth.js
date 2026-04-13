import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

export async function getPlayerByToken(token) {
  if (!token) return null;
  const supabase = getSupabase();
  const { data: sessions } = await supabase.from('player_sessions').select('player_id, expires_at').eq('token', token);
  if (!sessions || !sessions.length) return null;
  const session = sessions[0];
  if (new Date(session.expires_at) < new Date()) return null;
  const { data: players } = await supabase.from('players').select('id, avatar_name, status, role').eq('id', session.player_id);
  if (!players || !players.length) return null;
  return players[0];
}

export async function getPlayerFromRequest(req) {
  const token = req.cookies?.dd_session;
  if (!token) return null;
  return getPlayerByToken(token);
}

export async function getAllPlayers() {
  const supabase = getSupabase();
  const { data } = await supabase.from('players').select('id, avatar_name, status, role, created_at, approved_at').order('created_at', { ascending: false });
  return data || [];
}
