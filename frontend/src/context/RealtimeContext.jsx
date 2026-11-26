import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const RealtimeCtx = createContext(null);
export const useRealtime = () => useContext(RealtimeCtx);

const CURRENCIES = {
  INR: { symbol: '₹', rate: 1, locale: 'en-IN' },
  USD: { symbol: '$', rate: 0.012, locale: 'en-US' },
  EUR: { symbol: '€', rate: 0.011, locale: 'de-DE' },
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

function createFallbackStream() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1f2e2c';
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#e7c89a';
    ctx.font = '600 28px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Wayfarer Live Call', 320, 230);
    ctx.fillStyle = '#f7f2ea';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Camera unavailable — Audio / Signal active', 320, 268);
    return canvas.captureStream(5);
  } catch {
    return null;
  }
}

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'INR');
  const [liveConnected, setLiveConnected] = useState(false);

  // Live reactive event counters/payloads
  const [lastChatMessage, setLastChatMessage] = useState(null);
  const [lastWallEvent, setLastWallEvent] = useState(null);
  const [lastRequestEvent, setLastRequestEvent] = useState(null);
  const [liveNotice, setLiveNotice] = useState('');

  // WebRTC Call State
  const [callState, setCallState] = useState('idle'); // idle | outgoing | incoming | connected
  const [callMode, setCallMode] = useState('video'); // video | audio
  const [activePeer, setActivePeer] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [callNotice, setCallNotice] = useState('');

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const pendingIceRef = useRef([]);
  const activePeerRef = useRef(null);

  useEffect(() => {
    activePeerRef.current = activePeer;
  }, [activePeer]);

  const changeCurrency = (c) => {
    if (CURRENCIES[c]) {
      setCurrency(c);
      localStorage.setItem('currency', c);
    }
  };

  const formatMoney = (inrAmount) => {
    const cfg = CURRENCIES[currency] || CURRENCIES.INR;
    const val = Number(inrAmount || 0) * cfg.rate;
    const rounded = currency === 'INR' ? Math.round(val) : Math.round(val * 100) / 100;
    return cfg.symbol + rounded.toLocaleString(cfg.locale);
  };

  const cleanupCall = () => {
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    pendingOfferRef.current = null;
    pendingIceRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setActivePeer(null);
    setCallNotice('');
    setMicOn(true);
    setCamOn(true);
  };

  const acquireMedia = async (mode) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCamOn(mode === 'video');
      setMicOn(true);
      return stream;
    } catch {
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = audioOnly;
        setLocalStream(audioOnly);
        setCamOn(false);
        setCallNotice('Camera busy or blocked — connected with microphone.');
        return audioOnly;
      } catch {
        const fallback = createFallbackStream();
        localStreamRef.current = fallback;
        setLocalStream(fallback);
        setCamOn(false);
        setMicOn(false);
        setCallNotice('No camera/mic permission — simulated live video stream active.');
        return fallback;
      }
    }
  };

  const createPeerConnection = (peerId, mode, stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    const remote = new MediaStream();
    setRemoteStream(remote);
    pc.ontrack = (ev) => {
      ev.streams[0]?.getTracks().forEach((t) => remote.addTrack(t));
      setRemoteStream(new MediaStream(remote.getTracks()));
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        api.post('/realtime/signal', {
          target_id: peerId,
          signal_type: 'ice',
          call_mode: mode,
          payload: { candidate: ev.candidate },
        }).catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        // leave explicit hangup to user unless disconnected intentionally
      }
    };

    return pc;
  };

  const startCall = async (peer, mode = 'video') => {
    if (!user || !peer?.id) return;
    setActivePeer(peer);
    setCallMode(mode);
    setCallState('outgoing');
    setCallNotice('');

    const stream = await acquireMedia(mode);
    const pc = createPeerConnection(peer.id, mode, stream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await api.post('/realtime/signal', {
      target_id: peer.id,
      signal_type: 'offer',
      call_mode: mode,
      payload: { sdp: offer },
    });
  };

  const acceptCall = async (chosenMode) => {
    if (!activePeer || !pendingOfferRef.current) return;
    const mode = chosenMode || callMode;
    setCallMode(mode);

    const stream = await acquireMedia(mode);
    const pc = createPeerConnection(activePeer.id, mode, stream);
    await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));

    for (const c of pendingIceRef.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
    pendingIceRef.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await api.post('/realtime/signal', {
      target_id: activePeer.id,
      signal_type: 'answer',
      call_mode: mode,
      payload: { sdp: answer },
    });
    setCallState('connected');
  };

  const declineCall = async () => {
    if (activePeer?.id) {
      api.post('/realtime/signal', {
        target_id: activePeer.id,
        signal_type: 'decline',
        call_mode: callMode,
      }).catch(() => {});
    }
    cleanupCall();
  };

  const endCall = async () => {
    if (activePeer?.id) {
      api.post('/realtime/signal', {
        target_id: activePeer.id,
        signal_type: 'hangup',
        call_mode: callMode,
      }).catch(() => {});
    }
    cleanupCall();
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const next = !micOn;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = next; });
    setMicOn(next);
  };

  const toggleCam = () => {
    if (!localStreamRef.current) return;
    const next = !camOn;
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = next; });
    setCamOn(next);
  };

  // Subscribe to SSE Real-Time Stream
  useEffect(() => {
    const token = localStorage.getItem('token');
    const url = token ? `/api/realtime/stream?token=${encodeURIComponent(token)}` : '/api/realtime/stream';
    const es = new EventSource(url);

    es.onopen = () => setLiveConnected(true);
    es.onerror = () => setLiveConnected(false);

    es.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'connected') {
          setLiveConnected(true);
        } else if (msg.type === 'chat_message') {
          setLastChatMessage({ ...msg.payload, _ts: Date.now() });
          if (user && msg.payload.sender_id !== user.user_id) {
            setLiveNotice(`New message from ${msg.payload.sender_name}: ${msg.payload.text.slice(0, 40)}`);
            setTimeout(() => setLiveNotice(''), 3500);
          }
        } else if (msg.type === 'video_wall_post' || msg.type === 'video_wall_like') {
          setLastWallEvent({ type: msg.type, payload: msg.payload, _ts: Date.now() });
        } else if (msg.type === 'connection_request' || msg.type === 'request_response' || msg.type === 'local_community_registered') {
          setLastRequestEvent({ type: msg.type, payload: msg.payload, _ts: Date.now() });
          if (msg.type === 'connection_request') {
            setLiveNotice(`New request from ${msg.payload.sender_name}!`);
            setTimeout(() => setLiveNotice(''), 4000);
          } else if (msg.type === 'request_response') {
            setLiveNotice(`${msg.payload.responder_name} ${msg.payload.status.toLowerCase()} your request!`);
            setTimeout(() => setLiveNotice(''), 4000);
          }
        } else if (msg.type === 'call_signal') {
          const sig = msg.payload;
          if (sig.signal_type === 'offer') {
            pendingOfferRef.current = sig.payload.sdp;
            pendingIceRef.current = [];
            setActivePeer({ id: sig.from_id, name: sig.from_name, img: sig.from_avatar });
            setCallMode(sig.call_mode || 'video');
            setCallState('incoming');
          } else if (sig.signal_type === 'answer') {
            if (pcRef.current && sig.payload?.sdp) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(sig.payload.sdp));
              for (const c of pendingIceRef.current) {
                try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch {}
              }
              pendingIceRef.current = [];
              setCallState('connected');
            }
          } else if (sig.signal_type === 'ice') {
            if (pcRef.current && pcRef.current.remoteDescription && sig.payload?.candidate) {
              try { await pcRef.current.addIceCandidate(new RTCIceCandidate(sig.payload.candidate)); } catch {}
            } else if (sig.payload?.candidate) {
              pendingIceRef.current.push(sig.payload.candidate);
            }
          } else if (sig.signal_type === 'decline') {
            setLiveNotice(`${activePeerRef.current?.name || 'User'} declined the call.`);
            setTimeout(() => setLiveNotice(''), 3000);
            cleanupCall();
          } else if (sig.signal_type === 'hangup') {
            cleanupCall();
          }
        }
      } catch {
        // ignore keepalive parse
      }
    };

    return () => {
      es.close();
      setLiveConnected(false);
    };
  }, [user?.user_id]);

  return (
    <RealtimeCtx.Provider
      value={{
        currency,
        changeCurrency,
        formatMoney,
        liveConnected,
        lastChatMessage,
        lastWallEvent,
        lastRequestEvent,
        liveNotice,
        callState,
        callMode,
        activePeer,
        localStream,
        remoteStream,
        micOn,
        camOn,
        callNotice,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMic,
        toggleCam,
      }}
    >
      {children}
    </RealtimeCtx.Provider>
  );
}
