import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { api } from '../api/client.js';

const BAR = { Low: 'var(--low)', Moderate: 'var(--mod)', High: 'var(--high)' };
const POPULAR = ['Manali', 'Jaipur', 'Goa', 'Udaipur', 'Agra', 'Rishikesh', 'Kyoto', 'Paris'];

export default function LocalPulse() {
  const [params, setParams] = useSearchParams();
  const initialDest = params.get('dest') || '';

  const [destination, setDestination] = useState(initialDest);
  const [inputDest, setInputDest] = useState(initialDest);
  const [places, setPlaces] = useState([]);
  const [lvl, setLvl] = useState('All');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!destination) {
      setPlaces([]);
      return;
    }
    let live = true;
    setLoading(true);
    api.get(`/local-pulse?destination=${encodeURIComponent(destination)}`)
      .then((res) => { if (live) setPlaces(res.data.places || []); })
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [destination]);

  const chooseDest = (place) => {
    const clean = place.trim();
    if (!clean) return;
    setDestination(clean);
    setInputDest(clean);
    setLvl('All');
    setParams({ dest: clean });
  };

  if (!destination) {
    return (
      <div className="wrap page">
        <div className="head" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 32px' }}>
          <span className="eyebrow">Local Pulse</span>
          <h1>Which place are you checking?</h1>
          <p className="lead" style={{ margin: '10px auto 0' }}>
            Enter or pick a destination first so we can suggest quiet visiting windows and crowd levels for spots there.
          </p>
        </div>

        <form className="card dest-picker" onSubmit={(e) => { e.preventDefault(); chooseDest(inputDest); }}>
          <label className="field">Destination
            <input
              placeholder="e.g. Manali, Jaipur, Goa, Udaipur…"
              value={inputDest}
              onChange={(e) => setInputDest(e.target.value)}
              required
            />
          </label>
          <p className="eyebrow" style={{ marginBottom: 4 }}>Popular destinations</p>
          <div className="chips">
            {POPULAR.map((p) => (
              <button type="button" key={p} className="chip" onClick={() => chooseDest(p)}>{p}</button>
            ))}
          </div>
          <button className="btn" disabled={!inputDest.trim()}>Check Local Pulse</button>
        </form>
      </div>
    );
  }

  const shown = places.filter((p) => lvl === 'All' || p.level === lvl);

  return (
    <div className="wrap page" style={{ maxWidth: 820 }}>
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="eyebrow">Local Pulse · {destination}</span>
          <h1>How busy is {destination} right now?</h1>
          <p className="lead">Live-feel crowd levels and quiet windows for {destination}.</p>
        </div>
        <button className="btn ghost small" onClick={() => { setDestination(''); setParams({}); }}>
          <MapPin size={14} /> Change place
        </button>
      </div>

      <div className="tabs">
        {['All', 'Low', 'Moderate', 'High'].map((l) => (
          <button key={l} className={lvl === l ? 'tab on' : 'tab'} onClick={() => setLvl(l)}>{l}</button>
        ))}
      </div>

      {loading ? (
        <p className="lead">Loading crowd levels for {destination}…</p>
      ) : (
        <AnimatePresence mode="popLayout">
          {shown.map((p) => (
            <motion.div layout key={p.id} className="card pulse" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="nm">
                <h3>{p.place}</h3>
                <small>Best time: {p.best}{p.suggestion ? ` · ${p.suggestion}` : ''}</small>
              </div>
              <div className="pbar">
                <motion.div initial={{ width: 0 }} animate={{ width: `${p.pct}%` }} transition={{ duration: 0.9 }} style={{ background: BAR[p.level] }} />
              </div>
              <div className={`lvl ${p.level}`}>
                <span className="dot" style={{ background: BAR[p.level] }} /> {p.level}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
