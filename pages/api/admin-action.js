import { getPlayerFromRequest } from '../../lib/auth';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

async function sendEmail(to, subject, html) {
  if (!RESEND_KEY || !to) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'DawnDream <noreply@dawndreamsl.com>', to, subject, html }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await getPlayerFromRequest(req);
  if (!admin || admin.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

  const { playerId, action } = req.body;
  if (!playerId || !['approve', 'reject', 'ban'].includes(action)) return res.status(400).json({ error: 'Invalid request' });

  const statusMap = { approve: 'approved', reject: 'rejected', ban: 'banned' };
  const status = statusMap[action];

  await fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${playerId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status, approved_by: admin.avatar_name, approved_at: new Date().toISOString() }),
  });

  const playerRes = await fetch(
    `${SUPABASE_URL}/rest/v1/players?id=eq.${playerId}&select=avatar_name,email`,
    { headers }
  );
  const players = await playerRes.json();
  if (players.length && players[0].email) {
    const player = players[0];
    if (action === 'approve') {
      await sendEmail(player.email, 'DawnDream — Account Approved!',
        `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0408;color:#e0cdb8;padding:32px;border-radius:8px;">
          <h2 style="color:#c0392b;font-family:serif;">Welcome to DawnDream</h2>
          <p>Hello <strong>${player.avatar_name}</strong>,</p>
          <p>Your account has been approved! You can now log in and access the DawnDream member area.</p>
          <a href="https://dawndreamsl.com/login" style="display:inline-block;background:#2a0a14;color:#e8a090;padding:10px 20px;border-radius:4px;text-decoration:none;margin-top:16px;">Login Now →</a>
          <p style="color:#7a5a50;font-style:italic;margin-top:24px;">The eternal night awaits.</p>
        </div>`
      );
    } else if (action === 'reject') {
      await sendEmail(player.email, 'DawnDream — Registration Update',
        `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0408;color:#e0cdb8;padding:32px;border-radius:8px;">
          <h2 style="color:#c0392b;font-family:serif;">Registration Update</h2>
          <p>Hello <strong>${player.avatar_name}</strong>,</p>
          <p>Unfortunately your registration was not approved at this time. Please contact a DawnDream admin for more information.</p>
        </div>`
      );
    }
  }

  res.status(200).json({ success: true });
}
