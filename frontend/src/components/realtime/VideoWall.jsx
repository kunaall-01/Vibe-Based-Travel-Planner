import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Upload, Heart, MessageCircle, PhoneCall, Radio, Square, Circle, Play, Pause } from 'lucide-react';
import { api } from '../../api/client.js';
import { useRealtime } from '../../context/RealtimeContext.jsx';

const DEST_FILTERS = ['All', 'Manali', 'Jaipur', 'Goa', 'Udaipur', 'Rishikesh', 'Kyoto', 'Paris'];

function ReelCard({ post, onLike, onChat, onCall }) {
  const [playing, setPlaying] = useState(false);

  return (
    <motion.article
      layout
      className="card video-wall-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="video-stage">
        {post.video_url ? (
          <video
            src={post.video_url}
            poster={post.poster_url}
            controls
            playsInline
            loop
            className="video-player"
          />
        ) : (
          <div className={`reel-kenburns ${playing ? 'playing' : ''}`} onClick={() => setPlaying(!playing)}>
            <img src={post.poster_url} alt={post.destination} />
            <div className="reel-shade" />
            <span className="reel-play-btn">
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </span>
            <span className="reel-live-tag">
              <Radio size={12} /> {post.destination} · {post.vibe}
            </span>
          </div>
        )}
      </div>

      <div className="video-card-body">
        <div className="video-author-row">
          <img src={post.author_avatar || 'https://i.pravatar.cc/200?img=20'} alt={post.author_name} />
          <div>
            <b>{post.author_name}</b>
            <small>{post.destination}</small>
          </div>
        </div>

        <p className="video-caption">{post.caption}</p>

        <div className="video-actions-row">
          <button
            type="button"
            className={`chip ${post.liked_by_me ? 'on' : ''}`}
            onClick={() => onLike(post.post_id)}
          >
            <Heart size={13} fill={post.liked_by_me ? 'currentColor' : 'none'} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            {post.likes_count || 0}
          </button>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="chip"
              onClick={() => onChat({ id: post.user_id, name: post.author_name, img: post.author_avatar, place: post.destination })}
              title="Chat in real time"
            >
              <MessageCircle size={13} />
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => onCall({ id: post.user_id, name: post.author_name, img: post.author_avatar, place: post.destination }, 'video')}
              title="Video call creator"
            >
              <PhoneCall size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function VideoWall({ onOpenChat }) {
  const { lastWallEvent, startCall, liveConnected } = useRealtime();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [composerOpen, setComposerOpen] = useState(false);

  // Composer state
  const [destination, setDestination] = useState('Manali');
  const [vibe, setVibe] = useState('mountain');
  const [caption, setCaption] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [recording, setRecording] = useState(false);
  const [posting, setPosting] = useState(false);

  const liveVideoRef = useRef(null);
  const recorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);

  const loadPosts = (dest = filter) => {
    const qs = dest && dest !== 'All' ? `?destination=${encodeURIComponent(dest)}` : '';
    api.get(`/video-wall${qs}`).then((res) => setPosts(res.data.posts || []));
  };

  useEffect(() => {
    loadPosts(filter);
  }, [filter]);

  // Real-time SSE updates across all users!
  useEffect(() => {
    if (!lastWallEvent) return;
    if (lastWallEvent.type === 'video_wall_post') {
      const p = lastWallEvent.payload;
      if (filter === 'All' || p.destination.toLowerCase().includes(filter.toLowerCase())) {
        setPosts((prev) => (prev.some((x) => x.post_id === p.post_id) ? prev : [p, ...prev]));
      }
    } else if (lastWallEvent.type === 'video_wall_like') {
      const { post_id, likes_count } = lastWallEvent.payload;
      setPosts((prev) => prev.map((p) => (p.post_id === post_id ? { ...p, likes_count } : p)));
    }
  }, [lastWallEvent]);

  const startWebcamRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (liveVideoRef.current) liveVideoRef.current.srcObject = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], 'live-travel-clip.webm', { type: 'video/webm' });
        setVideoFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      alert('Camera permission denied or unavailable. You can upload a video file or post a travel moment instead.');
    }
  };

  const stopWebcamRecord = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setVideoFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const submitPost = async (e) => {
    e.preventDefault();
    if (!caption.trim()) return;
    setPosting(true);
    try {
      if (videoFile) {
        const fd = new FormData();
        fd.append('destination', destination);
        fd.append('vibe', vibe);
        fd.append('caption', caption.trim());
        fd.append('video', videoFile);
        await api.post('/video-wall', fd);
      } else {
        await api.post('/video-wall', { destination, vibe, caption: caption.trim() });
      }
      setCaption('');
      setVideoFile(null);
      setPreviewUrl('');
      setComposerOpen(false);
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId) => {
    try {
      const res = await api.post(`/video-wall/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) => (p.post_id === postId ? { ...p, liked_by_me: res.data.liked, likes_count: res.data.likes_count } : p))
      );
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <div className="video-wall-bar">
        <div className="chips" style={{ margin: 0 }}>
          {DEST_FILTERS.map((d) => (
            <button key={d} className={filter === d ? 'chip on' : 'chip'} onClick={() => setFilter(d)}>{d}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="live-dot-badge dark">
            <span className={liveConnected ? 'pulse-green' : ''} /> Live Wall
          </span>
          <button type="button" className="btn small" onClick={() => setComposerOpen(!composerOpen)}>
            <Video size={14} /> {composerOpen ? 'Close' : 'Post Video Moment'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {composerOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card"
            style={{ marginBottom: 22, overflow: 'hidden' }}
            onSubmit={submitPost}
          >
            <h3 style={{ marginBottom: 14 }}>Share a Live Video Moment to the Community Wall</h3>
            <div className="grid g2">
              <label className="field">Destination
                <input value={destination} onChange={(e) => setDestination(e.target.value)} required />
              </label>
              <label className="field">Vibe
                <select value={vibe} onChange={(e) => setVibe(e.target.value)}>
                  <option value="mountain">Mountain Air</option>
                  <option value="beach">Slow Beaches</option>
                  <option value="heritage">Heritage & Culture</option>
                  <option value="adventure">Open Road</option>
                  <option value="food">Food Trails</option>
                  <option value="city">City Lights</option>
                </select>
              </label>
            </div>
            <label className="field">Caption
              <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="What's happening right now where you are?" required />
            </label>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              {!recording ? (
                <button type="button" className="btn ghost small" onClick={startWebcamRecord}>
                  <Circle size={13} color="#b5573f" fill="#b5573f" /> Record from Camera
                </button>
              ) : (
                <button type="button" className="btn small" style={{ background: '#b5573f' }} onClick={stopWebcamRecord}>
                  <Square size={13} /> Stop Recording
                </button>
              )}

              <label className="btn ghost small" style={{ cursor: 'pointer' }}>
                <Upload size={14} /> Upload Video (.mp4 / .webm)
                <input type="file" accept="video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              </label>
            </div>

            {recording && (
              <video ref={liveVideoRef} autoPlay muted playsInline style={{ width: '100%', maxHeight: 260, borderRadius: 12, marginBottom: 12, background: '#000' }} />
            )}
            {previewUrl && !recording && (
              <video src={previewUrl} controls playsInline style={{ width: '100%', maxHeight: 260, borderRadius: 12, marginBottom: 12, background: '#000' }} />
            )}

            <button className="btn small" disabled={posting}>{posting ? 'Publishing live…' : 'Publish to Real-Time Wall'}</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid g3">
        {posts.map((p) => (
          <ReelCard
            key={p.post_id}
            post={p}
            onLike={toggleLike}
            onChat={onOpenChat}
            onCall={startCall}
          />
        ))}
      </div>
    </div>
  );
}
