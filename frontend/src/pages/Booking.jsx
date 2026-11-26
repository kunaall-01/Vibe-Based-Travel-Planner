import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { searchData } from '../data/mock.js';
import { post } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const fmt = (n) => '₹' + n.toLocaleString('en-IN');

export default function Booking() {
  const { state } = useLocation();
  const { user } = useAuth();
  const item = state?.item || searchData.Hotels[0];
  const type = state?.type || 'Hotels';
  const [f, setF] = useState({ name: user?.name || '', email: user?.email || '', date: '', qty: 1, method: 'UPI', notes: '' });
  const [err, setErr] = useState({});
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const sub = item.price * f.qty;
  const tax = Math.round(sub * 0.05);

  const confirm = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = 'Required';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email';
    if (!f.date) er.date = 'Pick a date';
    setErr(er);
    if (Object.keys(er).length) return;
    const fallback = { ref: 'WF-' + Math.floor(10000 + Math.random() * 90000), status: 'Confirmed' };
    setDone(await post('/bookings', { item, ...f, total: sub + tax }, fallback));
  };

  if (done) return (
    <div className="wrap page" style={{ maxWidth: 560, textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><CheckCircle2 size={64} color="#5f8a6a" /></motion.div>
      <h1 style={{ margin: '14px 0 8px' }}>{done.status}</h1>
      <p className="lead" style={{ margin: '0 auto 24px' }}>{item.name} is booked. Reference <b>{done.ref}</b>. A confirmation has been sent to {f.email}.</p>
      <Link to="/my-trips" className="btn">View my trips</Link>
    </div>
  );

  return (
    <div className="wrap page">
      <div className="head"><span className="eyebrow">Checkout</span><h1>Confirm your booking</h1></div>
      <div className="split">
        <form className="card" onSubmit={confirm} noValidate>
          <h3 style={{ marginBottom: 16 }}>Traveller details</h3>
          <div className="grid g2">
            <label className="field">Full name<input value={f.name} onChange={set('name')} />{err.name && <span className="err">{err.name}</span>}</label>
            <label className="field">Email<input value={f.email} onChange={set('email')} />{err.email && <span className="err">{err.email}</span>}</label>
            <label className="field">Date<input type="date" value={f.date} onChange={set('date')} />{err.date && <span className="err">{err.date}</span>}</label>
            <label className="field">{type === 'Hotels' ? 'Nights' : 'Guests / seats'}<select value={f.qty} onChange={(e) => setF({ ...f, qty: +e.target.value })}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></label>
          </div>
          <h3 style={{ margin: '8px 0 16px' }}>Payment</h3>
          <label className="field">Method<select value={f.method} onChange={set('method')}><option>UPI</option><option>Credit / debit card</option><option>Net banking</option><option>Pay at property</option></select></label>
          <label className="field">Special requests<textarea rows={2} value={f.notes} onChange={set('notes')} /></label>
          <button className="btn">Confirm and pay {fmt(sub + tax)}</button>
          <p style={{ marginTop: 12, fontSize: '.78rem', color: 'var(--muted)' }}>Demo checkout. No real payment is taken.</p>
        </form>
        <aside className="card">
          <span className="eyebrow">{type}</span>
          <h3 style={{ margin: '6px 0' }}>{item.name}</h3>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: 14 }}>{item.meta}</p>
          <ul className="sum">
            <li><span>{fmt(item.price)} × {f.qty}</span><span>{fmt(sub)}</span></li>
            <li><span>Taxes (5%)</span><span>{fmt(tax)}</span></li>
            <li className="tot"><span>Total</span><span>{fmt(sub + tax)}</span></li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
