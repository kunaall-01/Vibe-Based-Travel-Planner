import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { vibes } from '../data/mock.js';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [f, setF] = useState({ name: user.name || '', email: user.email || '', phone: user.phone || '', city: user.city || '', bio: user.bio || '', vibes: user.vibes || [] });
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (id) => setF({ ...f, vibes: f.vibes.includes(id) ? f.vibes.filter((v) => v !== id) : [...f.vibes, id] });
  const save = async (e) => {
    e.preventDefault();
    await updateUser(f);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };
  return (
    <div className="wrap page" style={{ maxWidth: 760 }}>
      <div className="head"><span className="eyebrow">Profile</span><h1>{f.name || 'Traveller'}</h1><p className="lead">Keep your details and travel preferences up to date.</p></div>
      <form className="card" onSubmit={save}>
        <div className="grid g2">
          <label className="field">Full name<input value={f.name} onChange={set('name')} /></label>
          <label className="field">Email<input type="email" value={f.email} onChange={set('email')} /></label>
          <label className="field">Phone<input value={f.phone} onChange={set('phone')} /></label>
          <label className="field">Home city<input value={f.city} onChange={set('city')} /></label>
        </div>
        <label className="field">About you<textarea rows={3} value={f.bio} onChange={set('bio')} placeholder="A line about how you like to travel" /></label>
        <p className="eyebrow" style={{ marginBottom: 10 }}>Favourite vibes</p>
        <div style={{ marginBottom: 24 }}>
          {vibes.map((v) => (
            <button type="button" key={v.id} className={f.vibes.includes(v.id) ? 'tab on' : 'tab'} style={{ margin: '0 6px 6px 0' }} onClick={() => toggle(v.id)}>{v.title}</button>
          ))}
        </div>
        <button className="btn">Save changes</button>
      </form>
      <AnimatePresence>{saved && <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>Profile saved</motion.div>}</AnimatePresence>
    </div>
  );
}
