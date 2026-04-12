import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import styles from '../styles/Login.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: form.password }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else setSuccess(true);
    setLoading(false);
  }

  return (
    <>
      <Head><title>Reset Password — DawnDream</title></Head>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}><span className={styles.drop}></span>DAWNDREAM</div>
          <p className={styles.subtitle}>Set a new password</p>
          {success ? (
            <div className={styles.successMsg}>
              Password reset successfully! <a href="/login" style={{ color: '#c0392b' }}>Login now →</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <div className={styles.errorMsg}>{error}</div>}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>New Password</label>
                <input className={styles.formInput} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="New password..." required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Confirm Password</label>
                <input className={styles.formInput} type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Confirm new password..." required />
              </div>
              <button className={styles.submitBtn} type="submit" disabled={loading || !token}>
                {loading ? 'Resetting...' : 'Reset Password →'}
              </button>
            </form>
          )}
        </div>
      </div>
      <footer className={styles.footer}>DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG</footer>
    </>
  );
}
