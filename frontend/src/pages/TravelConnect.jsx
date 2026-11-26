import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Check, Edit3, X, Upload, Plus, MessageCircle,
  Phone, Video, ShieldCheck, Send, Compass, Inbox
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import ChatDrawer from '../components/realtime/ChatDrawer.jsx';
import VideoWall from '../components/realtime/VideoWall.jsx';

const AVATAR_PRESETS = [
  'https://i.pravatar.cc/200?img=47',
  'https://i.pravatar.cc/200?img=12',
  'https://i.pravatar.cc/200?img=11',
  'https://i.pravatar.cc/200?img=32',
  'https://i.pravatar.cc/200?img=15',
  'https://i.pravatar.cc/200?img=53',
];

export default function TravelConnect() {
  const { user } = useAuth();
  const { lastRequestEvent, startCall } = useRealtime();
  const [data, setData] = useState({
    Buddies: [], Locals: [], Groups: [],
    requested: {}, connections: {}, incoming_requests: [], outgoing_requests: [],
  });
  const [tab, setTab] = useState('VideoWall');
  const [done, setDone] = useState({});
  const [editing, setEditing] = useState(null);
  const [localReqModal, setLocalReqModal] = useState(null); // target local guide
  const [localReqForm, setLocalReqForm] = useState({ destination: '', preferred_date: '', message: '' });
  const [chatPeer, setChatPeer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const loadConnect = () => {
    api.get('/connect').then((res) => {
      setData(res.data);
      if (res.data.requested) setDone(res.data.requested);
    });
  };

  useEffect(() => {
    loadConnect();
  }, []);

  useEffect(() => {
    if (lastRequestEvent) loadConnect();
  }, [lastRequestEvent]);

  const act = async (p) => {
    if (tab === 'Locals' && !done[`Locals-${p.id}`]) {
      setLocalReqModal(p);
      setLocalReqForm({
        destination: p.place || '',
        preferred_date: '',
        message: `Hi ${p.name}! I'm visiting ${p.place || 'soon'} and would love local tips or a guided meetup.`,
      });
      return;
    }

    const key = `${tab}-${p.id}`;
    try {
      const res = await api.post('/connect/request', { id: p.id, tab });
      setDone((d) => ({ ...d, [key]: res.data.state || false }));
      setToast(res.data.message || 'Updated');
      setTimeout(() => setToast(''), 2200);
      loadConnect();
    } catch (err) {
      setToast(err.response?.data?.message || 'Could not update request');
      setTimeout(() => setToast(''), 2200);
    }
  };

  const submitLocalRequest = async (e) => {
    e.preventDefault();
    if (!localReqModal) return;
    setSaving(true);
    try {
      const res = await api.post('/connect/request', {
        id: localReqModal.id,
        tab: 'Locals',
        request_type: 'local',
        destination: localReqForm.destination,
        preferred_date: localReqForm.preferred_date,
        message: localReqForm.message,
        force_update: true,
      });
      setDone((d) => ({ ...d, [`Locals-${localReqModal.id}`]: res.data.state || 'Pending' }));
      setLocalReqModal(null);
      setToast('Request sent to local host!');
      setTimeout(() => setToast(''), 2400);
      loadConnect();
    } finally {
      setSaving(false);
    }
  };

  const respondRequest = async (reqId, status) => {
    await api.patch(`/connect/request/${reqId}`, { status });
    setToast(`Request ${status.toLowerCase()}`);
    setTimeout(() => setToast(''), 2200);
    loadConnect();
  };

  const openEdit = (p) => {
    setEditing({
      isNew: false,
      category: tab,
      id: p.id,
      name: p.name || '',
      place: p.place || '',
      bio: p.bio || '',
      img: p.img || '',
      tagsText: (p.tags || []).join(', '),
    });
  };

  const openNew = () => {
    setEditing({
      isNew: true,
      category: tab === 'VideoWall' || tab === 'Requests' ? 'Buddies' : tab,
      id: null,
      name: '',
      place: '',
      bio: '',
      img: AVATAR_PRESETS[0],
      tagsText: '',
    });
  };

  const handleFileUpload = (e) => {
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
        setEditing((prev) => ({ ...prev, img: canvas.toDataURL('image/jpeg', 0.82) }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: editing.name.trim(),
        place: editing.place.trim(),
        bio: editing.bio.trim(),
        img: editing.img.trim(),
        tags: editing.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      };
      if (editing.isNew) {
        await api.post(`/connect/${editing.category}`, payload);
        setToast(`Added to ${editing.category}`);
      } else {
        await api.put(`/connect/${editing.category}/${editing.id}`, payload);
        setToast('Profile updated in database');
      }
      setEditing(null);
      loadConnect();
      setTimeout(() => setToast(''), 2400);
    } finally {
      setSaving(false);
    }
  };

  const incoming = data.incoming_requests || [];
  const pendingCount = incoming.filter((r) => r.status === 'Pending').length;
  const list = data[tab] || [];

  const tabs = [
    ['VideoWall', 'Video Wall (Live)'],
    ['Buddies', 'Buddies'],
    ['Locals', 'Local Communities'],
    ['Groups', 'Group Activities'],
    ['Requests', `Inbox (${pendingCount})`],
  ];

  return (
    <div className="wrap page">
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="eyebrow">Travel Connect · Real-Time Community</span>
          <h1>Travel with good company</h1>
          <p className="lead">
            Watch live travel clips on the Video Wall, message or video call buddies & local communities in real time, or register yourself as a local host.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/register-local" className="btn ghost small">
            <Compass size={14} /> Register as Local Community
          </Link>
          {['Buddies', 'Locals', 'Groups'].includes(tab) && (
            <button className="btn small" onClick={openNew}>
              <Plus size={15} /> Add {tab === 'Groups' ? 'group' : tab === 'Locals' ? 'local' : 'buddy'}
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        {tabs.map(([key, label]) => (
          <button key={key} className={key === tab ? 'tab on' : 'tab'} onClick={() => setTab(key)}>
            {key === 'Requests' && <Inbox size={13} style={{ marginRight: 5 }} />}
            {label}
          </button>
        ))}
      </div>

      {tab === 'VideoWall' && <VideoWall onOpenChat={(peer) => setChatPeer(peer)} />}

      {tab === 'Requests' && (
        <div className="grid g2">
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Incoming Requests ({incoming.length})</h3>
            {incoming.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No incoming requests yet. Register as a local community or connect with travelers!</p>
            ) : (
              incoming.map((r) => (
                <div key={r.request_id} className="req-item">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img src={r.sender_img || AVATAR_PRESETS[0]} alt={r.sender_name} className="chat-avatar" />
                    <div>
                      <b>{r.sender_name}</b>
                      <small style={{ display: 'block', color: 'var(--muted)' }}>
                        {r.request_type === 'local' ? 'Local Guide Request' : 'Buddy Request'}
                        {r.destination ? ` · ${r.destination}` : ''}
                        {r.preferred_date ? ` · ${r.preferred_date}` : ''}
                      </small>
                    </div>
                  </div>
                  <p style={{ margin: '10px 0', fontSize: '.9rem' }}>{r.message}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {r.status === 'Pending' ? (
                      <>
                        <button className="btn small" onClick={() => respondRequest(r.request_id, 'Accepted')}>Accept</button>
                        <button className="btn ghost small" onClick={() => respondRequest(r.request_id, 'Rejected')}>Decline</button>
                      </>
                    ) : (
                      <span className="tag">{r.status}</span>
                    )}
                    <button
                      className="btn ghost small"
                      onClick={() => setChatPeer({ id: r.sender_id, name: r.sender_name, img: r.sender_img, place: r.sender_city })}
                    >
                      <MessageCircle size={13} /> Chat
                    </button>
                    <button
                      className="btn ghost small"
                      onClick={() => startCall({ id: r.sender_id, name: r.sender_name, img: r.sender_img }, 'video')}
                    >
                      <Video size={13} /> Call
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Sent Requests ({(data.outgoing_requests || []).length})</h3>
            {(data.outgoing_requests || []).length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>You haven’t sent any requests yet.</p>
            ) : (
              data.outgoing_requests.map((r) => (
                <div key={r.request_id} className="req-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b>{r.receiver_name}</b>
                    <span className="tag">{r.status}</span>
                  </div>
                  <small style={{ color: 'var(--muted)' }}>{r.destination} {r.preferred_date ? `· ${r.preferred_date}` : ''}</small>
                  <p style={{ margin: '8px 0', fontSize: '.88rem', color: 'var(--muted)' }}>{r.message}</p>
                  <button
                    className="btn ghost small"
                    onClick={() => setChatPeer({ id: r.receiver_id, name: r.receiver_name, img: r.receiver_img, place: r.receiver_city })}
                  >
                    <MessageCircle size={13} /> Chat
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {['Buddies', 'Locals', 'Groups'].includes(tab) && (
        <div className="grid g3">
          {list.map((p, i) => {
            const reqState = done[`${tab}-${p.id}`];
            const isSelf = user && p.id === user.user_id && tab !== 'Groups';
            return (
              <motion.div
                key={tab + p.id}
                className="card person"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <button className="iconbtn" onClick={() => openEdit(p)} title="Edit photo & info" aria-label={`Edit ${p.name}`}>
                  <Edit3 size={14} />
                </button>
                <img className="av" src={p.img} alt={p.name} onError={(e) => { e.currentTarget.src = AVATAR_PRESETS[0]; }} />
                <h3>
                  {p.name}
                  {p.verified ? <ShieldCheck size={15} color="#5f8a6a" style={{ marginLeft: 5, verticalAlign: 'middle' }} /> : null}
                </h3>
                {p.community_name && <small style={{ display: 'block', color: 'var(--brass)', fontWeight: 600 }}>{p.community_name}</small>}
                <small style={{ color: 'var(--muted)' }}>{p.place}{p.languages ? ` · ${p.languages}` : ''}</small>
                <p>{p.spots_text ? `${p.spots_text}. ${p.bio}` : p.bio}</p>
                <div style={{ marginBottom: 14 }}>
                  {(p.tags || []).map((t) => <span className="tag" key={t}>{t}</span>)}
                </div>

                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {!isSelf && (
                    <button className={reqState ? 'btn ghost small' : 'btn small'} onClick={() => act(p)}>
                      {reqState ? (
                        <><Check size={13} /> {reqState === 'Accepted' ? 'Connected' : reqState}</>
                      ) : (
                        <><UserPlus size={13} /> {tab === 'Groups' ? 'Join' : tab === 'Locals' ? 'Request Local' : 'Connect'}</>
                      )}
                    </button>
                  )}

                  {tab !== 'Groups' && !isSelf && (
                    <>
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => setChatPeer(p)}
                        title="Real-time Chat"
                      >
                        <MessageCircle size={13} /> Chat
                      </button>
                      <button
                        type="button"
                        className="iconbtn-inline"
                        onClick={() => startCall(p, 'audio')}
                        title="Audio Call"
                      >
                        <Phone size={13} />
                      </button>
                      <button
                        type="button"
                        className="iconbtn-inline"
                        onClick={() => startCall(p, 'video')}
                        title="Video Call"
                      >
                        <Video size={13} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Request Local Modal */}
      <AnimatePresence>
        {localReqModal && (
          <motion.div className="share-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLocalReqModal(null)}>
            <motion.form
              className="share-modal"
              style={{ width: 'min(480px, 100%)' }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={submitLocalRequest}
            >
              <div className="share-modal-head">
                <div>
                  <span className="eyebrow">Request Local Host</span>
                  <h2 style={{ marginTop: 4 }}>{localReqModal.name}</h2>
                  <small style={{ color: 'var(--muted)' }}>{localReqModal.community_name || localReqModal.place}</small>
                </div>
                <button type="button" className="link" onClick={() => setLocalReqModal(null)}><X size={18} /></button>
              </div>
              <label className="field">Destination / City
                <input value={localReqForm.destination} onChange={(e) => setLocalReqForm({ ...localReqForm, destination: e.target.value })} required />
              </label>
              <label className="field">Preferred Meetup Date
                <input type="date" value={localReqForm.preferred_date} onChange={(e) => setLocalReqForm({ ...localReqForm, preferred_date: e.target.value })} />
              </label>
              <label className="field">Message to Local
                <textarea rows={3} value={localReqForm.message} onChange={(e) => setLocalReqForm({ ...localReqForm, message: e.target.value })} required />
              </label>
              <button className="btn" disabled={saving}><Send size={14} /> {saving ? 'Sending…' : 'Send Local Request'}</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Photo & Info Drawer */}
      <AnimatePresence>
        {editing && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(null)}>
            <motion.aside className="drawer" initial={{ x: 60 }} animate={{ x: 0 }} exit={{ x: 60 }} onClick={(e) => e.stopPropagation()}>
              <button className="link" onClick={() => setEditing(null)}><X size={16} /> Close</button>
              <h2 style={{ margin: '14px 0 18px' }}>
                {editing.isNew ? `Add ${editing.category.slice(0, -1)}` : `Edit ${editing.name}`}
              </h2>
              <form onSubmit={saveEdit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <img
                    src={editing.img || AVATAR_PRESETS[0]}
                    alt="Preview"
                    style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', background: 'var(--line)' }}
                  />
                  <label className="btn ghost small" style={{ cursor: 'pointer' }}>
                    <Upload size={14} /> Upload photo
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  {AVATAR_PRESETS.map((url) => (
                    <button
                      type="button"
                      key={url}
                      onClick={() => setEditing({ ...editing, img: url })}
                      style={{
                        border: editing.img === url ? '2px solid var(--brass)' : '1px solid var(--line)',
                        borderRadius: '50%', padding: 2, background: 'none'
                      }}
                    >
                      <img src={url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
                <label className="field">Photo URL<input value={editing.img} onChange={(e) => setEditing({ ...editing, img: e.target.value })} /></label>
                <label className="field">Name / Title<input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required /></label>
                <label className="field">City / Place<input value={editing.place} onChange={(e) => setEditing({ ...editing, place: e.target.value })} /></label>
                <label className="field">Bio / Description<textarea rows={3} value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} /></label>
                <label className="field">Tags (comma separated)<input value={editing.tagsText} onChange={(e) => setEditing({ ...editing, tagsText: e.target.value })} /></label>
                <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
              </form>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

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
