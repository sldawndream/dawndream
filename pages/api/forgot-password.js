import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    const { data: players } = await supabase
      .from('players')
      .select('id, avatar_name, email, status')
      .eq('email', email);

    res.status(200).json({ success: true });
    if (!players || !players.length) return;

    const player = players[0];
    if (player.status !== 'approved') return;

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60).toISOString();

    await supabase
      .from('players')
      .update({ reset_token: token, reset_expires: expires })
      .eq('id', player.id);

    const resetUrl = `https://dawndreamsl.com/reset-password?token=${token}`;
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'DawnDream <noreply@dawndreamsl.com>',
      to: email,
      subject: 'DawnDream — Password Reset',
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0408;color:#e0cdb8;padding:32px;border-radius:8px;">
        <h2 style="color:#c0392b;font-family:serif;">Password Reset</h2>
        <p>Hello <strong>${player.avatar_name}</strong>,</p>
        <p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#2a0a14;color:#e8a090;padding:10px 20px;border-radius:4px;text-decoration:none;margin-top:16px;">Reset My Password</a>
        <p style="color:#7a5a50;font-size:12px;margin-top:24px;">If you did not request this, ignore this email.</p>
      </div>`,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
  }
}
