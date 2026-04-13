import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getPlayerFromRequest } from '../../lib/auth';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const player = await getPlayerFromRequest(req);
  if (!player) return res.status(401).json({ error: 'Not logged in' });

  const { displayName, profileImage, newPassword, currentPassword } = req.body;
  const updates = {};
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  if (displayName !== undefined) updates.display_name = displayName.slice(0, 50);
  if (profileImage !== undefined) updates.profile_image = profileImage;

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
    const { data: check } = await supabase.from('players').select('id').eq('id', player.id).eq('password_hash', hashPassword(currentPassword));
    if (!check || !check.length) return res.status(400).json({ error: 'Current password is incorrect' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    updates.password_hash = hashPassword(newPassword);
  }

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nothing to update' });

  await supabase.from('players').update(updates).eq('id', player.id);
  res.status(200).json({ success: true });
}
