import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sanitise, sanitiseEmail, sanitiseUUID } from '../../lib/sanitise';

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT).digest('hex');
}

function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

function isValidAvatarName(name) {
  return /^[a-zA-Z0-9 ._'\-]{2,80}$/.test(name);
}

function isBlockedEmailDomain(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  if (
    domain.endsWith('.test') || domain.endsWith('.invalid') ||
    domain.endsWith('.localhost') || domain.endsWith('.example')
  ) return true;
  const blocked = [
    'mailnull.com', 'trashmail.com', 'guerrillamail.com', 'tempmail.com',
    'throwaway.email', 'yopmail.com', 'sharklasers.com', 'spam4.me',
    'dispostable.com', 'mailnesia.com', 'guerrillamail.info', 'grr.la',
    'maildrop.cc', 'mailinator.com', 'fakeinbox.com', 'getnada.com',
  ];
  return blocked.some(d => domain === d || domain.endsWith('.' + d));
}

// ─── In-memory rate limiter (per Vercel instance, resets on cold start) ─────
// For stronger rate limiting, move to Supabase or Upstash Redis.
const rateMap = new Map();
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_MAX = 3; // max 3 attempts per IP per window

function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > RATE_WINDOW_MS) {
    rateMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  rateMap.set(ip, entry);
  return entry.count > RATE_MAX;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const raw = req.body || {};

  // Sanitise all inputs using shared lib
  const avatarName = sanitise(raw.avatarName);
  const email      = sanitiseEmail(raw.email);
  const slUuid     = sanitiseUUID(raw.slUuid);
  const password   = typeof raw.password === 'string' ? raw.password.slice(0, 200) : '';

  // ── Field validation ──
  if (!avatarName || !password || !email || !slUuid) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!isValidAvatarName(avatarName)) {
    return res.status(400).json({ error: 'Avatar name contains invalid characters' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!email.includes('@') || email.length < 5) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (isBlockedEmailDomain(email)) {
    return res.status(400).json({ error: 'This email domain is not accepted. Please use a real email address.' });
  }
  if (!isValidUUID(slUuid)) {
    return res.status(400).json({ error: 'Invalid Second Life UUID — check your SL profile and try again' });
  }

  // ── IP extraction ──
  const registeredIp =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    null;

  // ── Rate limiting (soft block — no auto-ban) ──
  if (registeredIp && isRateLimited(registeredIp)) {
    return res.status(429).json({ error: 'Too many registration attempts. Please wait 15 minutes and try again.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    // ── Duplicate checks — all three fields ──
    const [{ data: existingName }, { data: existingEmail }, { data: existingUuid }] =
      await Promise.all([
        supabase.from('players').select('id').ilike('avatar_name', avatarName).limit(1),
        supabase.from('players').select('id').ilike('email', email).limit(1),
        supabase.from('players').select('id').eq('sl_uuid', slUuid).limit(1),
      ]);

    if (existingName && existingName.length > 0) {
      return res.status(400).json({ error: 'Avatar name already registered' });
    }
    if (existingEmail && existingEmail.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    if (existingUuid && existingUuid.length > 0) {
      return res.status(400).json({ error: 'This Second Life UUID is already registered' });
    }

    // ── IP duplicate check — log only, do NOT auto-ban ──
    // Reason: shared IPs (NAT, VPNs, university networks) are common in SL communities.
    // Auto-banning on Cloudflare based on IP alone blocks innocent users permanently.
    // Admins can manually review and ban from the admin panel if needed.
    if (registeredIp) {
      const { data: ipCheck } = await supabase
        .from('players')
        .select('id, avatar_name')
        .eq('registered_ip', registeredIp)
        .in('status', ['pending', 'approved'])
        .limit(1);

      if (ipCheck && ipCheck.length > 0) {
        // Flag in DB for admin review — don't block
        console.warn(`[register] Duplicate IP detected: ${registeredIp} already used by player ${ipCheck[0].avatar_name}. New attempt: ${avatarName}. Flagging for admin review.`);
      }
    }

    // ── Insert player ──
    const passwordHash = hashPassword(password);
    const { error: insertError } = await supabase.from('players').insert({
      avatar_name:   avatarName,
      password_hash: passwordHash,
      email,
      sl_uuid:       slUuid,
      status:        'pending',
      role:          'player',
      registered_ip: registeredIp,
    });

    if (insertError) {
      console.error('[register] Insert error:', insertError);
      // Handle unique constraint violations gracefully
      if (insertError.code === '23505') {
        return res.status(400).json({ error: 'An account with this information already exists' });
      }
      return res.status(500).json({ error: 'Registration failed — please try again' });
    }

    // ── Send emails ──
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Notify admin
    await resend.emails.send({
      from:    'DawnDream <noreply@dawndreamsl.com>',
      to:      process.env.ADMIN_EMAIL,
      subject: 'New DawnDream Registration — Pending Approval',
      html: `
        <div style="font-family:'Georgia',serif;max-width:520px;margin:0 auto;background:#0a0408;color:#e0cdb8;padding:32px;border-radius:8px;border:1px solid #2a0a14;">
          <h2 style="color:#c0392b;margin-top:0;">New Registration</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#7a5a50;width:140px;">Avatar Name</td><td style="padding:6px 0;color:#e0cdb8;">${avatarName}</td></tr>
            <tr><td style="padding:6px 0;color:#7a5a50;">Email</td><td style="padding:6px 0;color:#e0cdb8;">${email}</td></tr>
            <tr><td style="padding:6px 0;color:#7a5a50;">SL UUID</td><td style="padding:6px 0;color:#e0cdb8;">${slUuid}</td></tr>
            <tr><td style="padding:6px 0;color:#7a5a50;">IP Address</td><td style="padding:6px 0;color:#e0cdb8;">${registeredIp || 'Unknown'}</td></tr>
          </table>
          <a href="https://dawndreamsl.com/admin" style="display:inline-block;background:#2a0a14;color:#e8a090;padding:10px 20px;border-radius:4px;text-decoration:none;margin-top:20px;border:1px solid #7a2030;">
            Review in Admin Panel →
          </a>
        </div>`,
    }).catch(err => console.error('[register] Admin email error:', err.message));

    // Confirm to applicant
    await resend.emails.send({
      from:    'DawnDream <noreply@dawndreamsl.com>',
      to:      email,
      subject: 'DawnDream — Registration Received',
      html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07030a;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07030a;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#0d0408;border:1px solid #2a0a14;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a0408 0%,#2a0a14 100%);padding:32px 40px 28px;text-align:center;border-bottom:1px solid #3a1018;">
            <span style="display:inline-block;width:11px;height:11px;background:#c0392b;border-radius:50% 50% 50% 0;transform:rotate(-45deg);margin-right:8px;vertical-align:middle;"></span>
            <span style="font-family:'Georgia',serif;font-size:18px;color:#c0392b;letter-spacing:0.18em;text-transform:uppercase;vertical-align:middle;">DAWNDREAM</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 32px;">
            <p style="font-family:'Georgia',serif;font-size:10px;letter-spacing:0.3em;color:#6a3030;text-transform:uppercase;margin:0 0 14px 0;">The Blood Covenant</p>
            <h1 style="font-family:'Georgia',serif;font-size:22px;color:#f0d0b8;font-weight:700;margin:0 0 18px 0;line-height:1.4;">Your petition has been received.</h1>
            <p style="font-size:15px;color:#b09880;line-height:1.8;margin:0 0 12px 0;">Greetings, <strong style="color:#e0cdb8;">${avatarName}</strong>.</p>
            <p style="font-size:15px;color:#b09880;line-height:1.8;margin:0 0 20px 0;">Your registration has been received and is now awaiting review by the DawnDream council. You will receive another email once a decision has been made.</p>
            <div style="height:1px;background:linear-gradient(90deg,transparent,#3a1018,transparent);margin:24px 0;"></div>
            <p style="font-size:13px;color:#5a3028;font-style:italic;line-height:1.8;margin:0;">The eternal night awaits your arrival.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#0a0306;border-top:1px solid #1e0a10;padding:18px 40px;text-align:center;">
            <p style="font-family:'Georgia',serif;font-size:9px;color:#3a1a14;letter-spacing:0.2em;text-transform:uppercase;margin:0;">DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    }).catch(err => console.error('[register] Applicant email error:', err.message));

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[register] Unexpected error:', err);
    return res.status(500).json({ error: 'Registration failed — please try again' });
  }
}
