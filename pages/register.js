import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import styles from '../styles/Login.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    avatarName: '',
    email: '',
    slUuid: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarName:   form.avatarName.trim(),
          email:        form.email.trim(),
          slUuid:       form.slUuid.trim(),
          password:     form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed — please try again');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Something went wrong — please try again');
    }
    setLoading(false);
  }

  return (
    <>
      <Head>
        <title>Register — DawnDream</title>
        <meta name="description" content="Request access to DawnDream — the Gothic vampire RPG for Second Life." />
      </Head>
      <Navbar />

      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <span className={styles.drop} />
            DAWNDREAM
          </div>

          <p className={styles.subtitle}>Request access to DawnDream</p>

          {error && <div className={styles.errorMsg}>{error}</div>}

          {success ? (
            <div>
              <div className={styles.successMsg}>
                Your petition has been received.<br />
                Check your email — you will be notified once the council has reached a decision.
              </div>
              <p className={styles.note}>
                <Link href="/login" style={{ color: '#c0392b', textDecoration: 'none' }}>
                  ← Return to Login
                </Link>
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Avatar Name */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Avatar Name</label>
                  <input
                    className={styles.formInput}
                    name="avatarName"
                    value={form.avatarName}
                    onChange={handleChange}
                    placeholder="Your Second Life avatar name..."
                    autoComplete="off"
                    required
                  />
                </div>

                {/* Email */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input
                    className={styles.formInput}
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Your email address..."
                    autoComplete="email"
                    required
                  />
                </div>

                {/* SL UUID */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Second Life UUID</label>
                  <input
                    className={styles.formInput}
                    name="slUuid"
                    value={form.slUuid}
                    onChange={handleChange}
                    placeholder="e.g. 3c3a30f1-f918-49d9-b503-8742ff56e0f3"
                    autoComplete="off"
                    required
                  />
                  <p className={styles.hint}>
                    Find this in your SL profile — right-click your avatar → Profile → copy the Key shown
                  </p>
                </div>

                {/* Password */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password</label>
                  <input
                    className={styles.formInput}
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Choose a password..."
                    autoComplete="new-password"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Confirm Password</label>
                  <input
                    className={styles.formInput}
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password..."
                    autoComplete="new-password"
                    required
                  />
                </div>

                <button className={styles.submitBtn} type="submit" disabled={loading}>
                  {loading ? 'Submitting petition...' : 'Request Access →'}
                </button>
              </form>

              <p className={styles.note}>
                Your registration will be reviewed by a DawnDream admin before you can access the site.
              </p>
              <p className={styles.note}>
                Already a member?{' '}
                <Link href="/login" style={{ color: '#c0392b', textDecoration: 'none' }}>
                  Login here →
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream
      </footer>
    </>
  );
}
