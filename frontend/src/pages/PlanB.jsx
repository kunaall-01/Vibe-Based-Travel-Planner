import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, MapPin } from 'lucide-react';
import { api } from '../api/client.js';

const POPULAR = ['Manali', 'Jaipur', 'Goa', 'Udaipur', 'Agra', 'Rishikesh', 'Kyoto', 'Paris'];
const DISRUPTIONS = [
  ['rain', 'Rain / Bad weather'],
  ['closure', 'Attraction closure'],
  ['transport_delay', 'Transport delay'],
  ['unavailable', 'Activity unavailable'],
];

export default function PlanB() {
  const [params, setParams] = useSearchParams();
  const initialDest = params.get('dest') || '';

  const [destination, setDestination] = useState(initialDest);
  const [inputDest, setInputDest] = useState(initialDest);
  const [disruption, setDisruption] = useState('rain');
  const [data, setData] = useState(null);
  const [alt, setAlt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!destination) {
      setData(null);
      return;
    }
    let live = true;
    setLoading(true);
    api.get(`/plan-b?destination=${encodeURIComponent(destination)}&disruption=${encodeURIComponent(disruption)}`)
      .then((res) => { if (live) setData(res.data); })
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [destination, disruption]);

  const chooseDest = (place) => {
    const clean = place.trim();
    if (!clean) return;
    setDestination(clean);
    setInputDest(clean);
    setAlt(false);
    setParams({ dest: clean });
  };

  if (!destination) {
    return (
      <div className="wrap page">
        <div className="head" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 32px' }}>
          <span className="eyebrow">Plan B</span>
          <h1>Where will you go?</h1>
          <p className="lead" style={{ margin: '10px auto 0' }}>
            Tell us your destination and what might disrupt your day — we’ll generate a tailored backup plan for that exact place.
          </p>
        </div>

        <form className="card dest-picker" onSubmit={(e) => { e.preventDefault(); chooseDest(inputDest); }}>
          <div className="grid g2">
            <label className="field">Destination
              <input
                placeholder="e.g. Manali, Jaipur, Goa, Paris…"
                value={inputDest}
                onChange={(e) => setInputDest(e.target.value)}
                required
              />
            </label>
            <label className="field">Disruption type
              <select value={disruption} onChange={(e) => setDisruption(e.target.value)}>
                {DISRUPTIONS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </label>
          </div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>Popular destinations</p>
          <div className="chips">
            {POPULAR.map((p) => (
              <button type="button" key={p} className="chip" onClick={() => chooseDest(p)}>{p}</button>
            ))}
          </div>
          <button className="btn" disabled={!inputDest.trim()}>Build Plan B</button>
        </form>
      </div>
    );
  }

  const list = data ? (alt ? data.alternative : data.original) : [];

  return (
    <div className="wrap page" style={{ maxWidth: 780 }}>
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="eyebrow">Plan B · {data?.destination || destination}</span>
          <h1>When plans change</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={disruption} onChange={(e) => setDisruption(e.target.value)} style={{ width: 'auto' }}>
            {DISRUPTIONS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
          <button className="btn ghost small" onClick={() => { setDestination(''); setParams({}); }}>
            <MapPin size={14} /> Change place
          </button>
        </div>
      </div>

      {loading || !data ? (
        <p className="lead">Generating backup plan for {destination}…</p>
      ) : (
        <>
          <div className="warn" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <CloudRain size={20} /> {data.reason}
          </div>

          <div className="tabs">
            <button className={!alt ? 'tab on' : 'tab'} onClick={() => setAlt(false)}>Original plan</button>
            <button className={alt ? 'tab on' : 'tab'} onClick={() => setAlt(true)}>Plan B</button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${destination}-${disruption}-${alt ? 'b' : 'a'}`}
              className="card"
              initial={{ opacity: 0, x: alt ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: alt ? -40 : 40 }}
              transition={{ duration: 0.3 }}
            >
              <h3 style={{ marginBottom: 10 }}>{alt ? data.alt_title : data.original_title}</h3>
              <ul className="tl">
                {list.map((it, i) => (
                  <motion.li key={it.time + i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <b>{it.time}</b><span>{it.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          <p className="sub" style={{ marginTop: 16 }}>
            {alt ? 'Switch back anytime — nothing in your original plan is deleted.' : 'Tap Plan B to preview a disruption-ready alternative.'}
          </p>
        </>
      )}
    </div>
  );
}
