import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Photo from '../components/Photo.jsx';
import { destinations } from '../data/mock.js';

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [err, setErr] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setServerErr('');
    const er = {};
    if (f.name.trim().length < 2) er.name = 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email';
    if (f.phone && !/^\+?\d{10,13}$/.test(f.phone)) er.phone = 'Enter a valid phone number';
    if (f.password.length < 6) er.password = 'At least 6 characters';
    if (f.confirm !== f.password) er.confirm = 'Passwords do not match';
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await signup({ name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), password: f.password });
      nav('/vibe');
    } catch (error) {
      setServerErr(error.message || 'Could not create account.');
    } finally {
      setBusy(false);
    }
  };

  const fields = [
    ['name', 'Full name', 'text'],
    ['email', 'Email', 'email'],
    ['phone', 'Phone (optional)', 'tel'],
    ['password', 'Password', 'password'],
    ['confirm', 'Confirm password', 'password'],
  ];

  return (
    <div className="auth">
      <Photo src={destinations[1].img} className="side">
        <div><h2>Begin your journal.</h2><p>Every trip, saved to your account.</p></div>
      </Photo>
      <form className="form" onSubmit={submit} noValidate>
        <h1>Create account</h1>
        <p className="lead" style={{ marginBottom: 20 }}>Create an account to save your profile, trips and bookings.</p>
        {serverErr && <div className="warn" style={{ marginBottom: 16 }}>{serverErr}</div>}
        {fields.map(([k, label, type]) => (
          <label key={k} className="field">{label}
            <input type={type} value={f[k]} onChange={set(k)} />
            {err[k] && <span className="err">{err[k]}</span>}
          </label>
        ))}
        <button className="btn" disabled={busy}>{busy ? 'Creating account…' : 'Sign up'}</button>
        <p style={{ marginTop: 18, color: 'var(--muted)' }}>
          Already registered? <Link to="/login" className="link">Log in</Link>
        </p>
      </form>
    </div>
  );
}
