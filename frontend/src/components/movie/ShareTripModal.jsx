import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Share2, Check } from 'lucide-react';
import MovieTripCard from './MovieTripCard.jsx';
import { downloadMoviePosterPng } from '../../utils/posterCanvas.js';

export default function ShareTripModal({ open, onClose, movie, shareSlug, onEnsureSaved }) {
  const [format, setFormat] = useState('4:5');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState('');

  if (!open || !movie) return null;

  const getShareUrl = async () => {
    let slug = shareSlug || movie.share_slug;
    if (!slug && onEnsureSaved) {
      slug = await onEnsureSaved();
    }
    if (slug) return `${window.location.origin}/movie/${slug}`;
    return window.location.href;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadMoviePosterPng(movie, format);
      setMsg('Poster downloaded as PNG');
      setTimeout(() => setMsg(''), 2200);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    const url = await getShareUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setMsg('Movie link copied!');
    setTimeout(() => { setCopied(false); setMsg(''); }, 2400);
  };

  const handleNativeShare = async () => {
    const url = await getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.movie_title,
          text: `${movie.movie_title} — “${movie.tagline}”`,
          url,
        });
        return;
      } catch {
        // user cancelled or unavailable -> fallback copy
      }
    }
    await handleCopy();
  };

  return (
    <AnimatePresence>
      <motion.div className="share-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="share-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
          <div className="share-modal-head">
            <div>
              <span className="eyebrow">Shareable Poster</span>
              <h2 style={{ marginTop: 4 }}>Share Your Trip Movie</h2>
            </div>
            <button type="button" className="link" onClick={onClose}><X size={18} /> Close</button>
          </div>

          <div className="share-format-row">
            <button type="button" className={format === '4:5' ? 'tab on' : 'tab'} onClick={() => setFormat('4:5')}>
              4:5 Feed Poster
            </button>
            <button type="button" className={format === '9:16' ? 'tab on' : 'tab'} onClick={() => setFormat('9:16')}>
              9:16 Instagram Story
            </button>
          </div>

          <div className="share-modal-grid">
            <div className="share-preview-wrap">
              <MovieTripCard movie={movie} format={format} />
            </div>

            <div className="share-actions-col">
              <p className="lead" style={{ marginTop: 0, marginBottom: 18 }}>
                Export a high-resolution movie poster for Instagram Stories, WhatsApp, or share the interactive film story link.
              </p>

              <button type="button" className="btn" onClick={handleDownload} disabled={downloading} style={{ width: '100%', justifyContent: 'center' }}>
                <Download size={16} /> {downloading ? 'Rendering PNG…' : `Download ${format} PNG`}
              </button>

              <button type="button" className="btn ghost" onClick={handleCopy} style={{ width: '100%', justifyContent: 'center' }}>
                {copied ? <><Check size={16} /> Link Copied</> : <><Copy size={16} /> Copy Trip Link</>}
              </button>

              <button type="button" className="btn ghost" onClick={handleNativeShare} style={{ width: '100%', justifyContent: 'center' }}>
                <Share2 size={16} /> Share Trip
              </button>

              {msg && <p className="info-banner" style={{ marginTop: 8, marginBottom: 0 }}>{msg}</p>}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
