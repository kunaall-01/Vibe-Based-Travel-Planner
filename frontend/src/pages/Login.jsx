import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Photo from '../components/Photo.jsx';
import { destinations } from '../data/mock.js';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const from = useLocation().state?.from || '/my-trips';
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email';
    if (f.password.length < 6) er.password = 'At least 6 characters';
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    await login(f.email, f.password);
    nav(from, { replace: true });
  };
  return (
    <div className="auth">
      <Photo src={destinations[4].img} className="side"><div><h2>Welcome back.</h2><p>Your trips are right where you left them.</p></div></Photo>
      <form className="form" onSubmit={submit} noValidate>
        <h1>Log in</h1>
        <p className="lead" style={{ marginBottom: 26 }}>Continue planning your next journey.</p>
        <label className="field">Email<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />{err.email && <span className="err">{err.email}</span>}</label>
        <label className="field">Password<input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />{err.password && <span className="err">{err.password}</span>}</label>
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
        <p style={{ marginTop: 18, color: 'var(--muted)' }}>New here? <Link to="/signup" className="link">Create an account</Link></p>
      </form>
    </div>
  );
}
