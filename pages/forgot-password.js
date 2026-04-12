import Head from 'next/head';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import styles from '../styles/Login.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <>
      <Head><title>Forgot Password — DawnDream</title></Head>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}><span className={styles.drop}></span>DAWNDREAM</div>
          <p className={styles.subtitle}>Reset your password</p>
          {submitted ? (
            <div className={styles.successMsg}>
              If an account exists with that email, a reset link has been sent. Check your inbox!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Your Email Address</label>
                <input className={styles.formInput} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your registered email..." required />
              </div>
              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link →'}
              </button>
            </form>
          )}
          <p className={styles.note}><a href="/login" style={{ color: '#c0392b', textDecoration: 'none' }}>← Back to Login</a></p>
        </div>
      </div>
      <footer className={styles.footer}>DawnDream Vampire System &nbsp;·&nbsp; Second Life RPG</footer>
    </>
  );
}
