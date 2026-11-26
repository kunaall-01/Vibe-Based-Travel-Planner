import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Phone, Video } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRealtime } from '../../context/RealtimeContext.jsx';

const QUICK_PROMPTS = [
  'Hey! Are you around this weekend?',
  'Would love local food & cafe spots!',
  'Down to explore together at sunrise?',
];

export default function ChatDrawer({ peer, onClose }) {
  const { user } = useAuth();
  const { lastChatMessage, startCall, liveConnected } = useRealtime();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!peer?.id) return;
    api.get(`/chat/${peer.id}`).then((res) => {
      setMessages(res.data.messages || []);
    });
  }, [peer?.id]);

  useEffect(() => {
    if (!lastChatMessage || !peer?.id || !user) return;
    const involvesPeer =
      (lastChatMessage.sender_id === peer.id && lastChatMessage.receiver_id === user.user_id) ||
      (lastChatMessage.sender_id === user.user_id && lastChatMessage.receiver_id === peer.id);
    if (involvesPeer) {
      setMessages((prev) => (prev.some((m) => m.id === lastChatMessage.id) ? prev : [...prev, lastChatMessage]));
    }
  }, [lastChatMessage, peer?.id, user?.user_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!peer) return null;

  const send = async (msgText) => {
    const clean = (msgText ?? text).trim();
    if (!clean) return;
    setSending(true);
    try {
      const res = await api.post(`/chat/${peer.id}`, { text: clean });
      const created = res.data.message;
      setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
      if (msgText === undefined) setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.aside className="drawer chat-drawer" initial={{ x: 80 }} animate={{ x: 0 }} exit={{ x: 80 }} onClick={(e) => e.stopPropagation()}>
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={peer.img || 'https://i.pravatar.cc/200?img=12'} alt={peer.name} className="chat-avatar" />
              <div>
                <h3 style={{ margin: 0 }}>{peer.name}</h3>
                <small style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className={liveConnected ? 'pulse-green' : ''} />
                  {peer.place || 'Traveler'} · {liveConnected ? 'Real-time live' : 'Connected'}
                </small>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" className="iconbtn-inline" title="Audio Call" onClick={() => startCall(peer, 'audio')}>
                <Phone size={15} />
              </button>
              <button type="button" className="iconbtn-inline" title="Video Call" onClick={() => startCall(peer, 'video')}>
                <Video size={15} />
              </button>
              <button type="button" className="link" onClick={onClose}><X size={18} /></button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 12px', color: 'var(--muted)' }}>
                <p>Start a real-time conversation with {peer.name}.</p>
                <div className="chips" style={{ justifyContent: 'center', marginTop: 12 }}>
                  {QUICK_PROMPTS.map((q) => (
                    <button key={q} type="button" className="chip" style={{ fontSize: '.76rem' }} onClick={() => send(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const mine = m.sender_id === user?.user_id;
              return (
                <div key={m.id} className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}>
                  <p>{m.text}</p>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <form
            className="chat-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              placeholder={`Message ${peer.name}…`}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="btn small" disabled={sending || !text.trim()}>
              <Send size={14} />
            </button>
          </form>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}
