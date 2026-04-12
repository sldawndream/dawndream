import crypto from 'crypto';
import { getPlayerFromRequest } from '../../lib/auth';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const player = await getPlayerFromRequest(req);
  if (!player) return res.status(401).json({ error: 'Not logged in' });

  const { displayName, profileImage, newPassword, currentPassword } = req.body;
  const updates = {};

  if (displayName) updates.display_name = displayName.slice(0, 50);
  if (profileImage) updates.profile_image = profileImage;

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
    const currentHash = hashPassword(currentPassword);
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/players?id=eq.${player.id}&password_hash=eq.${currentHash}&select=id`,
      { headers }
    );
    const check = await checkRes.json();
    if (!check.length) return res.status(400).json({ error: 'Current password is incorrect' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    updates.password_hash = hashPassword(newPassword);
  }

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nothing to update' });

  await fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${player.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates),
  });

  res.status(200).json({ success: true });
}
