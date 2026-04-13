import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { getPlayerFromRequest } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await getPlayerFromRequest(req);
  if (!admin || admin.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

  const { playerId, action } = req.body;
  if (!playerId || !['approve', 'reject', 'ban'].includes(action)) return res.status(400).json({ error: 'Invalid request' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const statusMap = { approve: 'approved', reject: 'rejected', ban: 'banned' };

  await supabase.from('players').update({ status: statusMap[action], approved_by: admin.avatar_name, approved_at: new Date().toISOString() }).eq('id', playerId);

  try {
    const { data: players } = await supabase.from('players').select('avatar_name, email').eq('id', playerId);
    if (players && players.length && players[0].email) {
      const player = players[0];
      const resend = new Resend(process.env.RESEND_API_KEY);
      if (action === 'approve') {
        await resend.emails.send({
          from: 'DawnDream <noreply@dawndreamsl.com>',
          to: player.email,
          subject: 'DawnDream — Account Approved!',
          html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0408;color:#e0cdb8;padding:32px;border-radius:8px;"><h2 style="color:#c0392b;">Welcome to DawnDream</h2><p>Hello <strong>${player.avatar_name}</strong>,</p><p>Your account has been approved!</p><a href="https://dawndreamsl.com/login" style="display:inline-block;background:#2a0a14;color:#e8a090;padding:10px 20px;border-radius:4px;text-decoration:none;margin-top:16px;">Login Now →</a></div>`,
        });
      } else if (action === 'reject') {
        await resend.emails.send({
          from: 'DawnDream <noreply@dawndreamsl.com>',
          to: player.email,
          subject: 'DawnDream — Registration Update',
          html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0408;color:#e0cdb8;padding:32px;border-radius:8px;"><h2 style="color:#c0392b;">Registration Update</h2><p>Hello <strong>${player.avatar_name}</strong>,</p><p>Unfortunately your registration was not approved at this time.</p></div>`,
        });
      }
    }
  } catch (err) {
    console.error('Email error:', err);
  }

  res.status(200).json({ success: true });
}
