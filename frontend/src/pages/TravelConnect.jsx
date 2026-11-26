import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Check } from 'lucide-react';
import { connect } from '../data/mock.js';
import { useApi, post } from '../api/client.js';

export default function TravelConnect() {
  const data = useApi('/connect', connect);
  const [tab, setTab] = useState('Buddies');
  const [done, setDone] = useState({});
  const labels = { Buddies: ['Connect', 'Requested'], Locals: ['Connect', 'Requested'], Groups: ['Join', 'Joined'] };
  const act = async (id) => {
    setDone((d) => ({ ...d, [id]: !d[id] }));
    post('/connect/request', { id }, null);
  };
  return (
    <div className="wrap page">
      <div className="head"><span className="eyebrow">Travel Connect</span><h1>Travel with good company</h1><p className="lead">Find buddies heading your way, locals who know the lanes, and small group activities.</p></div>
      <div className="tabs">{Object.keys(data).map((t) => <button key={t} className={t === tab ? 'tab on' : 'tab'} onClick={() => setTab(t)}>{t === 'Groups' ? 'Group activities' : t}</button>)}</div>
      <div className="grid g3">
        {data[tab].map((p, i) => (
          <motion.div key={tab + p.id} className="card person" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -6 }}>
            <img className="av" src={p.img} alt={p.name} onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
            <h3>{p.name}</h3>
            <small style={{ color: 'var(--muted)' }}>{p.place}</small>
            <p>{p.bio}</p>
            <div style={{ marginBottom: 16 }}>{p.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
            <button className={done[p.id] ? 'btn ghost small' : 'btn small'} onClick={() => act(p.id)}>
              {done[p.id] ? <><Check size={14} /> {labels[tab][1]}</> : <><UserPlus size={14} /> {labels[tab][0]}</>}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
