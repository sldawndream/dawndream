import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const RESEND_KEY = process.env.RESEND_API_KEY;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { avatarName, password } = req.body;
  if (!avatarName || !password) return res.status(400).json({ error: 'Missing fields' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/players?avatar_name=eq.${encodeURIComponent(avatarName)}&select=id`,
      { headers }
    );
    const existing = await checkRes.json();
    if (existing.length > 0) return res.status(400).json({ error: 'Avatar name already registered' });

    const passwordHash = hashPassword(password);

    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ avatar_name: avatarName, password_hash: passwordHash, status: 'pending', role: 'player' }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      console.error('Create player error:', err);
      return res.status(500).json({ error: 'Registration failed' });
    }

    if (RESEND_KEY && ADMIN_EMAIL) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'DawnDream <noreply@dawndreamsl.com>',
          to: ADMIN_EMAIL,
          subject: 'New DawnDream Registration — Pending Approval',
          html: `<p>A new player has registered on DawnDream:</p><p><strong>Avatar Name:</strong> ${avatarName}</p><p>Please review and approve or reject at <a href="https://dawndreamsl.com/admin">dawndreamsl.com/admin</a></p>`,
        }),
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}
