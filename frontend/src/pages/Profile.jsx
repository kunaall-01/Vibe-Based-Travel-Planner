import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { vibes } from '../data/mock.js';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [f, setF] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.city || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
    vibes: user?.vibes || [],
  });
  const [saved, setSaved] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setF({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || '',
        vibes: user.vibes || [],
      });
    }
  }, [user]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (id) => setF({ ...f, vibes: f.vibes.includes(id) ? f.vibes.filter((v) => v !== id) : [...f.vibes, id] });

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 280;
        const scale = Math.min(max / img.width, max / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setF((prev) => ({ ...prev, avatar_url: canvas.toDataURL('image/jpeg', 0.82) }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await updateUser(f);
      setSaved('Profile saved to database');
      setTimeout(() => setSaved(''), 2500);
    } catch (error) {
      setErr(error.message || 'Failed to save profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap page" style={{ maxWidth: 760 }}>
      <div className="head">
        <span className="eyebrow">Profile</span>
        <h1>{f.name || 'Traveller'}</h1>
        <p className="lead">Keep your details and travel preferences up to date. Changes are persisted to the database.</p>
      </div>
      <form className="card" onSubmit={save}>
        {err && <div className="warn" style={{ marginBottom: 16 }}>{err}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, flexWrap: 'wrap' }}>
          <img
            src={f.avatar_url || 'https://i.pravatar.cc/200?img=20'}
            alt={f.name}
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', background: 'var(--line)' }}
          />
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="field" style={{ marginBottom: 8 }}>
              Profile photo URL
              <input value={f.avatar_url} onChange={set('avatar_url')} placeholder="https://..." />
            </label>
            <label className="btn ghost small" style={{ cursor: 'pointer' }}>
              <Upload size={14} /> Upload photo
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        <div className="grid g2">
          <label className="field">Full name<input value={f.name} onChange={set('name')} required /></label>
          <label className="field">Email<input type="email" value={f.email} onChange={set('email')} required /></label>
          <label className="field">Phone<input value={f.phone} onChange={set('phone')} /></label>
          <label className="field">Home city<input value={f.city} onChange={set('city')} /></label>
        </div>
        <label className="field">About you
          <textarea rows={3} value={f.bio} onChange={set('bio')} placeholder="A line about how you like to travel" />
        </label>
        <p className="eyebrow" style={{ marginBottom: 10 }}>Favourite vibes</p>
        <div style={{ marginBottom: 24 }}>
          {vibes.map((v) => (
            <button
              type="button"
              key={v.id}
              className={f.vibes.includes(v.id) ? 'tab on' : 'tab'}
              style={{ margin: '0 6px 6px 0' }}
              onClick={() => toggle(v.id)}
            >
              {v.title}
            </button>
          ))}
        </div>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
      <AnimatePresence>
        {saved && (
          <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {saved}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
