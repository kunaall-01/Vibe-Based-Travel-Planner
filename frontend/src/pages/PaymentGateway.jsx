import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, CheckCircle2, CreditCard, Smartphone, Building2,
  ShieldCheck, Clock, Printer, AlertCircle
} from 'lucide-react';
import { api } from '../api/client.js';
import { useRealtime } from '../context/RealtimeContext.jsx';

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function luhnValid(numStr) {
  const digits = numStr.replace(/\D/g, '');
  if (digits.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function detectBrand(num) {
  const d = num.replace(/\D/g, '');
  if (d.startsWith('4')) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'MASTERCARD';
  if (/^(34|37)/.test(d)) return 'AMEX';
  if (/^(60|65|81|82)/.test(d)) return 'RUPAY';
  return 'CARD';
}

export default function PaymentGateway() {
  const { state } = useLocation();
  const nav = useNavigate();
  const { formatMoney } = useRealtime();
  const order = state?.order;

  const [secondsLeft, setSecondsLeft] = useState(600);
  const [method, setMethod] = useState('Card'); // Card | UPI | NetBanking | PayAtProperty

  // Card state
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [cvvFocus, setCvvFocus] = useState(false);

  // UPI state
  const [vpa, setVpa] = useState('');
  const [vpaVerified, setVpaVerified] = useState(null);
  const [verifyingVpa, setVerifyingVpa] = useState(false);

  // NetBanking state
  const [bank, setBank] = useState('HDFC Bank');

  // 3DS OTP Step
  const [step, setStep] = useState('method'); // method | otp | receipt
  const [otpInput, setOtpInput] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  if (!order) {
    return (
      <div className="wrap page" style={{ maxWidth: 560, textAlign: 'center' }}>
        <h2>No active payment session</h2>
        <p className="lead" style={{ margin: '10px auto 20px' }}>Choose a stay, flight, or experience first to open the secure payment gateway.</p>
        <Link to="/search" className="btn">Browse travel options</Link>
      </div>
    );
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const cardDigits = card.number.replace(/\D/g, '');
  const brand = detectBrand(cardDigits);
  const cardIsLuhnOk = cardDigits.length >= 13 && luhnValid(cardDigits);

  const handleVerifyVpa = async () => {
    setErr('');
    setVpaVerified(null);
    setVerifyingVpa(true);
    try {
      const res = await api.post('/payments/verify-vpa', { vpa });
      setVpaVerified(res.data);
    } catch (e) {
      setErr(e.response?.data?.message || 'UPI verification failed.');
    } finally {
      setVerifyingVpa(false);
    }
  };

  const handleInitiate = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await api.post('/payments/initiate', {
        order_id: order.order_id,
        method,
        card_number: card.number,
        card_name: card.name,
        expiry: card.expiry,
        cvv: card.cvv,
        vpa,
        bank,
      });
      setDemoOtp(res.data.demo_otp);
      setStep('otp');
    } catch (error) {
      setErr(error.response?.data?.message || 'Real-time verification failed. Please check your payment details.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await api.post('/payments/verify-otp', {
        order_id: order.order_id,
        otp: otpInput,
      });
      setReceipt(res.data.receipt);
      setStep('receipt');
    } catch (error) {
      setErr(error.response?.data?.message || 'Incorrect OTP.');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'receipt' && receipt) {
    return (
      <div className="wrap page" style={{ maxWidth: 640 }}>
        <motion.div className="card receipt-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
              <CheckCircle2 size={60} color="#5f8a6a" style={{ margin: '0 auto' }} />
            </motion.div>
            <span className="eyebrow" style={{ display: 'block', marginTop: 12 }}>Payment Verified & Confirmed</span>
            <h1 style={{ marginTop: 4 }}>{formatMoney(receipt.amount_paid)}</h1>
            <p style={{ color: 'var(--muted)' }}>{receipt.item_name} · {receipt.destination}</p>
          </div>

          <ul className="sum">
            <li><span>Booking Reference</span><b>{receipt.ref}</b></li>
            <li><span>Transaction ID</span><b>{receipt.txn_id}</b></li>
            <li><span>Bank Auth Code</span><b>{receipt.auth_code}</b></li>
            <li><span>Payment Method</span><b>{receipt.channel_detail}</b></li>
            <li><span>Travel Date</span><b>{receipt.travel_date}</b></li>
            <li><span>Status</span><b style={{ color: 'var(--low)' }}>{receipt.payment_status}</b></li>
          </ul>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            <Link to="/my-trips" className="btn">Go to My Trips</Link>
            <button type="button" className="btn ghost" onClick={() => window.print()}>
              <Printer size={15} /> Print Receipt
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="wrap page">
      <div className="gateway-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={16} color="#5f8a6a" />
          <b>Wayfarer Secure Payment Gateway</b>
          <span className="tag" style={{ margin: 0 }}>256-bit Real-Time Verification</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brass)', fontWeight: 600 }}>
          <Clock size={15} /> Session expires in {mm}:{ss}
        </div>
      </div>

      <div className="split">
        <div className="card">
          {err && (
            <div className="warn" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <AlertCircle size={18} /> <span>{err}</span>
            </div>
          )}

          {step === 'method' ? (
            <>
              <div className="tabs">
                <button type="button" className={method === 'Card' ? 'tab on' : 'tab'} onClick={() => { setMethod('Card'); setErr(''); }}>
                  <CreditCard size={14} style={{ marginRight: 6 }} /> Credit / Debit Card
                </button>
                <button type="button" className={method === 'UPI' ? 'tab on' : 'tab'} onClick={() => { setMethod('UPI'); setErr(''); }}>
                  <Smartphone size={14} style={{ marginRight: 6 }} /> UPI
                </button>
                <button type="button" className={method === 'NetBanking' ? 'tab on' : 'tab'} onClick={() => { setMethod('NetBanking'); setErr(''); }}>
                  <Building2 size={14} style={{ marginRight: 6 }} /> Net Banking
                </button>
                <button type="button" className={method === 'PayAtProperty' ? 'tab on' : 'tab'} onClick={() => { setMethod('PayAtProperty'); setErr(''); }}>
                  Pay at Property
                </button>
              </div>

              <form onSubmit={handleInitiate}>
                {method === 'Card' && (
                  <>
                    {/* 3D Interactive Card */}
                    <div className={`card-3d-scene ${cvvFocus ? 'flipped' : ''}`}>
                      <div className="card-3d-face front">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="chip-gold" />
                          <b>{brand}</b>
                        </div>
                        <div className="card-3d-num">
                          {card.number || '•••• •••• •••• ••••'}
                        </div>
                        <div className="card-3d-foot">
                          <div><small>CARDHOLDER</small><div>{(card.name || 'YOUR NAME').toUpperCase()}</div></div>
                          <div><small>EXPIRES</small><div>{card.expiry || 'MM/YY'}</div></div>
                        </div>
                      </div>
                      <div className="card-3d-face back">
                        <div className="mag-strip" />
                        <div className="cvv-strip">
                          <span>CVV</span>
                          <b>{card.cvv ? '•'.repeat(card.cvv.length) : '•••'}</b>
                        </div>
                      </div>
                    </div>

                    <label className="field">
                      <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                        Card number
                        {cardDigits.length >= 13 && (
                          <b style={{ color: cardIsLuhnOk ? 'var(--low)' : 'var(--high)' }}>
                            {cardIsLuhnOk ? `✓ Valid ${brand} (Luhn verified)` : '✗ Invalid card number'}
                          </b>
                        )}
                      </span>
                      <input
                        placeholder="4111 1111 1111 1111"
                        value={card.number}
                        onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                        required
                      />
                    </label>
                    <label className="field">Cardholder name
                      <input
                        placeholder="Name printed on card"
                        value={card.name}
                        onChange={(e) => setCard({ ...card, name: e.target.value })}
                        required
                      />
                    </label>
                    <div className="grid g2">
                      <label className="field">Expiry (MM/YY)
                        <input
                          placeholder="08/29"
                          maxLength={5}
                          value={card.expiry}
                          onChange={(e) => {
                            let v = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                            if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
                            setCard({ ...card, expiry: v });
                          }}
                          required
                        />
                      </label>
                      <label className="field">CVV
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="•••"
                          value={card.cvv}
                          onFocus={() => setCvvFocus(true)}
                          onBlur={() => setCvvFocus(false)}
                          onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                          required
                        />
                      </label>
                    </div>
                  </>
                )}

                {method === 'UPI' && (
                  <div style={{ marginBottom: 16 }}>
                    <label className="field">Enter UPI ID (VPA)
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          placeholder="yourname@okicici or mobile@ybl"
                          value={vpa}
                          onChange={(e) => { setVpa(e.target.value); setVpaVerified(null); }}
                          required
                        />
                        <button type="button" className="btn ghost small" onClick={handleVerifyVpa} disabled={verifyingVpa}>
                          {verifyingVpa ? 'Checking…' : 'Verify UPI'}
                        </button>
                      </div>
                    </label>
                    {vpaVerified && (
                      <div className="info-banner success-banner">
                        ✓ Verified: <b>{vpaVerified.account_holder}</b> · {vpaVerified.bank_name}
                      </div>
                    )}
                  </div>
                )}

                {method === 'NetBanking' && (
                  <label className="field">Select Bank
                    <select value={bank} onChange={(e) => setBank(e.target.value)}>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>State Bank of India</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                    </select>
                  </label>
                )}

                {method === 'PayAtProperty' && (
                  <div className="info-banner">
                    Your reservation will be guaranteed now via OTP verification and settled directly at check-in.
                  </div>
                )}

                <button className="btn" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
                  <ShieldCheck size={16} />
                  {busy ? 'Verifying with Bank…' : `Verify & Pay ${formatMoney(order.final_amount)}`}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <span className="eyebrow">3D-Secure Bank Verification</span>
              <h2 style={{ margin: '6px 0 12px' }}>Enter 6-Digit OTP</h2>
              <p className="lead" style={{ marginBottom: 16 }}>
                We sent a verification code for <b>{formatMoney(order.final_amount)}</b>.
              </p>

              <div className="info-banner">
                <b>Simulated Bank SMS:</b> Your Wayfarer verification OTP is <b style={{ fontSize: '1.1rem', letterSpacing: 2 }}>{demoOtp}</b>
              </div>

              <label className="field">Verification OTP
                <input
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  style={{ fontSize: '1.3rem', letterSpacing: 6, textAlign: 'center' }}
                  required
                />
              </label>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn" disabled={busy || otpInput.length !== 6}>
                  {busy ? 'Confirming Payment…' : 'Confirm & Complete Booking'}
                </button>
                <button type="button" className="btn ghost" onClick={() => setStep('method')}>
                  Back
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="card">
          <span className="eyebrow">Order Summary · {order.order_id}</span>
          <h3 style={{ margin: '8px 0 4px' }}>{order.booking?.item?.name}</h3>
          <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: 14 }}>
            {order.booking?.dest} · Date: {order.booking?.date}
          </p>
          <ul className="sum">
            <li><span>Base fare</span><span>{formatMoney(order.base_amount)}</span></li>
            <li><span>Taxes & GST</span><span>{formatMoney(order.tax_amount)}</span></li>
            <li><span>Convenience fee</span><span>{formatMoney(order.convenience_fee)}</span></li>
            {order.insurance_fee > 0 && <li><span>Trip protection</span><span>{formatMoney(order.insurance_fee)}</span></li>}
            {order.discount_amount > 0 && (
              <li style={{ color: 'var(--low)' }}><span>Promo ({order.promo_code})</span><span>-{formatMoney(order.discount_amount)}</span></li>
            )}
            <li className="tot"><span>Total Payable</span><span>{formatMoney(order.final_amount)}</span></li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
