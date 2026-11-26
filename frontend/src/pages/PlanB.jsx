import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain } from 'lucide-react';
import { planB } from '../data/mock.js';
import { useApi } from '../api/client.js';

export default function PlanB() {
  const data = useApi('/plan-b', planB);
  const [alt, setAlt] = useState(false);
  const list = alt ? data.alternative : data.original;
  return (
    <div className="wrap page" style={{ maxWidth: 760 }}>
      <div className="head"><span className="eyebrow">Plan B</span><h1>When plans change</h1></div>
      <div className="warn" style={{ display: 'flex', gap: 12, alignItems: 'center' }}><CloudRain size={20} /> {data.reason}</div>
      <div className="tabs">
        <button className={!alt ? 'tab on' : 'tab'} onClick={() => setAlt(false)}>Original plan</button>
        <button className={alt ? 'tab on' : 'tab'} onClick={() => setAlt(true)}>Plan B</button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={alt ? 'b' : 'a'} className="card" initial={{ opacity: 0, x: alt ? 40 : -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: alt ? -40 : 40 }} transition={{ duration: 0.3 }}>
          <h3 style={{ marginBottom: 10 }}>Day 2 · {alt ? 'Rain-ready itinerary' : 'Forts & Palaces'}</h3>
          <ul className="tl">
            {list.map((it, i) => (
              <motion.li key={it.time} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}><b>{it.time}</b><span>{it.text}</span></motion.li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>
      <p className="sub" style={{ marginTop: 16 }}>{alt ? 'Switch back anytime — nothing in your original plan is deleted.' : 'Tap Plan B to preview a rain-ready alternative.'}</p>
    </div>
  );
}
