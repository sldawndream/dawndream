import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT).digest('hex');
}

function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { avatarName, password, email, slUuid } = req.body;
  if (!avatarName || !password || !email || !slUuid) return res.status(400).json({ error: 'All fields are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!email.includes('@')) return res.status(400).json({ error: 'Invalid email address' });
  if (!isValidUUID(slUuid)) return res.status(400).json({ error: 'Invalid Second Life UUID — check your SL profile and try again' });

  // Capture registration IP — works behind Vercel's proxy
  const registeredIp =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    null;

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    const { data: existing } = await supabase.from('players').select('id').eq('avatar_name', avatarName);
    if (existing && existing.length > 0) return res.status(400).json({ error: 'Avatar name already registered' });

    const { data: existingEmail } = await supabase.from('players').select('id').eq('email', email);
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
        <p>Your registration has been received and is pending approval by our admin team.</p>
        <p>You will receive another email once your account has been approved.</p>
        <p style="color:#7a5a50;font-style:italic;margin-top:24px;">The eternal night awaits.</p>
      </div>`,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}
