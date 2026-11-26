import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pulse } from '../data/mock.js';
import { useApi } from '../api/client.js';

const BAR = { Low: 'var(--low)', Moderate: 'var(--mod)', High: 'var(--high)' };

export default function LocalPulse() {
  const data = useApi('/local-pulse', pulse);
  const [lvl, setLvl] = useState('All');
  const shown = data.filter((p) => lvl === 'All' || p.level === lvl);
  return (
    <div className="wrap page" style={{ maxWidth: 820 }}>
      <div className="head"><span className="eyebrow">Local Pulse · Jaipur</span><h1>How busy is it right now?</h1><p className="lead">Live-feel crowd levels, so you can visit at the calmest time.</p></div>
      <div className="tabs">{['All', 'Low', 'Moderate', 'High'].map((l) => <button key={l} className={lvl === l ? 'tab on' : 'tab'} onClick={() => setLvl(l)}>{l}</button>)}</div>
      <AnimatePresence mode="popLayout">
        {shown.map((p) => (
          <motion.div layout key={p.id} className="card pulse" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="nm"><h3>{p.place}</h3><small>Best time: {p.best}</small></div>
            <div className="pbar"><motion.div initial={{ width: 0 }} animate={{ width: `${p.pct}%` }} transition={{ duration: 1 }} style={{ background: BAR[p.level] }} /></div>
            <div className={`lvl ${p.level}`}><span className="dot" style={{ background: BAR[p.level] }} /> {p.level}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
