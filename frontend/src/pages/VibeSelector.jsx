import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { vibes } from '../data/mock.js';
import Photo from '../components/Photo.jsx';

export default function VibeSelector() {
  const [sel, setSel] = useState([]);
  const nav = useNavigate();
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((v) => v !== id) : [...s, id]));

  const buildItinerary = () => {
    localStorage.setItem('selectedVibes', JSON.stringify(sel));
    nav(`/itinerary?vibes=${encodeURIComponent(sel.join(','))}`);
  };

  return (
    <div className="wrap page">
      <div className="head">
        <span className="eyebrow">Step 1</span>
        <h1>What does your trip feel like?</h1>
        <p className="lead">Choose one or more vibes. We’ll match destinations and build an itinerary tailored to that mood.</p>
      </div>
      <div className="grid g3">
        {vibes.map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggle(v.id)}
          >
            <Photo src={v.img} className={sel.includes(v.id) ? 'vibe on' : 'vibe'}>
              {sel.includes(v.id) && (
                <motion.span className="tick" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check size={16} color="#fff" />
                </motion.span>
              )}
              <div className="txt"><h3>{v.title}</h3><p>{v.text}</p></div>
            </Photo>
          </motion.div>
        ))}
      </div>
      <div style={{ marginTop: 36, display: 'flex', gap: 16, alignItems: 'center' }}>
        <button className="btn" disabled={!sel.length} onClick={buildItinerary}>
          Build my itinerary <ArrowRight size={16} />
        </button>
        <span style={{ color: 'var(--muted)' }}>{sel.length} selected</span>
      </div>
    </div>
  );
}
