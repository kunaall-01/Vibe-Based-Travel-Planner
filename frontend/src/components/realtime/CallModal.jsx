import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { useRealtime } from '../../context/RealtimeContext.jsx';

export default function CallModal() {
  const {
    callState,
    callMode,
    activePeer,
    localStream,
    remoteStream,
    micOn,
    camOn,
    callNotice,
    acceptCall,
    declineCall,
    endCall,
    toggleMic,
    toggleCam,
  } = useRealtime();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  useEffect(() => {
    if (callState !== 'connected') {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [callState]);

  if (callState === 'idle' || !activePeer) return null;

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <AnimatePresence>
      <motion.div className="call-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="call-window" initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="call-top">
            <span className="live-dot-badge">
              <span className="pulse-green" /> {callMode === 'video' ? 'Real-Time Video Call' : 'Real-Time Audio Call'}
            </span>
            {callState === 'connected' && <span className="call-timer">{mins}:{secs}</span>}
          </div>

          <div className="call-stage">
            {callState === 'connected' ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="call-remote-video"
                />
                <div className="call-remote-fallback">
                  <img src={activePeer.img || 'https://i.pravatar.cc/200?img=12'} alt={activePeer.name} />
                  <h3>{activePeer.name}</h3>
                  <small>{callNotice || (callMode === 'audio' ? 'Audio connected' : 'Live WebRTC stream')}</small>
                </div>
                {localStream && (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="call-local-pip"
                  />
                )}
              </>
            ) : (
              <div className="call-ring-stage">
                <div className="call-ring-avatar">
                  <img src={activePeer.img || 'https://i.pravatar.cc/200?img=12'} alt={activePeer.name} />
                </div>
                <h2>{activePeer.name}</h2>
                <p>
                  {callState === 'incoming'
                    ? `Incoming ${callMode} call…`
                    : `Ringing ${activePeer.name}…`}
                </p>
                {callNotice && <small className="call-notice">{callNotice}</small>}
              </div>
            )}
          </div>

          <div className="call-controls">
            {callState === 'incoming' ? (
              <>
                <button type="button" className="call-btn accept" onClick={() => acceptCall('video')}>
                  <Video size={18} /> Accept Video
                </button>
                <button type="button" className="call-btn accept-audio" onClick={() => acceptCall('audio')}>
                  <Phone size={18} /> Audio Only
                </button>
                <button type="button" className="call-btn decline" onClick={declineCall}>
                  <PhoneOff size={18} /> Decline
                </button>
              </>
            ) : (
              <>
                <button type="button" className={`call-btn toggle ${!micOn ? 'off' : ''}`} onClick={toggleMic} title="Toggle Mic">
                  {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button type="button" className={`call-btn toggle ${!camOn ? 'off' : ''}`} onClick={toggleCam} title="Toggle Camera">
                  {camOn ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
                <button type="button" className="call-btn decline" onClick={endCall}>
                  <PhoneOff size={18} /> End Call
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
