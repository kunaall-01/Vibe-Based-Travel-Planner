import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Star, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import MemoryCardPreview from './MemoryCardPreview.jsx';

export default function MemoryCardEditor({ open, onClose, trip, onSaved }) {
  const movie = trip?.movie;
  const existing = trip?.memory || {};
  const activityOptions = trip?.activities || trip?.itinerary_activities || [];

  const [f, setF] = useState({
    favorite_destination: existing.favorite_destination || trip?.destination || '',
    favorite_activity: existing.favorite_activity || activityOptions[0] || '',
    personal_caption: existing.personal_caption || '',
    post_trip_storyline: existing.post_trip_storyline || movie?.tagline || '',
    trip_rating: existing.trip_rating || 5,
    photos: existing.photos || [],
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  if (!open || !trip) return null;

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max = 900;
          const scale = Math.min(max / img.width, max / img.height, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const url = canvas.toDataURL('image/jpeg', 0.8);
          setF((prev) => ({ ...prev, photos: [...prev.photos, url].slice(0, 5) }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx) => {
    setF((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) }));
  };

  const saveMemory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post(`/movies/${trip.id}/memory`, f);
      setToast('Memory card saved!');
      if (onSaved) onSaved(res.data.memory);
      setTimeout(() => setToast(''), 2200);
    } finally {
      setSaving(false);
    }
  };

  const handleShareMemory = async () => {
    const url = movie?.share_slug ? `${window.location.origin}/movie/${movie.share_slug}` : window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${movie?.movie_title || trip.title} — Memory Card`,
          text: f.post_trip_storyline || f.personal_caption,
          url,
        });
        return;
      } catch {
        // fallback copy
      }
    }
    await navigator.clipboard.writeText(url);
    setToast('Memory story link copied!');
    setTimeout(() => setToast(''), 2200);
  };

  return (
    <AnimatePresence>
      <motion.div className="share-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="share-modal wide" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
          <div className="share-modal-head">
            <div>
              <span className="eyebrow">Post-Trip Keepsake</span>
              <h2 style={{ marginTop: 4 }}>Create Your Memory Card</h2>
            </div>
            <button type="button" className="link" onClick={onClose}><X size={18} /> Close</button>
          </div>

          <div className="share-modal-grid">
            <form onSubmit={saveMemory}>
              <label className="field">Favourite destination
                <input
                  value={f.favorite_destination}
                  onChange={(e) => setF({ ...f, favorite_destination: e.target.value })}
                />
              </label>

              <label className="field">Favourite activity
                {activityOptions.length > 0 ? (
                  <select
                    value={f.favorite_activity}
                    onChange={(e) => setF({ ...f, favorite_activity: e.target.value })}
                  >
                    {activityOptions.map((act) => <option key={act} value={act}>{act}</option>)}
                  </select>
                ) : (
                  <input
                    value={f.favorite_activity}
                    onChange={(e) => setF({ ...f, favorite_activity: e.target.value })}
                    placeholder="e.g. Sunrise trek or café morning"
                  />
                )}
              </label>

              <label className="field">Post-trip storyline
                <textarea
                  rows={2}
                  value={f.post_trip_storyline}
                  onChange={(e) => setF({ ...f, post_trip_storyline: e.target.value })}
                  placeholder="Somewhere between the mountain roads and the final sunset..."
                />
              </label>

              <label className="field">Personal caption / memory
                <textarea
                  rows={2}
                  value={f.personal_caption}
                  onChange={(e) => setF({ ...f, personal_caption: e.target.value })}
                  placeholder="A small moment you never want to forget"
                />
              </label>

              <div className="field">
                <span>Trip rating</span>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setF({ ...f, trip_rating: n })}
                      style={{ background: 'none', border: 0, padding: 2 }}
                      aria-label={`Rate ${n} stars`}
                    >
                      <Star size={20} fill={n <= f.trip_rating ? '#a8743c' : 'none'} color="#a8743c" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <span>Travel photos (up to 5)</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                  <label className="btn ghost small" style={{ cursor: 'pointer' }}>
                    <Upload size={14} /> Upload photos
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>
                  {f.photos.map((p, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img src={p} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        style={{ position: 'absolute', top: -6, right: -6, background: '#1f2a2b', color: '#fff', border: 0, borderRadius: '50%', width: 18, height: 18, display: 'grid', placeItems: 'center' }}
                        aria-label="Remove photo"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save Memory Card'}</button>
              {toast && <p className="info-banner" style={{ marginTop: 12, marginBottom: 0 }}>{toast}</p>}
            </form>

            <div>
              <MemoryCardPreview movie={movie} memory={f} trip={trip} onShare={handleShareMemory} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
