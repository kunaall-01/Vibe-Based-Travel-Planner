import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Tag, ArrowRight } from 'lucide-react';
import { searchData } from '../data/mock.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';

export default function Booking() {
  const { state } = useLocation();
  const nav = useNavigate();
  const { user } = useAuth();
  const { formatMoney } = useRealtime();

  const item = state?.item || searchData.Hotels[0];
  const type = state?.type || 'Hotels';
  const dest = state?.dest || item.destination || 'Jaipur';

  const [f, setF] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    date: '',
    qty: 1,
    notes: '',
    travel_insurance: true,
  });
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(null); // { code, discount, label }
  const [promoErr, setPromoErr] = useState('');
  const [err, setErr] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const sub = item.price * f.qty;
  const tax = Math.round(sub * 0.05);
  const fee = 99;
  const ins = f.travel_insurance ? 199 : 0;
  const disc = promoApplied?.discount || 0;
  const grandTotal = Math.max(1, sub + tax + fee + ins - disc);

  const applyPromo = async () => {
    setPromoErr('');
    if (!promoInput.trim()) return;
    try {
      const res = await api.post('/payments/promo', { code: promoInput.trim(), base_amount: sub });
      setPromoApplied(res.data);
    } catch (e) {
      setPromoApplied(null);
      setPromoErr(e.response?.data?.message || 'Invalid coupon code');
    }
  };

  const proceedToGateway = async (e) => {
    e.preventDefault();
    setServerErr('');
    const er = {};
    if (!f.name.trim()) er.name = 'Required';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email';
    if (!f.date) er.date = 'Pick a date';
    setErr(er);
    if (Object.keys(er).length) return;

    setBusy(true);
    try {
      const res = await api.post('/payments/order', {
        item,
        type,
        dest,
        name: f.name,
        email: f.email,
        phone: f.phone,
        date: f.date,
        qty: f.qty,
        notes: f.notes,
        travel_insurance: f.travel_insurance,
        promo_code: promoApplied?.code || '',
      });
      nav('/payment-gateway', { state: { order: res.data.order } });
    } catch (error) {
      setServerErr(error.response?.data?.message || 'Could not initialize payment order.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap page">
      <div className="head">
        <span className="eyebrow">Review Booking · {dest}</span>
        <h1>Traveller details & fare review</h1>
      </div>

      <div className="split">
        <form className="card" onSubmit={proceedToGateway} noValidate>
          <h3 style={{ marginBottom: 16 }}>Traveller details</h3>
          {serverErr && <div className="warn" style={{ marginBottom: 16 }}>{serverErr}</div>}

          <div className="grid g2">
            <label className="field">Full name<input value={f.name} onChange={set('name')} />{err.name && <span className="err">{err.name}</span>}</label>
            <label className="field">Email<input value={f.email} onChange={set('email')} />{err.email && <span className="err">{err.email}</span>}</label>
            <label className="field">Phone<input value={f.phone} onChange={set('phone')} placeholder="10-digit mobile" /></label>
            <label className="field">Check-in / Travel date<input type="date" value={f.date} onChange={set('date')} />{err.date && <span className="err">{err.date}</span>}</label>
          </div>

          <label className="field" style={{ maxWidth: 220 }}>
            {type === 'Hotels' ? 'Nights' : type === 'Rentals' ? 'Rental days' : 'Guests / seats'}
            <select value={f.qty} onChange={(e) => setF({ ...f, qty: +e.target.value })}>
              {[1, 2, 3, 4, 5, 7].map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>

          <label className="checkbox-card">
            <input
              type="checkbox"
              checked={f.travel_insurance}
              onChange={(e) => setF({ ...f, travel_insurance: e.target.checked })}
            />
            <div>
              <b><ShieldCheck size={15} color="#5f8a6a" style={{ verticalAlign: 'middle', marginRight: 4 }} /> Add Trip Protection & Free Cancellation ({formatMoney(199)})</b>
              <small style={{ display: 'block', color: 'var(--muted)' }}>
                100% refund on weather/medical cancellations up to 24 hrs before travel.
              </small>
            </div>
          </label>

          <label className="field" style={{ marginTop: 14 }}>Special requests (early check-in, window seat, etc.)
            <textarea rows={2} value={f.notes} onChange={set('notes')} />
          </label>

          <button className="btn" disabled={busy}>
            {busy ? 'Creating Secure Order…' : <>Proceed to Payment Gateway ({formatMoney(grandTotal)}) <ArrowRight size={16} /></>}
          </button>
        </form>

        <aside className="card">
          <span className="eyebrow">{type} · {dest}</span>
          <h3 style={{ margin: '6px 0' }}>{item.name}</h3>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: 14 }}>{item.meta}</p>

          <div className="promo-box">
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Promo code (try WAYFARER10)"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 10 }}
              />
              <button type="button" className="btn ghost small" onClick={applyPromo}>
                <Tag size={13} /> Apply
              </button>
            </div>
            {promoErr && <small style={{ color: 'var(--high)', display: 'block', marginTop: 6 }}>{promoErr}</small>}
            {promoApplied && (
              <small style={{ color: 'var(--low)', display: 'block', marginTop: 6 }}>
                ✓ {promoApplied.code} applied — {promoApplied.label}
              </small>
            )}
            <div className="chips" style={{ marginTop: 8, marginBottom: 0 }}>
              {['WAYFARER10', 'FIRSTTRIP', 'MOUNTAIN15'].map((c) => (
                <button key={c} type="button" className="chip" style={{ fontSize: '.72rem', padding: '4px 10px' }} onClick={() => setPromoInput(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <ul className="sum" style={{ marginTop: 16 }}>
            <li><span>{formatMoney(item.price)} × {f.qty}</span><span>{formatMoney(sub)}</span></li>
            <li><span>Taxes & GST (5%)</span><span>{formatMoney(tax)}</span></li>
            <li><span>Convenience fee</span><span>{formatMoney(fee)}</span></li>
            {ins > 0 && <li><span>Trip protection</span><span>{formatMoney(ins)}</span></li>}
            {disc > 0 && <li style={{ color: 'var(--low)' }}><span>Promo ({promoApplied.code})</span><span>-{formatMoney(disc)}</span></li>}
            <li className="tot"><span>Total payable</span><span>{formatMoney(grandTotal)}</span></li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
