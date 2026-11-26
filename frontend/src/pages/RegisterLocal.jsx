import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Upload, MessageCircle, Video, Phone, Check, X } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import ChatDrawer from '../components/realtime/ChatDrawer.jsx';

export default function RegisterLocal() {
  const { user, updateUser } = useAuth();
  const { lastRequestEvent, startCall } = useRealtime();
  const [f, setF] = useState({
    community_name: '',
    city: user?.city || '',
    specialty: 'Heritage Walks & Hidden Gems',
    languages: 'English, Hindi',
    availability: 'Weekends & Mornings',
    offer_type: 'Free Community Meetup',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || 'https://i.pravatar.cc/200?img=32',
  });
  const [requests, setRequests] = useState([]);
  const [registered, setRegistered] = useState(false);
  const [chatPeer, setChatPeer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const loadDashboard = () => {
    api.get('/connect/local-dashboard').then((res) => {
      if (res.data.community) {
        setRegistered(true);
        setF((prev) => ({
          ...prev,
          ...res.data.community,
        }));
      }
      setRequests(res.data.requests || []);
    }).catch(() => {});
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (lastRequestEvent) loadDashboard();
  }, [lastRequestEvent]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 300;
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

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/connect/local-register', f);
      setRegistered(true);
      await updateUser({ city: f.city, bio: f.bio, avatar_url: f.avatar_url });
      setToast(res.data.message || 'Registered as Local Community!');
      setTimeout(() => setToast(''), 2800);
      loadDashboard();
    } finally {
      setSaving(false);
    }
  };

  const respond = async (reqId, status) => {
    await api.patch(`/connect/request/${reqId}`, { status });
    setToast(`Traveller request ${status.toLowerCase()}`);
    setTimeout(() => setToast(''), 2400);
    loadDashboard();
  };

  return (
    <div className="wrap page">
      <div className="head">
        <span className="eyebrow">Local Community Host</span>
        <h1>{registered ? 'Your Local Community Studio' : 'Register as a Local Community'}</h1>
        <p className="lead">
          Host walks, share hidden food spots, and connect with incoming travellers in real time via chat, audio, or video call.
        </p>
      </div>

      <div className="split">
        <form className="card" onSubmit={submit}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3>{registered ? 'Update Community Profile' : 'Community Details'}</h3>
            {registered && (
              <span className="deal-badge">
                <ShieldCheck size={13} /> Live on Travel Connect
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
            <img
              src={f.avatar_url || 'https://i.pravatar.cc/200?img=32'}
              alt="Host avatar"
              style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', background: 'var(--line)' }}
            />
            <label className="btn ghost small" style={{ cursor: 'pointer' }}>
              <Upload size={14} /> Upload community photo
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div className="grid g2">
            <label className="field">Community / Guide Name
              <input
                value={f.community_name}
                onChange={(e) => setF({ ...f, community_name: e.target.value })}
                placeholder="e.g. Old Manali Trail Collective"
                required
              />
            </label>
            <label className="field">City / Destination
              <input
                value={f.city}
                onChange={(e) => setF({ ...f, city: e.target.value })}
                placeholder="e.g. Manali, Jaipur, Goa"
                required
              />
            </label>
            <label className="field">Specialty
              <select value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })}>
                <option>Heritage Walks & Hidden Gems</option>
                <option>Street Food & Cafe Trails</option>
                <option>Mountain Hikes & Nature</option>
                <option>Photography & Sunset Spots</option>
                <option>Nightlife & Music Culture</option>
              </select>
            </label>
            <label className="field">Hosting Style
              <select value={f.offer_type} onChange={(e) => setF({ ...f, offer_type: e.target.value })}>
                <option>Free Community Meetup</option>
                <option>Guided Walk</option>
                <option>Home-Cooked Experience</option>
                <option>Local Coffee & Tips</option>
              </select>
            </label>
            <label className="field">Languages Spoken
              <input value={f.languages} onChange={(e) => setF({ ...f, languages: e.target.value })} />
            </label>
            <label className="field">Availability
              <input value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value })} />
            </label>
          </div>

          <label className="field">Bio & What Travellers Can Expect
            <textarea
              rows={3}
              value={f.bio}
              onChange={(e) => setF({ ...f, bio: e.target.value })}
              placeholder="Share what makes your city special and how travellers can join you..."
              required
            />
          </label>

          <button className="btn" disabled={saving}>
            {saving ? 'Saving…' : registered ? 'Update Local Community' : 'Publish & Connect with Travellers'}
          </button>
        </form>

        <div className="card">
          <span className="eyebrow">Real-Time Inbox</span>
          <h3 style={{ margin: '6px 0 14px' }}>Traveller Requests ({requests.length})</h3>

          {requests.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '.92rem' }}>
              Once travellers request a meetup or local advice from Travel Connect, their requests appear here in real time so you can accept, chat, or video call.
            </p>
          ) : (
            requests.map((r) => (
              <div key={r.request_id} className="req-item">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <img src={r.traveller_img || 'https://i.pravatar.cc/200?img=11'} alt={r.traveller_name} className="chat-avatar" />
                  <div>
                    <b>{r.traveller_name}</b>
                    <small style={{ display: 'block', color: 'var(--muted)' }}>
                      {r.destination || f.city} {r.preferred_date ? `· ${r.preferred_date}` : ''}
                    </small>
                  </div>
                </div>
                <p style={{ margin: '8px 0 10px', fontSize: '.88rem' }}>{r.message}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {r.status === 'Pending' ? (
                    <>
                      <button className="btn small" onClick={() => respond(r.request_id, 'Accepted')}>
                        <Check size={13} /> Accept
                      </button>
                      <button className="btn ghost small" onClick={() => respond(r.request_id, 'Rejected')}>
                        <X size={13} /> Decline
                      </button>
                    </>
                  ) : (
                    <span className="tag">{r.status}</span>
                  )}
                  <button
                    className="btn ghost small"
                    onClick={() => setChatPeer({ id: r.sender_id, name: r.traveller_name, img: r.traveller_img, place: r.traveller_city })}
                  >
                    <MessageCircle size={13} /> Chat
                  </button>
                  <button
                    className="iconbtn-inline"
                    onClick={() => startCall({ id: r.sender_id, name: r.traveller_name, img: r.traveller_img }, 'audio')}
                    title="Audio Call"
                  >
                    <Phone size={13} />
                  </button>
                  <button
                    className="iconbtn-inline"
                    onClick={() => startCall({ id: r.sender_id, name: r.traveller_name, img: r.traveller_img }, 'video')}
                    title="Video Call"
                  >
                    <Video size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ChatDrawer peer={chatPeer} onClose={() => setChatPeer(null)} />

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
