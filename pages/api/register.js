import crypto from 'crypto';
import { Resend } from 'resend';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { avatarName, password, email } = req.body;
  if (!avatarName || !password || !email) return res.status(400).json({ error: 'All fields are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!email.includes('@')) return res.status(400).json({ error: 'Invalid email address' });

  try {
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/players?avatar_name=eq.${encodeURIComponent(avatarName)}&select=id`,
      { headers }
    );
    const existing = await checkRes.json();
    if (existing.length > 0) return res.status(400).json({ error: 'Avatar name already registered' });

    const emailCheckRes = await fetch(
      `${SUPABASE_URL}/rest/v1/players?email=eq.${encodeURIComponent(email)}&select=id`,
      { headers }
    );
    const existingEmail = await emailCheckRes.json();
    if (existingEmail.length > 0) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = hashPassword(password);
    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ avatar_name: avatarName, password_hash: passwordHash, email, status: 'pending', role: 'player' }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      console.error('Create player error:', err);
      return res.status(500).json({ error: 'Registration failed' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'DawnDream <noreply@dawndreamsl.com>',
      to: process.env.ADMIN_EMAIL,
      subject: 'New DawnDream Registration — Pending Approval',
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0408;color:#e0cdb8;padding:32px;border-radius:8px;">
        <h2 style="color:#c0392b;font-family:serif;">New Registration</h2>
        <p><strong>Avatar Name:</strong> ${avatarName}</p>
        <p><strong>Email:</strong> ${email}</p>
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
