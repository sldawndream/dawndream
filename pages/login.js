import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import styles from '../styles/Login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ avatarName: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarName: form.avatarName, password: form.password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else if (mode === 'register') {
        setSuccess('Registration submitted! You will be notified once an admin approves your account.');
        setForm({ avatarName: '', password: '', confirmPassword: '' });
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('Something went wrong — please try again');
    }
    setLoading(false);
  }

  return (
    <>
      <Head>
        <title>{mode === 'login' ? 'Login' : 'Register'} — DawnDream</title>
      </Head>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <span className={styles.drop}></span>
            DAWNDREAM
          </div>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`} onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
              Login
            </button>
            <button className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`} onClick={() => { setMode('register'); setError(''); setSuccess(''); }}>
              Register
            </button>
          </div>

          {mode === 'login' ? (
            <p className={styles.subtitle}>Enter the eternal night</p>
          ) : (
            <p className={styles.subtitle}>Request access to DawnDream</p>
          )}

          {error && <div className={styles.errorMsg}>{error}</div>}
          {success && <div className={styles.successMsg}>{success}</div>}

          {!success && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Avatar Name</label>
                <input className={styles.formInput} name="avatarName" value={form.avatarName} onChange={handleChange} placeholder="Your Second Life avatar name..." required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Password</label>
                <input className={styles.formInput} name="password" type="password" value={form.password} onChange={handleChange} placeholder="Your password..." required />
              </div>
              {mode === 'register' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Confirm Password</label>
                  <input className={styles.formInput} name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm your password..." required />
                </div>
              )}
              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? 'Please wait...' : mode === 'login' ? 'Enter the Night →' : 'Request Access →'}
              </button>
            </form>
          )}

          {mode === 'register' && !success && (
            <p className={styles.note}>Your registration will be reviewed by a DawnDream admin before you can access the site.</p>
          )}
        </div>
      </div>
      <footer className={styles.footer}>
        DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG
      </footer>
    </>
  );
}
