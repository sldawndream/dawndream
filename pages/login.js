import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import styles from '../styles/Login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ identifier: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: form.identifier, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        router.push('/');
      }
    } catch {
      setError('Something went wrong — please try again');
    }
    setLoading(false);
  }

  return (
    <>
      <Head>
        <title>Login — DawnDream</title>
        <meta name="description" content="Login to DawnDream — the Gothic vampire RPG for Second Life." />
      </Head>
      <Navbar />

      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <span className={styles.drop} />
            DAWNDREAM
          </div>

          <p className={styles.subtitle}>Enter the eternal night</p>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Avatar Name or Email</label>
              <input
                className={styles.formInput}
                name="identifier"
                value={form.identifier}
                onChange={handleChange}
                placeholder="Avatar name or email address..."
                autoComplete="username"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Password</label>
              <input
                className={styles.formInput}
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password..."
                autoComplete="current-password"
                required
              />
            </div>

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Please wait...' : 'Enter the Night →'}
            </button>
          </form>

          <p className={styles.note}>
            <Link href="/forgot-password" style={{ color: '#c0392b', textDecoration: 'none' }}>
              Forgot your password?
            </Link>
          </p>
          <p className={styles.note}>
            Not yet a member?{' '}
            <Link href="/register" style={{ color: '#c0392b', textDecoration: 'none' }}>
              Request access →
            </Link>
          </p>
        </div>
      </div>

      <footer className={styles.footer}>
        DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG &nbsp;·&nbsp; All rights © DawnDream
      </footer>
    </>
  );
}
