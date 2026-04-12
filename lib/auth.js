const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export async function getPlayerByToken(token) {
  if (!token) return null;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/player_sessions?token=eq.${token}&select=player_id,expires_at`,
    { headers }
  );
  const sessions = await res.json();
  if (!sessions.length) return null;
  const session = sessions[0];
  if (new Date(session.expires_at) < new Date()) return null;

  const playerRes = await fetch(
    `${SUPABASE_URL}/rest/v1/players?id=eq.${session.player_id}&select=id,avatar_name,status,role`,
    { headers }
  );
  const players = await playerRes.json();
  if (!players.length) return null;
  return players[0];
}

export async function getPlayerFromRequest(req) {
  const token = req.cookies?.dd_session;
  if (!token) return null;
  return getPlayerByToken(token);
}

export async function getAllPendingPlayers() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/players?status=eq.pending&select=id,avatar_name,created_at&order=created_at.asc`,
    { headers }
  );
  return res.json();
}

export async function getAllPlayers() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/players?select=id,avatar_name,status,role,created_at,approved_at&order=created_at.desc`,
    { headers }
  );
  return res.json();
}
