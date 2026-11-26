import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, Sparkles, Wallet, Users } from 'lucide-react';
import { destinations } from '../data/mock.js';
import Photo from '../components/Photo.jsx';
import Reveal from '../components/Reveal.jsx';

export default function Home() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const list = q.trim() ? destinations.filter((d) => (d.name + d.region).toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <>
      <section className="hero" ref={ref}>
        <motion.div className="bg" style={{ y }}>
          <img src={destinations[0].img} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
        </motion.div>
        <div className="shade" />
        <div className="wrap in">
          <motion.p className="eyebrow" style={{ color: '#e7c89a' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Your travel journal</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            Travel slowly.<br />Remember everything.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            Plan trips by feeling, not spreadsheets — with budgets, backups and local insight built in.
          </motion.p>
          <div className="searchbox">
            <input placeholder="Where to next?" value={q} onChange={(e) => setQ(e.target.value)} />
            {list.length > 0 && (
              <motion.div className="suggest" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                {list.map((d) => (
                  <button key={d.id} onClick={() => nav(`/search?dest=${d.name}`)}>
                    <Photo src={d.img} className="thumb" />
                    <span><b>{d.name}</b><small>{d.region}</small></span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
          <div style={{ marginTop: 22 }}><Link to="/vibe" className="btn"><Sparkles size={16} /> Pick your vibe</Link></div>
        </div>
      </section>
      <section className="feat wrap">
        <div className="grid g3">
          {[[Search, 'Find', 'Compare hotels, trains, flights and restaurants side by side.'],
            [Wallet, 'Protect', 'Budget Guardian keeps spending honest, day by day.'],
            [Users, 'Connect', 'Meet buddies, locals and small group activities.']].map(([I, t, d], i) => (
            <Reveal key={t} delay={i * 0.1}><div className="card"><I color="#a8743c" /><h3>{t}</h3><p>{d}</p></div></Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
