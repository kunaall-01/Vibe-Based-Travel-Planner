import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, ArrowRight, SkipForward } from 'lucide-react';

export default function TripRevealAnimation({ movie, onEnter }) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    setStep(1);
    const timers = [
      setTimeout(() => setStep(2), 550),
      setTimeout(() => setStep(3), 1150),
      setTimeout(() => setStep(4), 1750),
      setTimeout(() => setStep(5), 2350),
    ];
    return () => timers.forEach(clearTimeout);
  }, [movie?.movie_title]);

  if (!movie) return null;
  const accent = movie.color_palette?.[0]?.hex || '#e7c89a';

  return (
    <motion.div
      className="trailer-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <img
        src={movie.cover_image}
        alt=""
        className="trailer-bg"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <div className="trailer-shade" />

      <button type="button" className="trailer-skip" onClick={onEnter}>
        Skip trailer <SkipForward size={14} />
      </button>

      <div className="trailer-stage">
        <AnimatePresence>
          {step >= 1 && (
            <motion.p
              key="presents"
              className="trailer-eyebrow"
              style={{ color: accent }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Film size={14} /> A WAYFARER ORIGINAL · {movie.destination?.toUpperCase()}
            </motion.p>
          )}

          {step >= 2 && (
            <motion.h1
              key="title"
              className="trailer-title"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              {movie.movie_title}
            </motion.h1>
          )}

          {step >= 3 && (
            <motion.p
              key="tagline"
              className="trailer-tagline"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              “{movie.tagline}”
            </motion.p>
          )}

          {step >= 4 && (
            <motion.p
              key="synopsis"
              className="trailer-synopsis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {movie.synopsis}
            </motion.p>
          )}

          {step >= 5 && (
            <motion.div
              key="chapters"
              className="trailer-chapters"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="trailer-chapter-pills">
                {(movie.chapter_titles || []).map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
              <button type="button" className="btn trailer-cta" onClick={onEnter}>
                Enter Your Movie <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
