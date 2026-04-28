import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { sanitise, sanitiseEmail, sanitiseUUID } from '../../lib/sanitise';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT).digest('hex');
}

function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

function isValidAvatarName(name) {
  // Only allow normal name characters — no HTML, no script, no regex operators
  return /^[a-zA-Z0-9 ._'\-]{2,80}$/.test(name);
}

// Blocked disposable/fake email domains
const BLOCKED_EMAIL_DOMAINS = [
  'devnull.test', 'fake.test', 'nowhere.test', 'fond.test', 'probe.com',
  'void.test', 'probe.test', 'null.test', 'test.test', 'noreply.test',
  'example.test', 'invalid.test', 'localhost.test', 'spam.test', 'bot.test',
  'mailnull.com', 'trashmail.com', 'guerrillamail.com', 'tempmail.com',
  'throwaway.email', 'yopmail.com', 'sharklasers.com', 'spam4.me',
  'dispostable.com', 'mailnesia.com', 'guerrillamail.info', 'grr.la',
];

function isBlockedEmailDomain(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  // Block entire fake TLDs — no real email uses these
  if (domain.endsWith('.test') || domain.endsWith('.invalid') ||
      domain.endsWith('.localhost') || domain.endsWith('.example')) return true;
  return BLOCKED_EMAIL_DOMAINS.some(d => domain === d || domain?.endsWith('.' + d));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const raw = req.body;

  // Sanitise all inputs before doing anything
  const avatarName = sanitise(raw.avatarName);
  const email      = sanitiseEmail(raw.email);
  const slUuid     = sanitiseUUID(raw.slUuid);
  const password   = typeof raw.password === 'string' ? raw.password.slice(0, 200) : '';

  if (!avatarName || !password || !email || !slUuid) return res.status(400).json({ error: 'All fields are required' });
  if (!isValidAvatarName(avatarName)) return res.status(400).json({ error: 'Avatar name contains invalid characters' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!email.includes('@') || email.length < 5) return res.status(400).json({ error: 'Invalid email address' });
  if (isBlockedEmailDomain(email)) return res.status(400).json({ error: 'This email domain is not accepted. Please use a real email address.' });
  if (!isValidUUID(slUuid)) return res.status(400).json({ error: 'Invalid Second Life UUID — check your SL profile and try again' });

  // Capture registration IP
  const registeredIp =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    null;

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    // One account per IP — check if this IP already registered in the last 24 hours
    if (registeredIp) {
      const since = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
      const { data: ipCheck } = await supabase
        .from('players')
        .select('id')
        .eq('registered_ip', registeredIp)
        .gte('created_at', since);
      if (ipCheck && ipCheck.length > 0) {
        return res.status(429).json({ error: 'An account has already been registered from your connection recently. Please try again later.' });
      }
    }

    const { data: existing } = await supabase.from('players').select('id').ilike('avatar_name', avatarName);
    if (existing && existing.length > 0) return res.status(400).json({ error: 'Avatar name already registered' });

    const { data: existingEmail } = await supabase.from('players').select('id').ilike('email', email);
    if (existingEmail && existingEmail.length > 0) return res.status(400).json({ error: 'Email already registered' });

    const { data: existingUuid } = await supabase.from('players').select('id').eq('sl_uuid', slUuid);
    if (existingUuid && existingUuid.length > 0) return res.status(400).json({ error: 'This Second Life UUID is already registered' });

    const passwordHash = hashPassword(password);
    const { error } = await supabase.from('players').insert({
      avatar_name: avatarName,
      password_hash: passwordHash,
      email,
      sl_uuid: slUuid,
      status: 'pending',
      role: 'player',
      registered_ip: registeredIp,
    });
    if (error) { console.error('Create player error:', error); return res.status(500).json({ error: 'Registration failed' }); }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'DawnDream <noreply@dawndreamsl.com>',
      to: process.env.ADMIN_EMAIL,
      subject: 'New DawnDream Registration — Pending Approval',
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0408;color:#e0cdb8;padding:32px;border-radius:8px;">
        <h2 style="color:#c0392b;font-family:serif;">New Registration</h2>
        <p><strong>Avatar Name:</strong> ${avatarName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>SL UUID:</strong> ${slUuid}</p>
        <p><strong>IP Address:</strong> ${registeredIp || 'Unknown'}</p>
        <a href="https://dawndreamsl.com/admin" style="display:inline-block;background:#2a0a14;color:#e8a090;padding:10px 20px;border-radius:4px;text-decoration:none;margin-top:16px;">Review in Admin Panel</a>
      </div>`,
    });

    await resend.emails.send({
      from: 'DawnDream <noreply@dawndreamsl.com>',
      to: email,
      subject: 'DawnDream — Registration Received',
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0408;color:#e0cdb8;padding:32px;border-radius:8px;">
        <h2 style="color:#c0392b;font-family:serif;">Welcome to DawnDream</h2>
        <p>Hello <strong>${avatarName}</strong>,</p>
        <p>Your registration has been received and is pending approval by our admin team. You will receive another email once your account has been approved.</p>
        <p style="color:#7a5a50;font-style:italic;margin-top:24px;">The eternal night awaits.</p>
      </div>`,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}
