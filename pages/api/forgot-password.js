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
      .ilike('email', email.trim());

    // Player not found or not approved — still return success (don't reveal account existence)
    if (!players || !players.length || players[0].status !== 'approved') {
      return res.status(200).json({ success: true });
    }

    const player = players[0];

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

    const { error: updateError } = await supabase
      .from('players')
      .update({ reset_token: token, reset_expires: expires })
      .eq('id', player.id);

    if (updateError) {
      console.error('Reset token update failed:', updateError);
      return res.status(200).json({ success: true });
    }

    const resetUrl = `https://dawndreamsl.com/reset-password?token=${token}`;
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'DawnDream <noreply@dawndreamsl.com>',
      to: player.email,
      subject: 'DawnDream — Password Reset Request',
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07030a;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07030a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#0d0408;border:1px solid #2a0a14;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a0408 0%,#2a0a14 100%);padding:32px 40px 28px;text-align:center;border-bottom:1px solid #3a1018;">
            <span style="display:inline-block;width:11px;height:11px;background:#c0392b;border-radius:50% 50% 50% 0;transform:rotate(-45deg);margin-right:8px;vertical-align:middle;"></span>
            <span style="font-family:'Georgia',serif;font-size:18px;color:#c0392b;letter-spacing:0.18em;text-transform:uppercase;vertical-align:middle;">DAWNDREAM</span>
            <div style="margin-top:14px;width:60px;height:1px;background:#4a1020;margin-left:auto;margin-right:auto;"></div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 10px;">
            <p style="font-family:'Georgia',serif;font-size:10px;letter-spacing:0.3em;color:#6a3030;text-transform:uppercase;margin:0 0 14px 0;">Account Security</p>
            <h1 style="font-family:'Georgia',serif;font-size:22px;color:#f0d0b8;font-weight:700;letter-spacing:0.04em;margin:0 0 18px 0;line-height:1.4;">Password Reset Request</h1>
            <p style="font-size:15px;color:#b09880;line-height:1.8;margin:0 0 12px 0;">Hello, <strong style="color:#e0cdb8;">${player.avatar_name}</strong>.</p>
            <p style="font-size:15px;color:#b09880;line-height:1.8;margin:0 0 20px 0;">A password reset was requested for your DawnDream account. Click the button below to set a new password. This link expires in <strong style="color:#e0cdb8;">1 hour</strong>.</p>
            <div style="height:1px;background:linear-gradient(90deg,transparent,#3a1018,transparent);margin:24px 0;"></div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${resetUrl}" style="display:inline-block;background:#2a0a14;color:#e8a090;padding:14px 36px;border-radius:5px;text-decoration:none;font-family:'Georgia',serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;border:1px solid #7a2030;">Reset My Password →</a>
                </td>
              </tr>
            </table>
            <div style="height:1px;background:linear-gradient(90deg,transparent,#3a1018,transparent);margin:0 0 24px 0;"></div>
            <p style="font-size:12px;color:#5a3028;line-height:1.8;margin:0 0 8px 0;">If you did not request a password reset, you can safely ignore this email.</p>
            <p style="font-size:11px;color:#3a1a14;line-height:1.8;margin:0;">If the button does not work, copy and paste this link:<br>
            <span style="color:#5a2828;word-break:break-all;">${resetUrl}</span></p>
          </td>
        </tr>
        <tr>
          <td style="background:#0a0306;border-top:1px solid #1e0a10;padding:18px 40px;text-align:center;">
            <p style="font-family:'Georgia',serif;font-size:9px;color:#3a1a14;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 6px 0;">DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG</p>
            <p style="font-size:11px;color:#2a1010;margin:0;"><a href="https://dawndreamsl.com" style="color:#4a2020;text-decoration:none;">dawndreamsl.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    // Only return success AFTER email is sent
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Forgot password error:', err?.message || err);
    return res.status(200).json({ success: true });
  }
}
