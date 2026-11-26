import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { trips } from '../data/mock.js';
import { useApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Photo from '../components/Photo.jsx';
import Reveal from '../components/Reveal.jsx';

const fmt = (n) => '₹' + n.toLocaleString('en-IN');
const nice = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

function Booking({ b, onOpen }) {
  return (
    <button className="bk" onClick={() => onOpen(b)}>
      <div><h3>{b.name}</h3><small>{b.place} · {b.dates}</small></div>
      <span className={`st ${b.status}`}>{b.status}</span>
    </button>
  );
}

export default function MyTrips() {
  const t = useApi('/trips', trips);
  const { user } = useAuth();
  const [sel, setSel] = useState(null);
  const up = t.upcoming;
  const days = Math.max(0, Math.ceil((new Date(up.start) - new Date()) / 864e5));
  const stay = up.stays.reduce((s, b) => s + b.amount, 0);
  const move = up.transport.reduce((s, b) => s + b.amount, 0);
  const left = up.budget - stay - move;
  const rows = [['Accommodation', stay], ['Transport', move], ['Still to spend', Math.max(left, 0)]];

  return (
    <div className="wrap page">
      <div className="head"><span className="eyebrow">My Trips</span><h2>Your travel journal{user?.name ? `, ${user.name}` : ''}</h2></div>

      <Photo src={up.img} className="tripHero">
        <div className="in">
          <div>
            <span className="eyebrow" style={{ color: '#e7c89a' }}>Next journey · {nice(up.start)} – {nice(up.end)}</span>
            <h1>{up.title}</h1>
            <p>{up.subtitle}</p>
            <div className="quick">
              <Link to="/itinerary">Itinerary</Link><Link to="/plan-b">Plan B</Link><Link to="/local-pulse">Local Pulse</Link><Link to="/budget">Budget Guardian</Link>
            </div>
          </div>
          <div className="count"><div className="big">{days}</div><small>days to go</small></div>
        </div>
      </Photo>

      <div className="split sect">
        <Reveal>
          <h2>Where you’ll stay</h2>
          <p className="sub">Tap a booking to see its full details.</p>
          {up.stays.map((b) => <Booking key={b.id} b={b} onOpen={setSel} />)}
          <h2 style={{ marginTop: 44 }}>Getting around</h2>
          <p className="sub">Trains, cabs and flights in order of travel.</p>
          {up.transport.map((b) => <Booking key={b.id} b={b} onOpen={setSel} />)}
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card bud">
            <span className="eyebrow">Trip budget</span>
            <div className="figs">
              <div className="fig"><small>Budget</small><b>{fmt(up.budget)}</b></div>
              <div className="fig"><small>Remaining</small><b>{fmt(left)}</b></div>
            </div>
            {rows.map(([n, v]) => (
              <div key={n}>
                <div className="cat"><span>{n}</span><span>{fmt(v)}</span></div>
                <div className="meter"><motion.div initial={{ width: 0 }} whileInView={{ width: `${(v / up.budget) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1 }} style={{ opacity: n === 'Still to spend' ? 0.35 : 1 }} /></div>
              </div>
            ))}
            <Link to="/budget" className="link" style={{ marginTop: 20 }}>Open Budget Guardian <ArrowRight size={14} /></Link>
          </div>
        </Reveal>
      </div>

      <section className="sect">
        <h2>Travel history</h2>
        <p className="sub">Journeys you’ve taken and those that didn’t quite happen.</p>
        <div className="history">
          {t.past.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.07}>
              <Photo src={p.img} className="pc"><div><small>{p.dates} · {p.status}</small><h3>{p.title}</h3><p>{p.note}</p></div></Photo>
            </Reveal>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {sel && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSel(null)}>
            <motion.aside className="drawer" initial={{ x: 60 }} animate={{ x: 0 }} exit={{ x: 60 }} onClick={(e) => e.stopPropagation()}>
              <button className="link" onClick={() => setSel(null)}><X size={16} /> Close</button>
              <h2 style={{ marginTop: 16 }}>{sel.name}</h2>
              <span className={`st ${sel.status}`}>{sel.status}</span>
              <dl>
                <dt>Type</dt><dd>{sel.place}</dd>
                <dt>When</dt><dd>{sel.dates}</dd>
                <dt>Reference</dt><dd>{sel.ref}</dd>
                <dt>Amount</dt><dd>{fmt(sel.amount)}</dd>
                <dt>Payment method</dt><dd>{sel.method}</dd>
                <dt>Payment status</dt><dd>{sel.paid}</dd>
              </dl>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
