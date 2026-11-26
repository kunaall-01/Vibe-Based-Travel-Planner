import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { itinerary } from '../data/mock.js';
import { useApi } from '../api/client.js';

export default function Itinerary() {
  const data = useApi('/itinerary', itinerary);
  const [open, setOpen] = useState(0);
  return (
    <div className="wrap page" style={{ maxWidth: 800 }}>
      <div className="head"><span className="eyebrow">{data.dates}</span><h1>{data.title}</h1>
        <div className="quick" style={{ marginTop: 14 }}>
          <Link className="link" to="/plan-b">Plan B</Link><Link className="link" to="/local-pulse">Local Pulse</Link><Link className="link" to="/budget">Budget</Link><Link className="link" to="/search">Book stays</Link>
        </div>
      </div>
      {data.days.map((d, i) => (
        <div className="day" key={d.day}>
          <button onClick={() => setOpen(open === i ? -1 : i)}>
            <span className="n">{String(d.day).padStart(2, '0')}</span><span className="t">{d.title}</span>
            <motion.span animate={{ rotate: open === i ? 180 : 0 }}><ChevronDown /></motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ paddingBottom: 18 }}>{d.items.map((it) => <div className="slot" key={it.time}><b>{it.time}</b><span>{it.text}</span></div>)}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
