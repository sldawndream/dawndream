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

  await supabase
    .from('players')
    .update({ status: statusMap[action], approved_by: admin.avatar_name, approved_at: new Date().toISOString() })
    .eq('id', playerId);

  try {
    const { data: players } = await supabase.from('players').select('avatar_name, email').eq('id', playerId);
    if (players && players.length && players[0].email) {
      const player = players[0];
      const resend = new Resend(process.env.RESEND_API_KEY);

      if (action === 'approve') {
        await resend.emails.send({
          from: 'DawnDream <noreply@dawndreamsl.com>',
          to: player.email,
          subject: '🩸 DawnDream — Your soul has been accepted',
          html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#07030a;font-family:'Georgia',serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#07030a;padding:40px 20px;"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#0d0408;border:1px solid #2a0a14;border-radius:10px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1a0408 0%,#2a0a14 100%);padding:32px 40px 28px;text-align:center;border-bottom:1px solid #3a1018;"><span style="display:inline-block;width:11px;height:11px;background:#c0392b;border-radius:50% 50% 50% 0;transform:rotate(-45deg);margin-right:8px;vertical-align:middle;"></span><span style="font-family:'Georgia',serif;font-size:18px;color:#c0392b;letter-spacing:0.18em;text-transform:uppercase;vertical-align:middle;">DAWNDREAM</span><div style="margin-top:14px;width:60px;height:1px;background:#4a1020;margin-left:auto;margin-right:auto;"></div></td></tr><tr><td style="padding:36px 40px 10px;"><p style="font-family:'Georgia',serif;font-size:10px;letter-spacing:0.3em;color:#6a3030;text-transform:uppercase;margin:0 0 14px 0;">The Blood Covenant</p><h1 style="font-family:'Georgia',serif;font-size:24px;color:#f0d0b8;font-weight:700;letter-spacing:0.05em;margin:0 0 18px 0;line-height:1.35;">Your soul has been accepted into the eternal night.</h1><p style="font-size:15px;color:#b09880;line-height:1.8;margin:0 0 12px 0;">Greetings, <strong style="color:#e0cdb8;">${player.avatar_name}</strong>.</p><p style="font-size:15px;color:#b09880;line-height:1.8;margin:0 0 20px 0;">The council has reviewed your petition and found you worthy. You are now a recognised soul within DawnDream — free to walk among the coven, claim your bloodline, and write your history in the eternal dark.</p><div style="height:1px;background:linear-gradient(90deg,transparent,#3a1018,transparent);margin:24px 0;"></div><table width="100%" cellpadding="0" cellspacing="0" style="background:#120608;border:1px solid #2a0a14;border-radius:8px;margin-bottom:28px;"><tr><td style="padding:20px 24px;"><p style="font-family:'Georgia',serif;font-size:10px;letter-spacing:0.25em;color:#5a2828;text-transform:uppercase;margin:0 0 14px 0;">What awaits you</p><table cellpadding="0" cellspacing="0"><tr><td style="padding:5px 0;font-size:14px;color:#9a7860;">🩸&nbsp;&nbsp;</td><td style="padding:5px 0;font-size:14px;color:#9a7860;line-height:1.6;">Explore the <strong style="color:#c0a880;">Lore &amp; Chronicles</strong> of DawnDream's history</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#9a7860;">🦇&nbsp;&nbsp;</td><td style="padding:5px 0;font-size:14px;color:#9a7860;line-height:1.6;">Browse <strong style="color:#c0a880;">The Coven</strong> — find your allies and rivals</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#9a7860;">👑&nbsp;&nbsp;</td><td style="padding:5px 0;font-size:14px;color:#9a7860;line-height:1.6;">Discover <strong style="color:#c0a880;">Clans, Houses &amp; Hordes</strong> to pledge your loyalty</td></tr><tr><td style="padding:5px 0;font-size:14px;color:#9a7860;">📜&nbsp;&nbsp;</td><td style="padding:5px 0;font-size:14px;color:#9a7860;line-height:1.6;">Complete your <strong style="color:#c0a880;">profile</strong> — write your bio and personal lore</td></tr></table></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center"><a href="https://dawndreamsl.com/login" style="display:inline-block;background:#2a0a14;color:#e8a090;padding:14px 36px;border-radius:5px;text-decoration:none;font-family:'Georgia',serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;border:1px solid #7a2030;">Enter DawnDream →</a></td></tr></table><div style="height:1px;background:linear-gradient(90deg,transparent,#3a1018,transparent);margin:0 0 24px 0;"></div><p style="font-size:13px;color:#5a3028;font-style:italic;line-height:1.8;margin:0 0 8px 0;">"From the first darkness, they were born — and the world has never been the same."</p></td></tr><tr><td style="background:#0a0306;border-top:1px solid #1e0a10;padding:18px 40px;text-align:center;"><p style="font-family:'Georgia',serif;font-size:9px;color:#3a1a14;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 6px 0;">DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG</p><p style="font-size:11px;color:#2a1010;margin:0;"><a href="https://dawndreamsl.com" style="color:#4a2020;text-decoration:none;">dawndreamsl.com</a></p></td></tr></table></td></tr></table></body></html>`,
        });

      } else if (action === 'reject') {
        await resend.emails.send({
          from: 'DawnDream <noreply@dawndreamsl.com>',
          to: player.email,
          subject: 'DawnDream — Registration Update',
          html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#07030a;font-family:'Georgia',serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#07030a;padding:40px 20px;"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#0d0408;border:1px solid #2a0a14;border-radius:10px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1a0408 0%,#2a0a14 100%);padding:32px 40px 28px;text-align:center;border-bottom:1px solid #3a1018;"><span style="display:inline-block;width:11px;height:11px;background:#c0392b;border-radius:50% 50% 50% 0;transform:rotate(-45deg);margin-right:8px;vertical-align:middle;"></span><span style="font-family:'Georgia',serif;font-size:18px;color:#c0392b;letter-spacing:0.18em;text-transform:uppercase;vertical-align:middle;">DAWNDREAM</span><div style="margin-top:14px;width:60px;height:1px;background:#4a1020;margin-left:auto;margin-right:auto;"></div></td></tr><tr><td style="padding:36px 40px 10px;"><p style="font-family:'Georgia',serif;font-size:10px;letter-spacing:0.3em;color:#6a3030;text-transform:uppercase;margin:0 0 14px 0;">Registration Update</p><h1 style="font-family:'Georgia',serif;font-size:22px;color:#c0a890;font-weight:700;letter-spacing:0.04em;margin:0 0 18px 0;line-height:1.4;">Your petition was not approved at this time.</h1><p style="font-size:15px;color:#b09880;line-height:1.8;margin:0 0 12px 0;">Hello, <strong style="color:#e0cdb8;">${player.avatar_name}</strong>.</p><p style="font-size:15px;color:#b09880;line-height:1.8;margin:0 0 20px 0;">After review, the council has decided not to approve your registration at this time. This may be due to incomplete information or a conflict with our records.</p><p style="font-size:15px;color:#b09880;line-height:1.8;margin:0 0 28px 0;">If you believe this is in error or would like to try again, you are welcome to re-apply or reach out to an admin in-world.</p><div style="height:1px;background:linear-gradient(90deg,transparent,#3a1018,transparent);margin:0 0 24px 0;"></div><p style="font-size:13px;color:#5a3028;font-style:italic;line-height:1.8;margin:0 0 8px 0;">The night is patient. Perhaps another time.</p></td></tr><tr><td style="background:#0a0306;border-top:1px solid #1e0a10;padding:18px 40px;text-align:center;"><p style="font-family:'Georgia',serif;font-size:9px;color:#3a1a14;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 6px 0;">DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG</p><p style="font-size:11px;color:#2a1010;margin:0;"><a href="https://dawndreamsl.com" style="color:#4a2020;text-decoration:none;">dawndreamsl.com</a></p></td></tr></table></td></tr></table></body></html>`,
        });
      }
    }
  } catch (err) {
    console.error('Email error:', err);
  }

  res.status(200).json({ success: true });
}
